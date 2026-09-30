import { randomUUID } from 'node:crypto'
import {
  fixedContentV1,
  getFixedContentEvent,
  previewFixedContentIntent,
  type IntentMatcherCandidate,
} from '@english-pet/domain'
import type {
  FixedChoice,
  FixedContentInputMode,
  FixedContentLine,
  FixedEvent,
  FixedEventCatalogItem,
  FixedEventInstanceView,
} from '@english-pet/contracts'
import { fromJson, openDatabase, toJson } from './sqlite-db.js'
import type { MemoryProposalInput, SqliteMemoryStore } from './sqlite-memory-store.js'
import type { MemoryMemoryStore } from './memory-memory-store.js'
import type { SqliteJournalStore } from './sqlite-journal-store.js'
import type { MemoryJournalStore } from './memory-journal-store.js'

type MemoryStoreDeps = MemoryMemoryStore | SqliteMemoryStore
type JournalStoreDeps = MemoryJournalStore | SqliteJournalStore

/**
 * 日常对话主题（P4-T04）：与主线章节事件区分开的可重复轮换内容。
 * - 章节 ID 为 chapter_daily_talk 的事件属于日常主题。
 * - 解锁：首个主线事件 birth_first_voice_v1 完成后全部日常主题解锁（不再按 sequence 互相前置）。
 * - 完成后永不写入 completedEventIds，因此在目录里始终是 available，可重复进入。
 * - dailyTopicCursor 记录上一次完成的日常主题，目录据此循环标出"推荐下一个"，保证连续使用不重复同一主题。
 */
const DAILY_TOPIC_CHAPTER = 'chapter_daily_talk'
const DAILY_TOPIC_UNLOCK_EVENT = 'birth_first_voice_v1'

interface FixedEventEngineDeps {
  memoryStore?: MemoryStoreDeps
  journalStore?: JournalStoreDeps
}

/**
 * 固定内容事件引擎（fixed-content-v1.0.0）——把纯函数确定性意图匹配器接入真实状态推进并落 SQLite。
 *
 * 设计要点：
 * - 进程内无状态：每次方法调用都从 fixed_event_state 行读 record、改完写回；新 new 出来的实例即等于"重启"。
 * - 状态迁移由 onIntentIds 驱动：previewFixedContentIntent 解析出 resolvedIntentId 后，
 *   仅在 event.transitions 中找 fromStateId===当前状态 且 onIntentIds 包含该意图的迁移；
 *   未唯一解析或无对应迁移时保持当前状态不变（advanced:false）。
 * - worldState 写入时机：仅当命中带 outcomeId 的迁移时，立即把该 outcome 的 worldStateWrites 写进用户世界状态。
 * - 幂等：每个用户 record 内维护 responseByIdempotencyKey，start/advance 命中即原样返回缓存视图，不重复推进。
 */

type WorldStateValue = string | number | boolean | null
type WorldState = Record<string, WorldStateValue>

interface FixedEventInstanceRecord {
  eventId: string
  instanceId: string
  currentStateId: string
  status: 'active' | 'completed' | 'paused'
  selectedOutcomeId: string | null
  resultLineIds: string[]
  confirmedExpressions: string[]
  /** 累计本次实例命中过的 resolvedIntentId（用于按 memoryRules.sourceIntentIds 过滤）。 */
  resolvedIntentIds: string[]
  /** completed 后是否已向记忆/日记 store 结算过（幂等兜底）。 */
  memoryProposed: boolean
  completedAt: string | null
}

interface FixedEventUserRecord {
  userId: string
  worldState: WorldState
  completedEventIds: string[]
  /** 上一次完成的日常对话主题 id（用于轮换去重）；非空表示最近用过的主题。 */
  dailyTopicCursor: string | null
  active: FixedEventInstanceRecord | null
  responseByIdempotencyKey: Record<string, FixedEventInstanceView>
}

/** 全事件台词表：契约保证台词 id 全局唯一。 */
const lineById = new Map<string, FixedContentLine>(
  fixedContentV1.events.flatMap((event) => event.lines).map((line) => [line.id, line] as const),
)

function resolveLines(ids: string[]): FixedContentLine[] {
  return ids.map((id) => lineById.get(id)!).filter(Boolean)
}

export class SqliteFixedEventEngine {
  private readonly deps: FixedEventEngineDeps

  constructor(deps?: FixedEventEngineDeps) {
    openDatabase()
    this.deps = deps ?? {}
  }

  private loadRecord(userId: string): FixedEventUserRecord {
    const row = openDatabase()
      .prepare('SELECT record FROM fixed_event_state WHERE user_id = ?')
      .get(userId) as { record: string } | undefined
    if (row) {
      const parsed = fromJson<FixedEventUserRecord>(row.record)!
      // 旧 record 可能缺新字段，读取时补齐默认值，避免运行时 undefined 报错。
      if (parsed.active) {
        parsed.active.resolvedIntentIds ??= []
        parsed.active.memoryProposed ??= false
      }
      parsed.dailyTopicCursor ??= null
      return parsed
    }
    return {
      userId,
      worldState: {},
      completedEventIds: [],
      dailyTopicCursor: null,
      active: null,
      responseByIdempotencyKey: {},
    }
  }

  private saveRecord(record: FixedEventUserRecord): void {
    openDatabase()
      .prepare(
        `INSERT INTO fixed_event_state (user_id, record) VALUES (?, ?)
         ON CONFLICT(user_id) DO UPDATE SET record = excluded.record`,
      )
      .run(record.userId, toJson(record))
  }

  private eventStatus(record: FixedEventUserRecord, event: FixedEvent): 'available' | 'completed' | 'locked' {
    // 日常对话主题：首个主线事件完成即解锁；可重复，永不标 completed。
    if (event.chapterId === DAILY_TOPIC_CHAPTER) {
      return record.completedEventIds.includes(DAILY_TOPIC_UNLOCK_EVENT) ? 'available' : 'locked'
    }
    if (record.completedEventIds.includes(event.id)) return 'completed'
    // 可用条件：所有排在自己之前（sequence 更小）的事件都已完成。
    const prerequisitesDone = fixedContentV1.events
      .filter((other) => other.sequence < event.sequence)
      .every((prior) => record.completedEventIds.includes(prior.id))
    return prerequisitesDone ? 'available' : 'locked'
  }

  catalog(userId: string): FixedEventCatalogItem[] {
    const record = this.loadRecord(userId)
    const items = fixedContentV1.events.map((event) => ({
      eventId: event.id,
      version: event.version,
      chapterId: event.chapterId,
      sequence: event.sequence,
      titleZh: event.titleZh,
      status: this.eventStatus(record, event),
    }))
    // 日常主题轮换：在已解锁的主题里，按 sequence 循环标出"推荐下一个"，紧跟上一次完成的那个之后。
    const availableDaily = items.filter((item) => item.chapterId === DAILY_TOPIC_CHAPTER && item.status === 'available')
    if (availableDaily.length === 0) return items
    const order = availableDaily.map((item) => item.eventId)
    const cursor = record.dailyTopicCursor
    const cursorIndex = cursor ? order.indexOf(cursor) : -1
    const recommendedIndex = (cursorIndex + 1 + availableDaily.length) % availableDaily.length
    const recommendedId = availableDaily[recommendedIndex].eventId
    return items.map((item) => (item.eventId === recommendedId ? { ...item, recommendedNext: true } : item))
  }

  private render(
    record: FixedEventUserRecord,
    instance: FixedEventInstanceRecord,
    extra?: { advanced: boolean; messageZh?: string; candidates?: IntentMatcherCandidate[] },
    /** 到达 completed 时用迁移来源状态渲染最后一屏（completed 不是 states 成员）。 */
    renderStateId?: string,
  ): FixedEventInstanceView {
    const event = getFixedContentEvent(instance.eventId)!
    const state = event.states.find((entry) => entry.id === (renderStateId ?? instance.currentStateId))!
    const outcome = instance.selectedOutcomeId
      ? event.outcomes.find((entry) => entry.id === instance.selectedOutcomeId)
      : null
    return {
      eventId: event.id,
      eventVersion: event.version,
      chapterId: event.chapterId,
      sequence: event.sequence,
      titleZh: event.titleZh,
      instanceId: instance.instanceId,
      status: instance.status,
      currentState: {
        id: state.id,
        phase: state.phase,
        uiTitleZh: state.uiTitleZh,
        userTaskZh: state.userTaskZh,
        lines: resolveLines(state.lineIds),
        choices: state.choices,
        acceptedInputModes: state.acceptedInputModes,
        referenceReplyLines: resolveLines(state.referenceReplyLineIds),
      },
      resultLines: resolveLines(instance.resultLineIds),
      outcome: outcome ? { id: outcome.id, labelZh: outcome.labelZh } : null,
      worldState: record.worldState,
      advanced: extra?.advanced ?? false,
      ...(extra?.messageZh !== undefined ? { messageZh: extra.messageZh } : {}),
      ...(extra?.candidates ? { candidates: extra.candidates } : {}),
    }
  }

  start(userId: string, input: { eventId: string; idempotencyKey: string }): FixedEventInstanceView {
    const cacheKey = `start:${input.eventId}:${input.idempotencyKey}`
    const record = this.loadRecord(userId)
    const cached = record.responseByIdempotencyKey[cacheKey]
    if (cached) return cached

    if (record.active && record.active.status !== 'completed') {
      throw new Error('fixed_event_locked')
    }
    const event = getFixedContentEvent(input.eventId)
    if (!event || this.eventStatus(record, event) !== 'available') {
      throw new Error('fixed_event_locked')
    }

    const instance: FixedEventInstanceRecord = {
      eventId: event.id,
      instanceId: randomUUID(),
      currentStateId: event.entryStateId,
      status: 'active',
      selectedOutcomeId: null,
      resultLineIds: [],
      confirmedExpressions: [],
      resolvedIntentIds: [],
      memoryProposed: false,
      completedAt: null,
    }
    record.active = instance
    const view = this.render(record, instance, { advanced: true })
    record.responseByIdempotencyKey[cacheKey] = view
    this.saveRecord(record)
    return view
  }

  current(userId: string): FixedEventInstanceView | null {
    const record = this.loadRecord(userId)
    if (!record.active) return null
    return this.render(record, record.active, { advanced: false })
  }

  advance(
    userId: string,
    instanceId: string,
    input: { inputMode: FixedContentInputMode; text?: string; choiceId?: string; idempotencyKey: string },
  ): FixedEventInstanceView {
    const cacheKey = `advance:${instanceId}:${input.idempotencyKey}`
    const record = this.loadRecord(userId)

    // 幂等缓存优先：完成步（active 已置空）用同一 idempotencyKey 重放时直接返回缓存视图，
    // 不重复推进、不重复提案。
    const cached = record.responseByIdempotencyKey[cacheKey]
    if (cached) return cached

    if (!record.active) {
      throw new Error('fixed_no_active_event')
    }
    if (record.active.instanceId !== instanceId) {
      throw new Error('fixed_event_not_found')
    }

    const instance = record.active
    const event = getFixedContentEvent(instance.eventId)!

    // a. 纯函数确定性意图预览（不推进）。
    const preview = previewFixedContentIntent({
      event,
      stateId: instance.currentStateId,
      input: { inputMode: input.inputMode, text: input.text, choiceId: input.choiceId },
      policy: fixedContentV1.matchingPolicy,
      fallbacks: fixedContentV1.fallbacks,
    })

    // b/c. 未唯一解析，或没有对应迁移：保持当前状态，返回候选。
    let transition = null
    if (preview.resolvedIntentId) {
      transition = event.transitions.find(
        (entry) => entry.fromStateId === instance.currentStateId && entry.onIntentIds.includes(preview.resolvedIntentId!),
      ) ?? null
    }

    if (!transition) {
      const view = this.render(record, instance, {
        advanced: false,
        messageZh: preview.messageZh,
        candidates: preview.candidates.slice(0, 3),
      })
      record.responseByIdempotencyKey[cacheKey] = view
      this.saveRecord(record)
      return view
    }

    // 命中迁移：累计 resolvedIntentId；文本/确认 ASR 输入命中迁移时记录确认句。
    instance.resolvedIntentIds.push(preview.resolvedIntentId!)
    if ((input.inputMode === 'text' || input.inputMode === 'confirmed_asr_text') && input.text && input.text.trim().length > 0) {
      instance.confirmedExpressions.push(input.text)
    }

    // d. 命中带 outcome 的迁移：立即写世界状态并记录结果。
    if (transition.outcomeId) {
      const outcome = event.outcomes.find((entry) => entry.id === transition!.outcomeId)!
      for (const write of outcome.worldStateWrites) {
        record.worldState[write.key] = write.value
      }
      instance.selectedOutcomeId = outcome.id
      instance.resultLineIds = outcome.resultLineIds
    }

    // e. 推进；到达 completed 则收尾。
    instance.currentStateId = transition.toStateId
    const completed = transition.toStateId === 'completed'
    if (completed) {
      instance.status = 'completed'
      instance.completedAt = new Date().toISOString()
      const completedEvent = getFixedContentEvent(instance.eventId)!
      if (completedEvent.chapterId === DAILY_TOPIC_CHAPTER) {
        // 日常主题：不写入 completedEventIds（保持可重复），只推进轮换游标。
        record.dailyTopicCursor = instance.eventId
      } else if (!record.completedEventIds.includes(instance.eventId)) {
        record.completedEventIds.push(instance.eventId)
      }
      record.active = null

      // 幂等结算：仅在本实例尚未结算过时向记忆/日记 store 写入一次。
      if (instance.memoryProposed !== true) {
        this.proposeOnCompletion(record, instance, event, userId)
        instance.memoryProposed = true
      }
    }

    const view = this.render(record, instance, { advanced: true }, completed ? transition.fromStateId : undefined)
    record.responseByIdempotencyKey[cacheKey] = view
    this.saveRecord(record)
    return view
  }

  pause(userId: string, instanceId: string, idempotencyKey: string): FixedEventInstanceView {
    const record = this.loadRecord(userId)
    if (!record.active || record.active.instanceId !== instanceId) {
      throw new Error('fixed_event_not_found')
    }
    record.active.status = 'paused'
    const view = this.render(record, record.active, { advanced: false })
    record.responseByIdempotencyKey[`pause:${instanceId}:${idempotencyKey}`] = view
    this.saveRecord(record)
    return view
  }

  resume(userId: string, instanceId: string, idempotencyKey: string): FixedEventInstanceView {
    const record = this.loadRecord(userId)
    if (!record.active || record.active.instanceId !== instanceId) {
      throw new Error('fixed_event_not_found')
    }
    record.active.status = 'active'
    const view = this.render(record, record.active, { advanced: true })
    record.responseByIdempotencyKey[`resume:${instanceId}:${idempotencyKey}`] = view
    this.saveRecord(record)
    return view
  }

  /**
   * 事件完成时按 memoryRules 向记忆 store 提"待确认"提案，并写一条日记。
   * - 只保留 sourceIntentIds 与本实例 resolvedIntentIds 有交集的规则。
   * - 渲染 {{confirmed_user_sentence}} 为最后一条确认句；其余 {{xxx}} 取 worldState。
   * - language 规则在确认句为空时整条跳过；relationship 规则照常渲染。
   * 幂等由调用方 memoryProposed 标志 + store 层去重 + 幂等键缓存共同保证。
   */
  private proposeOnCompletion(
    record: FixedEventUserRecord,
    instance: FixedEventInstanceRecord,
    event: FixedEvent,
    userId: string,
  ): void {
    const confirmedSentence = instance.confirmedExpressions[instance.confirmedExpressions.length - 1] ?? ''
    const outcomeId = instance.selectedOutcomeId ?? ''

    const proposals: MemoryProposalInput[] = []
    for (const rule of event.memoryRules) {
      if (!rule.sourceIntentIds.some((id) => instance.resolvedIntentIds.includes(id))) continue
      const rendered = rule.contentTemplate
        .replace(/\{\{confirmed_user_sentence\}\}/g, confirmedSentence)
        .replace(/\{\{([a-z0-9_]+)\}\}/g, (_, key: string) => String(record.worldState[key] ?? ''))
        .trim()
      if (!rendered) continue
      if (rule.kind === 'language' && !confirmedSentence) continue
      proposals.push({
        kind: rule.kind,
        content: rendered,
        confidence: 'high',
        semanticTags: [event.id, outcomeId],
        ...(rule.kind === 'language'
          ? { expression: confirmedSentence, naturalExpression: confirmedSentence }
          : {}),
      })
    }
    if (this.deps.memoryStore && proposals.length > 0) {
      this.deps.memoryStore.proposeFromFixedEvent(userId, instance.instanceId, proposals)
    }

    if (this.deps.journalStore && instance.selectedOutcomeId) {
      const outcome = event.outcomes.find((entry) => entry.id === instance.selectedOutcomeId)
      if (outcome) {
        const firstLine = resolveLines(instance.resultLineIds)[0]
        this.deps.journalStore.createFromFixedEvent({
          userId,
          instanceId: instance.instanceId,
          event,
          outcomeId: outcome.id,
          userExpression: confirmedSentence || null,
          textVersion: firstLine?.learningContent.textVersion ?? '1.0.0',
          translationVersion: firstLine?.learningContent.translation.version ?? '1.0.0',
        })
      }
    }
  }

  clearUser(userId: string): void {
    openDatabase().prepare('DELETE FROM fixed_event_state WHERE user_id = ?').run(userId)
  }
}
