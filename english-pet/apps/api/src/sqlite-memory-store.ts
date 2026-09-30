import { randomUUID } from 'node:crypto'
import type {
  Memory,
  MemoryActionRequest,
  MemoryConfidence,
  MemoryKind,
  MemoryListResponse,
  MemorySearchContext,
} from '@english-pet/contracts'
import { getEventDefinition } from '@english-pet/domain'
import { fromJson, openDatabase, toJson } from './sqlite-db.js'

/**
 * SQLite 持久化记忆(memory)/共同记忆/修订历史/受限计数/幂等缓存。
 * 行为与 MemoryMemoryStore 完全一致（错误 message、返回结构逐字对齐）。
 * persistence 字段在 SQLite 驱动下返回 'sqlite'。
 */

export interface MemoryProposalInput {
  kind: MemoryKind
  content: string
  confidence: MemoryConfidence
  expression?: string | null
  naturalExpression?: string | null
  semanticTags?: string[]
}

interface IMemoryRecord extends Memory {
  userId: string
  sensitivity: 'normal'
  updatedAt: string
}

interface IMemoryRevision {
  id: string
  memoryId: string
  userId: string
  action: 'propose' | MemoryActionRequest['action'] | 'expire'
  previousContent: string | null
  newContent: string | null
  previousStatus: Memory['status'] | null
  newStatus: Memory['status']
  memoryVersion: number
  createdAt: string
}

const PROPOSAL_TTL_MS = 24 * 60 * 60 * 1000

const restrictedPatterns = [
  /\b(password|passcode|api[- ]?key|secret|access token|credit card|bank card|passport|id card)\b/i,
  /(?:密码|口令|令牌|密钥|银行卡|信用卡|身份证|护照|精确住址|家庭住址)/,
  /(?:\+?\d[\d\s-]{8,}\d)/,
  /\b(?:diagnosed with|medical diagnosis|bank account number)\b/i,
]

function nowIso() {
  return new Date().toISOString()
}

function normalize(content: string) {
  return content.trim().replace(/\s+/g, ' ').toLowerCase()
}

function tagsFor(content: string, extra: string[] = []) {
  const tokens = normalize(content).match(/[a-z][a-z'-]{2,}|[\u4e00-\u9fff]{2,}/g) ?? []
  return [...new Set([...extra, ...tokens])].slice(0, 12)
}

function isRestricted(content: string) {
  return restrictedPatterns.some((pattern) => pattern.test(content))
}

function publicMemory(record: IMemoryRecord): Memory {
  const { userId: _userId, sensitivity: _sensitivity, updatedAt: _updatedAt, ...memory } = record
  return memory
}

interface IUserMemoryState {
  records: Map<string, IMemoryRecord>
  revisions: IMemoryRevision[]
  restrictedCount: number
}

export class SqliteMemoryStore {
  private loadState(userId: string): IUserMemoryState {
    const db = openDatabase()
    const recordRows = db.prepare('SELECT record FROM memories WHERE user_id = ?').all(userId) as { record: string }[]
    const records = new Map<string, IMemoryRecord>()
    for (const row of recordRows) {
      const rec = fromJson<IMemoryRecord>(row.record)!
      records.set(rec.id, rec)
    }
    const revisionRows = db.prepare('SELECT record FROM memory_revisions WHERE user_id = ? ORDER BY rowid ASC').all(userId) as { record: string }[]
    const revisions = revisionRows.map((row) => fromJson<IMemoryRevision>(row.record)!)
    const metaRow = db.prepare('SELECT restricted_count FROM memory_user_meta WHERE user_id = ?').get(userId) as { restricted_count: number } | undefined
    return { records, revisions, restrictedCount: metaRow?.restricted_count ?? 0 }
  }

  private saveState(userId: string, state: IUserMemoryState, loadedRevisionCount: number) {
    const db = openDatabase()
    const upsert = db.prepare(
      `INSERT INTO memories (id, user_id, record) VALUES (?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET record = excluded.record`,
    )
    for (const rec of state.records.values()) {
      upsert.run(rec.id, userId, toJson(rec))
    }
    const insertRevision = db.prepare('INSERT OR IGNORE INTO memory_revisions (id, user_id, record) VALUES (?, ?, ?)')
    for (const rev of state.revisions.slice(loadedRevisionCount)) {
      insertRevision.run(rev.id, userId, toJson(rev))
    }
    db.prepare(
      `INSERT INTO memory_user_meta (user_id, restricted_count) VALUES (?, ?)
       ON CONFLICT(user_id) DO UPDATE SET restricted_count = excluded.restricted_count`,
    ).run(userId, state.restrictedCount)
  }

  private upsertIdempotency(cacheKey: string, response: Memory) {
    openDatabase()
      .prepare(
        `INSERT INTO idempotency (scope, cache_key, response) VALUES ('memory', ?, ?)
         ON CONFLICT(scope, cache_key) DO UPDATE SET response = excluded.response`,
      )
      .run(cacheKey, toJson(response))
  }

  private getIdempotency(cacheKey: string): Memory | null {
    const row = openDatabase().prepare("SELECT response FROM idempotency WHERE scope = 'memory' AND cache_key = ?").get(cacheKey) as { response: string } | undefined
    return row ? fromJson<Memory>(row.response) : null
  }

  private expireProposals(state: IUserMemoryState) {
    const now = Date.now()
    for (const record of state.records.values()) {
      if (record.status !== 'proposed' || !record.expiresAt || Date.parse(record.expiresAt) > now) continue
      const previousContent = record.content
      record.content = ''
      record.status = 'expired'
      record.version += 1
      record.updatedAt = nowIso()
      this.addRevision(state, record, 'expire', previousContent, 'proposed')
    }
  }

  private addRevision(
    state: IUserMemoryState,
    record: IMemoryRecord,
    action: IMemoryRevision['action'],
    previousContent: string | null,
    previousStatus: Memory['status'] | null,
  ) {
    state.revisions.push({
      id: randomUUID(), memoryId: record.id, userId: record.userId, action,
      previousContent, newContent: record.content || null,
      previousStatus, newStatus: record.status,
      memoryVersion: record.version, createdAt: nowIso(),
    })
  }

  private addProposal(userId: string, state: IUserMemoryState, input: MemoryProposalInput, source: { conversationId?: string; eventInstanceId?: string }): Memory | null {
    const content = input.content.trim()
    if (!content) return null
    if (isRestricted(content)) {
      state.restrictedCount += 1
      return null
    }
    const duplicate = [...state.records.values()].find((record) =>
      record.kind === input.kind
      && normalize(record.content) === normalize(content)
      && record.status !== 'deleted'
      && record.status !== 'rejected'
      && record.status !== 'expired')
    if (duplicate) return publicMemory(duplicate)

    const createdAt = nowIso()
    const record: IMemoryRecord = {
      id: randomUUID(), userId,
      kind: input.kind, status: 'proposed', content,
      expression: input.expression ?? (input.kind === 'language' ? content : null),
      naturalExpression: input.naturalExpression ?? null,
      semanticTags: tagsFor(content, input.semanticTags),
      confidence: input.confidence, requiresUserConfirmation: true,
      sourceType: source.eventInstanceId ? 'event' : 'conversation',
      sourceConversationId: source.conversationId ?? null,
      sourceEventInstanceId: source.eventInstanceId ?? null,
      version: 1, createdAt, confirmedAt: null, pausedAt: null,
      expiresAt: new Date(Date.now() + PROPOSAL_TTL_MS).toISOString(),
      sensitivity: 'normal', updatedAt: createdAt,
    }
    state.records.set(record.id, record)
    this.addRevision(state, record, 'propose', null, null)
    return publicMemory(record)
  }

  proposeFromConversation(userId: string, conversationId: string, proposals: MemoryProposalInput[]) {
    const state = this.loadState(userId)
    const loadedRevisionCount = state.revisions.length
    const results = proposals.slice(0, 3).map((proposal) => this.addProposal(userId, state, proposal, { conversationId })).filter((item): item is Memory => item !== null)
    this.saveState(userId, state, loadedRevisionCount)
    return results
  }

  proposeFirstDay(userId: string, eventInstanceId: string, nickname: string | null, todayExpression: string, restoredObject: 'lamp' | 'plant') {
    const state = this.loadState(userId)
    const loadedRevisionCount = state.revisions.length
    const proposals: MemoryProposalInput[] = [
      {
        kind: 'life',
        content: todayExpression,
        confidence: 'high',
        semanticTags: ['first_day', 'today'],
      },
      {
        kind: 'language',
        content: todayExpression,
        expression: todayExpression,
        naturalExpression: todayExpression,
        confidence: 'high',
        semanticTags: ['first_day', 'expression'],
      },
      {
        kind: 'relationship',
        content: `You and Morrow restored the ${restoredObject} on your first night${nickname ? `, ${nickname}` : ''}.`,
        confidence: 'high',
        semanticTags: ['first_day', restoredObject],
      },
    ]
    const results = proposals.map((proposal) => this.addProposal(userId, state, proposal, { eventInstanceId })).filter((item): item is Memory => item !== null)
    this.saveState(userId, state, loadedRevisionCount)
    return results
  }

  proposeFromEventFeedback(userId: string, eventInstanceId: string, proposal: MemoryProposalInput) {
    const state = this.loadState(userId)
    const loadedRevisionCount = state.revisions.length
    const result = this.addProposal(userId, state, proposal, { eventInstanceId })
    this.saveState(userId, state, loadedRevisionCount)
    return result
  }

  /** 固定内容事件完成时：按 memoryRules 渲染好的多条"待确认"提案一次性落地（去重/敏感词/TTL 由 addProposal 统一处理）。 */
  proposeFromFixedEvent(userId: string, eventInstanceId: string, proposals: MemoryProposalInput[]): Memory[] {
    const state = this.loadState(userId)
    const loadedRevisionCount = state.revisions.length
    const results = proposals
      .map((proposal) => this.addProposal(userId, state, proposal, { eventInstanceId }))
      .filter((item): item is Memory => item !== null)
    this.saveState(userId, state, loadedRevisionCount)
    return results
  }

  proposeFromEvent(userId: string, eventInstanceId: string, eventKey: string, outcomeId: string) {
    const definition = getEventDefinition(eventKey)
    if (!definition) return []
    const outcome = definition.outcomes.find((item) => item.id === outcomeId)
    if (!outcome) return []
    const relationshipRules = definition.memoryProposals.filter((item) => item.kind === 'relationship')
    if (outcomeId === 'closed_without_sharing') return []
    const state = this.loadState(userId)
    const loadedRevisionCount = state.revisions.length
    const results = relationshipRules.map((rule) => {
      const values = Object.fromEntries(outcome.worldStateWrites.map((write) => [write.key, String(write.value)]))
      const content = rule.contentTemplate.replace(/\{\{([a-z0-9_]+)\}\}/g, (_, key: string) => values[key] ?? outcome.label)
      return this.addProposal(userId, state, { kind: 'relationship', content, confidence: 'high', semanticTags: [eventKey, outcomeId] }, { eventInstanceId })
    }).filter((item): item is Memory => item !== null)
    this.saveState(userId, state, loadedRevisionCount)
    return results
  }

  list(userId: string, memoryEnabled: boolean): MemoryListResponse {
    const state = this.loadState(userId)
    this.expireProposals(state)
    this.saveState(userId, state, 0)
    return {
      memoryEnabled,
      proposed: [...state.records.values()].filter((record) => record.status === 'proposed').map(publicMemory),
      saved: [...state.records.values()].filter((record) => record.status === 'confirmed' || record.status === 'paused').map(publicMemory),
      restrictedProposalCount: state.restrictedCount,
      persistence: 'sqlite',
    }
  }

  act(userId: string, memoryId: string, input: MemoryActionRequest): Memory {
    const cacheKey = `${userId}:${input.idempotencyKey}`
    const cached = this.getIdempotency(cacheKey)
    if (cached) return cached
    const state = this.loadState(userId)
    const loadedRevisionCount = state.revisions.length
    this.expireProposals(state)
    const record = state.records.get(memoryId)
    if (!record || record.status === 'deleted' || record.status === 'expired' || record.status === 'rejected') throw new Error('memory_not_found')
    if (record.version !== input.expectedVersion) throw new Error('memory_version_conflict')

    const previousContent = record.content
    const previousStatus = record.status
    const stamp = nowIso()
    if (input.action === 'confirm' && record.status === 'proposed') {
      record.content = input.content!.trim()
      if (isRestricted(record.content)) {
        record.content = ''
        record.status = 'rejected'
        state.restrictedCount += 1
      } else {
        record.status = 'confirmed'
        record.confirmedAt = stamp
        record.expiresAt = null
        record.semanticTags = tagsFor(record.content, record.semanticTags)
        if (record.kind === 'language') record.expression = record.content
      }
    } else if (input.action === 'edit' && (record.status === 'confirmed' || record.status === 'paused')) {
      const nextContent = input.content!.trim()
      if (isRestricted(nextContent)) throw new Error('memory_restricted')
      record.content = nextContent
      record.semanticTags = tagsFor(nextContent)
      if (record.kind === 'language') record.expression = nextContent
    } else if (input.action === 'pause' && record.status === 'confirmed') {
      record.status = 'paused'
      record.pausedAt = stamp
    } else if (input.action === 'resume' && record.status === 'paused') {
      record.status = 'confirmed'
      record.pausedAt = null
    } else if (input.action === 'reject' && record.status === 'proposed') {
      record.status = 'rejected'
      record.content = ''
      record.expiresAt = null
    } else if (input.action === 'delete' && (record.status === 'proposed' || record.status === 'confirmed' || record.status === 'paused')) {
      record.status = 'deleted'
      record.content = ''
      record.pausedAt = null
      record.expiresAt = null
    } else {
      throw new Error('memory_action_not_allowed')
    }

    record.version += 1
    record.updatedAt = stamp
    this.addRevision(state, record, input.action, previousContent, previousStatus)
    const result = publicMemory(record)
    this.saveState(userId, state, loadedRevisionCount)
    this.upsertIdempotency(cacheKey, result)
    return result
  }

  confirmedLanguageMemories(userId: string): Memory[] {
    const state = this.loadState(userId)
    this.expireProposals(state)
    this.saveState(userId, state, 0)
    return [...state.records.values()]
      .filter((record) => record.kind === 'language' && record.status === 'confirmed' && record.pausedAt === null)
      .map(publicMemory)
  }

  isConfirmedLanguageMemory(userId: string, memoryId: string) {
    const state = this.loadState(userId)
    const record = state.records.get(memoryId)
    return Boolean(record && record.kind === 'language' && record.status === 'confirmed' && record.pausedAt === null)
  }

  confirmedForEvent(userId: string, eventInstanceId: string): Memory[] {
    const state = this.loadState(userId)
    this.expireProposals(state)
    this.saveState(userId, state, 0)
    return [...state.records.values()]
      .filter((record) => record.sourceEventInstanceId === eventInstanceId && record.status === 'confirmed' && record.pausedAt === null)
      .map(publicMemory)
  }

  editLinkedMemory(userId: string, memoryId: string, expectedVersion: number, content: string, idempotencyKey: string): Memory {
    return this.act(userId, memoryId, { action: 'edit', expectedVersion, content, idempotencyKey })
  }

  search(userId: string, context: MemorySearchContext, memoryEnabled: boolean): Memory[] {
    if (!memoryEnabled) return []
    const state = this.loadState(userId)
    this.expireProposals(state)
    this.saveState(userId, state, 0)
    const queryTerms = new Set(tagsFor(`${context.query} ${context.eventKey ?? ''}`))
    return [...state.records.values()]
      .filter((record) => record.status === 'confirmed' && record.pausedAt === null)
      .map((record) => ({ record, score: record.semanticTags.reduce((sum, tag) => sum + (queryTerms.has(tag) ? 1 : 0), 0) + (context.eventKey && record.semanticTags.includes(context.eventKey) ? 3 : 0) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || Date.parse(b.record.updatedAt) - Date.parse(a.record.updatedAt))
      .slice(0, context.limit)
      .map(({ record }) => publicMemory(record))
  }

  clearUser(userId: string) {
    const db = openDatabase()
    db.prepare('DELETE FROM memories WHERE user_id = ?').run(userId)
    db.prepare('DELETE FROM memory_revisions WHERE user_id = ?').run(userId)
    db.prepare('DELETE FROM memory_user_meta WHERE user_id = ?').run(userId)
    db.prepare("DELETE FROM idempotency WHERE scope = 'memory' AND cache_key LIKE ?").run(`${userId}:%`)
  }

  revisionCount(userId: string) {
    return this.loadState(userId).revisions.length
  }
}
