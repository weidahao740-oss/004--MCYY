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

const memoriesByUser = new Map<string, Map<string, IMemoryRecord>>()
const revisionsByUser = new Map<string, IMemoryRevision[]>()
const restrictedProposalCountByUser = new Map<string, number>()
const responseByIdempotencyKey = new Map<string, Memory>()
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

function userMemories(userId: string) {
  let records = memoriesByUser.get(userId)
  if (!records) {
    records = new Map()
    memoriesByUser.set(userId, records)
  }
  return records
}

function revisions(userId: string) {
  let list = revisionsByUser.get(userId)
  if (!list) {
    list = []
    revisionsByUser.set(userId, list)
  }
  return list
}

function addRevision(record: IMemoryRecord, action: IMemoryRevision['action'], previousContent: string | null, previousStatus: Memory['status'] | null) {
  revisions(record.userId).push({
    id: randomUUID(), memoryId: record.id, userId: record.userId, action,
    previousContent, newContent: record.content || null,
    previousStatus, newStatus: record.status,
    memoryVersion: record.version, createdAt: nowIso(),
  })
}

function expireProposals(userId: string) {
  const now = Date.now()
  for (const record of userMemories(userId).values()) {
    if (record.status !== 'proposed' || !record.expiresAt || Date.parse(record.expiresAt) > now) continue
    const previousContent = record.content
    record.content = ''
    record.status = 'expired'
    record.version += 1
    record.updatedAt = nowIso()
    addRevision(record, 'expire', previousContent, 'proposed')
  }
}

function addProposal(userId: string, input: MemoryProposalInput, source: { conversationId?: string; eventInstanceId?: string }) {
  const content = input.content.trim()
  if (!content) return null
  if (isRestricted(content)) {
    restrictedProposalCountByUser.set(userId, (restrictedProposalCountByUser.get(userId) ?? 0) + 1)
    return null
  }
  const records = userMemories(userId)
  const duplicate = [...records.values()].find((record) =>
    record.kind === input.kind
    && normalize(record.content) === normalize(content)
    && record.status !== 'deleted'
    && record.status !== 'rejected'
    && record.status !== 'expired')
  if (duplicate) return publicMemory(duplicate)

  const createdAt = nowIso()
  const record: IMemoryRecord = {
    id: randomUUID(), userId, kind: input.kind, status: 'proposed', content,
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
  records.set(record.id, record)
  addRevision(record, 'propose', null, null)
  return publicMemory(record)
}

export class MemoryMemoryStore {
  proposeFromConversation(userId: string, conversationId: string, proposals: MemoryProposalInput[]) {
    return proposals.slice(0, 3).map((proposal) => addProposal(userId, proposal, { conversationId })).filter((item): item is Memory => item !== null)
  }

  proposeFirstDay(userId: string, eventInstanceId: string, nickname: string | null, todayExpression: string, restoredObject: 'lamp' | 'plant') {
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
    return proposals.map((proposal) => addProposal(userId, proposal, { eventInstanceId })).filter((item): item is Memory => item !== null)
  }

  proposeFromEventFeedback(userId: string, eventInstanceId: string, proposal: MemoryProposalInput) {
    return addProposal(userId, proposal, { eventInstanceId })
  }

  /** 固定内容事件完成时：按 memoryRules 渲染好的多条"待确认"提案一次性落地（去重/敏感词/TTL 由 addProposal 统一处理）。 */
  proposeFromFixedEvent(userId: string, eventInstanceId: string, proposals: MemoryProposalInput[]): Memory[] {
    return proposals
      .map((proposal) => addProposal(userId, proposal, { eventInstanceId }))
      .filter((item): item is Memory => item !== null)
  }

  proposeFromEvent(userId: string, eventInstanceId: string, eventKey: string, outcomeId: string) {
    const definition = getEventDefinition(eventKey)
    if (!definition) return []
    const outcome = definition.outcomes.find((item) => item.id === outcomeId)
    if (!outcome) return []
    const relationshipRules = definition.memoryProposals.filter((item) => item.kind === 'relationship')
    if (outcomeId === 'closed_without_sharing') return []
    return relationshipRules.map((rule) => {
      const values = Object.fromEntries(outcome.worldStateWrites.map((write) => [write.key, String(write.value)]))
      const content = rule.contentTemplate.replace(/\{\{([a-z0-9_]+)\}\}/g, (_, key: string) => values[key] ?? outcome.label)
      return addProposal(userId, { kind: 'relationship', content, confidence: 'high', semanticTags: [eventKey, outcomeId] }, { eventInstanceId })
    }).filter((item): item is Memory => item !== null)
  }

  list(userId: string, memoryEnabled: boolean): MemoryListResponse {
    expireProposals(userId)
    const records = [...userMemories(userId).values()]
    return {
      memoryEnabled,
      proposed: records.filter((record) => record.status === 'proposed').map(publicMemory),
      saved: records.filter((record) => record.status === 'confirmed' || record.status === 'paused').map(publicMemory),
      restrictedProposalCount: restrictedProposalCountByUser.get(userId) ?? 0,
      persistence: 'memory',
    }
  }

  act(userId: string, memoryId: string, input: MemoryActionRequest): Memory {
    const cacheKey = `${userId}:${input.idempotencyKey}`
    const cached = responseByIdempotencyKey.get(cacheKey)
    if (cached) return cached
    expireProposals(userId)
    const record = userMemories(userId).get(memoryId)
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
        restrictedProposalCountByUser.set(userId, (restrictedProposalCountByUser.get(userId) ?? 0) + 1)
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
    addRevision(record, input.action, previousContent, previousStatus)
    const result = publicMemory(record)
    responseByIdempotencyKey.set(cacheKey, result)
    return result
  }

  confirmedLanguageMemories(userId: string): Memory[] {
    expireProposals(userId)
    return [...userMemories(userId).values()]
      .filter((record) => record.kind === 'language' && record.status === 'confirmed' && record.pausedAt === null)
      .map(publicMemory)
  }

  isConfirmedLanguageMemory(userId: string, memoryId: string) {
    const record = userMemories(userId).get(memoryId)
    return Boolean(record && record.kind === 'language' && record.status === 'confirmed' && record.pausedAt === null)
  }

  confirmedForEvent(userId: string, eventInstanceId: string): Memory[] {
    expireProposals(userId)
    return [...userMemories(userId).values()]
      .filter((record) => record.sourceEventInstanceId === eventInstanceId && record.status === 'confirmed' && record.pausedAt === null)
      .map(publicMemory)
  }

  editLinkedMemory(userId: string, memoryId: string, expectedVersion: number, content: string, idempotencyKey: string): Memory {
    return this.act(userId, memoryId, { action: 'edit', expectedVersion, content, idempotencyKey })
  }

  search(userId: string, context: MemorySearchContext, memoryEnabled: boolean): Memory[] {
    if (!memoryEnabled) return []
    expireProposals(userId)
    const queryTerms = new Set(tagsFor(`${context.query} ${context.eventKey ?? ''}`))
    return [...userMemories(userId).values()]
      .filter((record) => record.status === 'confirmed' && record.pausedAt === null)
      .map((record) => ({ record, score: record.semanticTags.reduce((sum, tag) => sum + (queryTerms.has(tag) ? 1 : 0), 0) + (context.eventKey && record.semanticTags.includes(context.eventKey) ? 3 : 0) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || Date.parse(b.record.updatedAt) - Date.parse(a.record.updatedAt))
      .slice(0, context.limit)
      .map(({ record }) => publicMemory(record))
  }

  clearUser(userId: string) {
    memoriesByUser.delete(userId)
    revisionsByUser.delete(userId)
    restrictedProposalCountByUser.delete(userId)
    for (const key of [...responseByIdempotencyKey.keys()]) {
      if (key.startsWith(`${userId}:`)) responseByIdempotencyKey.delete(key)
    }
  }

  revisionCount(userId: string) {
    return revisions(userId).length
  }
}
