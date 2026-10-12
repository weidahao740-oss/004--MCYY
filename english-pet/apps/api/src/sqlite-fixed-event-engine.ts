import { randomUUID } from 'node:crypto'
import {
  fixedContentV1,
  getFixedContentEvent,
  previewFixedContentIntent,
  type IntentMatcherCandidate,
} from '@english-pet/domain'
import type {
  FixedContentInputMode,
  FixedContentLine,
  FixedEvent,
  FixedEventCatalogItem,
  FixedEventDailyBudgetView,
  FixedEventInstanceView,
  FixedEventRecommendationView,
  Memory,
} from '@english-pet/contracts'
import { fromJson, openDatabase, toJson } from './sqlite-db.js'
import type { MemoryProposalInput, SqliteMemoryStore } from './sqlite-memory-store.js'
import type { MemoryMemoryStore } from './memory-memory-store.js'
import type { SqliteJournalStore } from './sqlite-journal-store.js'
import type { MemoryJournalStore } from './memory-journal-store.js'

type MemoryStoreDeps = MemoryMemoryStore | SqliteMemoryStore
type JournalStoreDeps = MemoryJournalStore | SqliteJournalStore

type WorldStateValue = string | number | boolean | null
type WorldState = Record<string, WorldStateValue>

interface FixedEventEngineDeps {
  memoryStore?: MemoryStoreDeps
  journalStore?: JournalStoreDeps
  now?: () => Date
}

interface FixedEventInstanceRecord {
  eventId: string
  instanceId: string
  currentStateId: string
  status: 'active' | 'completed' | 'paused'
  selectedOutcomeId: string | null
  resultLineIds: string[]
  confirmedExpressions: string[]
  resolvedIntentIds: string[]
  memoryProposed: boolean
  completedAt: string | null
  recallSourceMemoryId: string | null
  recallSourceType: 'shared_memory' | 'legacy_expression' | null
}

interface DailyBudgetRecord {
  localDate: string
  timeZone: string
  newMainlineUsed: number
  newDailyUsed: number
  newLearningObjectsUsed: number
  newCoreExpressionsUsed: number
  recallUsed: number
  extraEventUsed: number
  extraEventGranted: boolean
}

interface FixedEventUserRecord {
  userId: string
  worldState: WorldState
  completedEventIds: string[]
  startedEventIds: string[]
  dailyCompletionByEventId: Record<string, string>
  dailyTopicCursor: string | null
  budget: DailyBudgetRecord | null
  active: FixedEventInstanceRecord | null
  responseByIdempotencyKey: Record<string, FixedEventInstanceView>
  commandByIdempotencyKey: Record<string, unknown>
}

const lineById = new Map<string, FixedContentLine>(
  fixedContentV1.events.flatMap((event) => event.lines).map((line) => [line.id, line] as const),
)

const LIMITS = {
  newMainline: 2,
  newDaily: 1,
  newLearningObjects: 10,
  newCoreExpressions: 3,
  recall: 1,
  extraEvent: 1,
} as const

function resolveLines(ids: string[]): FixedContentLine[] {
  return ids.map((id) => lineById.get(id)!).filter(Boolean)
}

function localDate(now: Date, timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now)
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
    return `${values.year}-${values.month}-${values.day}`
  } catch {
    throw new Error('fixed_invalid_time_zone')
  }
}

function recallSourceType(memory: Memory): 'shared_memory' | 'legacy_expression' {
  return memory.kind === 'language' ? 'legacy_expression' : 'shared_memory'
}

export function selectRecallCandidate(
  event: FixedEvent,
  memories: Memory[],
): { memory: Memory; sourceType: 'shared_memory' | 'legacy_expression' } | null {
  if (event.eventType !== 'recall') return null
  const eventTags = new Set(event.recallSemanticTags)
  const ranked = memories
    .map((memory) => {
      const sourceType = recallSourceType(memory)
      if (!event.recallSourceTypes.includes(sourceType)) return null
      const matchedTags = memory.semanticTags.filter((tag) => eventTags.has(tag))
      if (matchedTags.length === 0) return null
      const exactEventMatch = memory.semanticTags.includes(event.id) ? 1 : 0
      return { memory, sourceType, score: matchedTags.length, exactEventMatch }
    })
    .filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null)
    .sort((left, right) =>
      right.exactEventMatch - left.exactEventMatch
      || right.score - left.score
      || left.memory.id.localeCompare(right.memory.id),
    )
  const selected = ranked[0]
  return selected ? { memory: selected.memory, sourceType: selected.sourceType } : null
}

export class SqliteFixedEventEngine {
  private readonly deps: FixedEventEngineDeps

  constructor(deps?: FixedEventEngineDeps) {
    openDatabase()
    this.deps = deps ?? {}
  }

  private now(): Date {
    return this.deps.now?.() ?? new Date()
  }

  private loadRecord(userId: string): FixedEventUserRecord {
    const row = openDatabase()
      .prepare('SELECT record FROM fixed_event_state WHERE user_id = ?')
      .get(userId) as { record: string } | undefined
    if (row) {
      const parsed = fromJson<FixedEventUserRecord>(row.record)!
      parsed.completedEventIds ??= []
      parsed.startedEventIds ??= [...parsed.completedEventIds]
      parsed.dailyCompletionByEventId ??= {}
      parsed.dailyTopicCursor ??= null
      parsed.budget ??= null
      parsed.commandByIdempotencyKey ??= {}
      if (parsed.active) {
        parsed.active.resolvedIntentIds ??= []
        parsed.active.memoryProposed ??= false
        parsed.active.recallSourceMemoryId ??= null
        parsed.active.recallSourceType ??= null
      }
      return parsed
    }
    return {
      userId,
      worldState: {},
      completedEventIds: [],
      startedEventIds: [],
      dailyCompletionByEventId: {},
      dailyTopicCursor: null,
      budget: null,
      active: null,
      responseByIdempotencyKey: {},
      commandByIdempotencyKey: {},
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

  private ensureBudget(record: FixedEventUserRecord, timeZone: string): DailyBudgetRecord {
    const date = localDate(this.now(), timeZone)
    if (!record.budget || record.budget.localDate !== date || record.budget.timeZone !== timeZone) {
      record.budget = {
        localDate: date,
        timeZone,
        newMainlineUsed: 0,
        newDailyUsed: 0,
        newLearningObjectsUsed: 0,
        newCoreExpressionsUsed: 0,
        recallUsed: 0,
        extraEventUsed: 0,
        extraEventGranted: false,
      }
    }
    return record.budget
  }

  private budgetView(record: FixedEventUserRecord, timeZone: string): FixedEventDailyBudgetView {
    const budget = this.ensureBudget(record, timeZone)
    return {
      localDate: budget.localDate,
      timeZone: budget.timeZone,
      newMainlineUsed: budget.newMainlineUsed,
      newDailyUsed: budget.newDailyUsed,
      newLearningObjectsUsed: budget.newLearningObjectsUsed,
      newCoreExpressionsUsed: budget.newCoreExpressionsUsed,
      recallUsed: budget.recallUsed,
      extraEventUsed: budget.extraEventUsed,
      limits: LIMITS,
    }
  }

  private prerequisitesDone(record: FixedEventUserRecord, event: FixedEvent): boolean {
    return event.prerequisiteEventIds.every((id) => record.completedEventIds.includes(id))
  }

  private cooldownUntil(record: FixedEventUserRecord, event: FixedEvent): string | null {
    if (event.eventType !== 'daily' || event.dailyCooldownHours === null) return null
    const completedAt = record.dailyCompletionByEventId[event.id]
    if (!completedAt) return null
    const until = new Date(Date.parse(completedAt) + event.dailyCooldownHours * 60 * 60 * 1000)
    return until.getTime() > this.now().getTime() ? until.toISOString() : null
  }

  private isFirstNewContentStart(record: FixedEventUserRecord, event: FixedEvent): boolean {
    return event.newContentBudget.introducesNewContent && !record.startedEventIds.includes(event.id)
  }

  private budgetAllows(record: FixedEventUserRecord, event: FixedEvent, timeZone: string): boolean {
    const budget = this.ensureBudget(record, timeZone)
    if (event.eventType === 'recall') return budget.recallUsed < LIMITS.recall
    if (!this.isFirstNewContentStart(record, event)) return true
    const nextObjects = budget.newLearningObjectsUsed + event.newContentBudget.newLearningObjectCount
    const nextExpressions = budget.newCoreExpressionsUsed + event.newContentBudget.newCoreExpressionCount
    if (nextObjects > LIMITS.newLearningObjects || nextExpressions > LIMITS.newCoreExpressions) return false
    if (event.eventType === 'daily') return budget.newDailyUsed < LIMITS.newDaily
    if (event.eventType === 'mainline') {
      const mainlineLimit = LIMITS.newMainline + (budget.extraEventGranted ? 1 : 0)
      return budget.newMainlineUsed < mainlineLimit
    }
    return true
  }

  private eventStatus(
    record: FixedEventUserRecord,
    event: FixedEvent,
    timeZone: string,
  ): 'available' | 'completed' | 'locked' | 'cooldown' {
    if (event.eventType === 'recall') return 'locked'
    if (event.eventType === 'mainline' && record.completedEventIds.includes(event.id)) return 'completed'
    if (!this.prerequisitesDone(record, event)) return 'locked'
    if (this.cooldownUntil(record, event)) return 'cooldown'
    return this.budgetAllows(record, event, timeZone) ? 'available' : 'locked'
  }

  catalog(userId: string, timeZone = 'Asia/Shanghai'): FixedEventCatalogItem[] {
    const record = this.loadRecord(userId)
    const items = fixedContentV1.events
      .filter((event) => event.eventType !== 'recall')
      .map((event) => {
        const cooldownUntil = this.cooldownUntil(record, event)
        return {
          eventId: event.id,
          version: event.version,
          chapterId: event.chapterId,
          sequence: event.sequence,
          titleZh: event.titleZh,
          eventType: event.eventType,
          triggerMode: event.triggerMode,
          triggerStrength: event.triggerStrength,
          status: this.eventStatus(record, event, timeZone),
          ...(cooldownUntil ? { cooldownUntil } : {}),
        } satisfies FixedEventCatalogItem
      })

    const availableDaily = items
      .filter((item) => item.eventType === 'daily' && item.status === 'available')
      .sort((a, b) => a.sequence - b.sequence)
    if (availableDaily.length === 0) {
      this.saveRecord(record)
      return items
    }
    const order = availableDaily.map((item) => item.eventId)
    const cursorIndex = record.dailyTopicCursor ? order.indexOf(record.dailyTopicCursor) : -1
    const recommendedId = order[(cursorIndex + 1 + order.length) % order.length]
    this.saveRecord(record)
    return items.map((item) => item.eventId === recommendedId ? { ...item, recommendedNext: true } : item)
  }

  private recallCandidate(
    userId: string,
    event: FixedEvent,
  ): { memory: Memory; sourceType: 'shared_memory' | 'legacy_expression' } | null {
    return selectRecallCandidate(event, this.deps.memoryStore?.recallCandidates(userId) ?? [])
  }

  private render(
    record: FixedEventUserRecord,
    instance: FixedEventInstanceRecord,
    extra?: { advanced: boolean; messageZh?: string; candidates?: IntentMatcherCandidate[] },
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

  private consumeBudget(record: FixedEventUserRecord, event: FixedEvent, timeZone: string): void {
    const budget = this.ensureBudget(record, timeZone)
    if (event.eventType === 'recall') {
      budget.recallUsed += 1
      return
    }
    if (!this.isFirstNewContentStart(record, event)) return
    if (event.eventType === 'mainline') {
      budget.newMainlineUsed += 1
      if (budget.newMainlineUsed > LIMITS.newMainline) budget.extraEventUsed = 1
    } else if (event.eventType === 'daily') {
      budget.newDailyUsed += 1
    }
    budget.newLearningObjectsUsed += event.newContentBudget.newLearningObjectCount
    budget.newCoreExpressionsUsed += event.newContentBudget.newCoreExpressionCount
  }

  private createInstance(
    record: FixedEventUserRecord,
    event: FixedEvent,
    timeZone: string,
    recall?: { memory: Memory; sourceType: 'shared_memory' | 'legacy_expression' },
  ): FixedEventInstanceView {
    this.consumeBudget(record, event, timeZone)
    if (!record.startedEventIds.includes(event.id)) record.startedEventIds.push(event.id)
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
      recallSourceMemoryId: recall?.memory.id ?? null,
      recallSourceType: recall?.sourceType ?? null,
    }
    record.active = instance
    const view = this.render(record, instance, { advanced: true })
    this.saveRecord(record)
    return view
  }

  start(
    userId: string,
    input: { eventId: string; idempotencyKey: string; timeZone?: string },
  ): FixedEventInstanceView {
    const timeZone = input.timeZone ?? 'Asia/Shanghai'
    const cacheKey = `start:${input.eventId}:${input.idempotencyKey}`
    const record = this.loadRecord(userId)
    const cached = record.responseByIdempotencyKey[cacheKey]
    if (cached) return cached
    if (record.active && record.active.status !== 'completed') throw new Error('fixed_event_locked')
    const event = getFixedContentEvent(input.eventId)
    if (!event || event.eventType === 'recall' || this.eventStatus(record, event, timeZone) !== 'available') {
      throw new Error('fixed_event_locked')
    }
    const view = this.createInstance(record, event, timeZone)
    record.responseByIdempotencyKey[cacheKey] = view
    this.saveRecord(record)
    return view
  }

  private eligibleRecall(
    userId: string,
    record: FixedEventUserRecord,
    timeZone: string,
  ): { event: FixedEvent; memory: Memory; sourceType: 'shared_memory' | 'legacy_expression' } | null {
    const recallEvents = fixedContentV1.events
      .filter((event) => event.eventType === 'recall' && this.prerequisitesDone(record, event))
      .sort((left, right) => left.sequence - right.sequence || left.id.localeCompare(right.id))
    for (const event of recallEvents) {
      if (!this.budgetAllows(record, event, timeZone)) continue
      const recall = this.recallCandidate(userId, event)
      if (recall) return { event, ...recall }
    }
    return null
  }

  private recallPrompt(
    recall: { event: FixedEvent; memory: Memory; sourceType: 'shared_memory' | 'legacy_expression' } | null,
  ): FixedEventRecommendationView['recallPrompt'] {
    return recall ? {
      eventId: recall.event.id,
      titleZh: recall.event.titleZh,
      triggerMode: 'recall_background',
      triggerStrength: 'background_gentle',
      sourceType: recall.sourceType,
    } : null
  }

  recommendation(userId: string, timeZone = 'Asia/Shanghai'): FixedEventRecommendationView {
    const record = this.loadRecord(userId)
    const budget = this.budgetView(record, timeZone)
    if (record.active) {
      const event = getFixedContentEvent(record.active.eventId)!
      return {
        kind: 'event',
        dispatchType: event.eventType,
        triggerMode: event.triggerMode,
        triggerStrength: event.triggerStrength,
        event: null,
        activeInstance: this.render(record, record.active, { advanced: false }),
        recallPrompt: null,
        reason: 'resume',
        canRequestExtraEvent: false,
        budget,
      }
    }

    const catalog = this.catalog(userId, timeZone)
    const recall = this.eligibleRecall(userId, record, timeZone)
    const mainline = catalog.find((item) => item.eventType === 'mainline' && item.status === 'available')
    if (mainline) {
      return {
        kind: 'event', dispatchType: 'mainline', triggerMode: mainline.triggerMode,
        triggerStrength: mainline.triggerStrength, event: mainline, activeInstance: null,
        recallPrompt: this.recallPrompt(recall),
        reason: 'mainline', canRequestExtraEvent: false, budget: this.budgetView(record, timeZone),
      }
    }

    if (recall) {
      const activeInstance = this.createInstance(record, recall.event, timeZone, recall)
      return {
        kind: 'event', dispatchType: 'recall', triggerMode: recall.event.triggerMode,
        triggerStrength: recall.event.triggerStrength, event: null, activeInstance,
        recallPrompt: null,
        reason: 'recall', canRequestExtraEvent: false, budget: this.budgetView(record, timeZone),
      }
    }

    const daily = catalog.find((item) => item.eventType === 'daily' && item.status === 'available' && item.recommendedNext)
    if (daily) {
      return {
        kind: 'event', dispatchType: 'daily', triggerMode: daily.triggerMode,
        triggerStrength: daily.triggerStrength, event: daily, activeInstance: null,
        recallPrompt: null,
        reason: 'daily', canRequestExtraEvent: false, budget: this.budgetView(record, timeZone),
      }
    }
    const latestBudget = this.ensureBudget(record, timeZone)
    const budgetReached = latestBudget.newMainlineUsed >= LIMITS.newMainline
      || latestBudget.newDailyUsed >= LIMITS.newDaily
      || latestBudget.newLearningObjectsUsed >= LIMITS.newLearningObjects
      || latestBudget.newCoreExpressionsUsed >= LIMITS.newCoreExpressions
    this.saveRecord(record)
    return {
      kind: 'companion', dispatchType: 'companion', triggerMode: 'ordinary_companion',
      triggerStrength: 'none', event: null, activeInstance: null,
      recallPrompt: null,
      reason: budgetReached ? 'budget_reached' : 'nothing_suitable',
      canRequestExtraEvent: latestBudget.newMainlineUsed >= LIMITS.newMainline
        && latestBudget.extraEventUsed === 0
        && !latestBudget.extraEventGranted,
      budget: this.budgetView(record, timeZone),
    }
  }

  requestExtraEvent(userId: string, idempotencyKey: string, timeZone = 'Asia/Shanghai'): FixedEventDailyBudgetView {
    const record = this.loadRecord(userId)
    const cacheKey = `extra:${idempotencyKey}`
    const cached = record.commandByIdempotencyKey[cacheKey] as FixedEventDailyBudgetView | undefined
    if (cached) return cached
    const budget = this.ensureBudget(record, timeZone)
    if (
      budget.newMainlineUsed < LIMITS.newMainline
      || budget.extraEventGranted
      || budget.extraEventUsed >= LIMITS.extraEvent
    ) throw new Error('fixed_extra_event_unavailable')
    budget.extraEventGranted = true
    const view = this.budgetView(record, timeZone)
    record.commandByIdempotencyKey[cacheKey] = view
    this.saveRecord(record)
    return view
  }

  current(userId: string): FixedEventInstanceView | null {
    const record = this.loadRecord(userId)
    return record.active ? this.render(record, record.active, { advanced: false }) : null
  }

  advance(
    userId: string,
    instanceId: string,
    input: { inputMode: FixedContentInputMode; text?: string; choiceId?: string; idempotencyKey: string },
  ): FixedEventInstanceView {
    const cacheKey = `advance:${instanceId}:${input.idempotencyKey}`
    const record = this.loadRecord(userId)
    const cached = record.responseByIdempotencyKey[cacheKey]
    if (cached) return cached
    if (!record.active) throw new Error('fixed_no_active_event')
    if (record.active.instanceId !== instanceId) throw new Error('fixed_event_not_found')
    if (record.active.status === 'paused') throw new Error('fixed_event_paused')

    const instance = record.active
    const event = getFixedContentEvent(instance.eventId)!
    const preview = previewFixedContentIntent({
      event,
      stateId: instance.currentStateId,
      input: { inputMode: input.inputMode, text: input.text, choiceId: input.choiceId },
      policy: fixedContentV1.matchingPolicy,
      fallbacks: fixedContentV1.fallbacks,
    })
    const transition = preview.resolvedIntentId
      ? event.transitions.find((entry) => entry.fromStateId === instance.currentStateId && entry.onIntentIds.includes(preview.resolvedIntentId!)) ?? null
      : null

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

    // E01-02 的“稍后继续”是平静暂停：保留最近检查点，不写 outcome、世界状态或完成结果。
    if (event.id === 'birth_restore_object_v1' && preview.resolvedIntentId?.endsWith('_pause')) {
      instance.status = 'paused'
      const view = this.render(record, instance, { advanced: false, messageZh: '已经停在最近确认的位置，下次可以继续。' })
      record.responseByIdempotencyKey[cacheKey] = view
      this.saveRecord(record)
      return view
    }

    instance.resolvedIntentIds.push(preview.resolvedIntentId!)
    if ((input.inputMode === 'text' || input.inputMode === 'confirmed_asr_text') && input.text?.trim()) {
      instance.confirmedExpressions.push(input.text)
    }
    if (transition.outcomeId) {
      const outcome = event.outcomes.find((entry) => entry.id === transition.outcomeId)!
      for (const write of outcome.worldStateWrites) record.worldState[write.key] = write.value
      instance.selectedOutcomeId = outcome.id
      instance.resultLineIds = outcome.resultLineIds
    }

    instance.currentStateId = transition.toStateId
    const completed = transition.toStateId === 'completed'
    if (completed) {
      instance.status = 'completed'
      instance.completedAt = this.now().toISOString()
      if (event.eventType === 'mainline' && !record.completedEventIds.includes(event.id)) {
        record.completedEventIds.push(event.id)
      }
      if (event.eventType === 'daily') {
        record.dailyTopicCursor = event.id
        record.dailyCompletionByEventId[event.id] = instance.completedAt
      }
      if (instance.memoryProposed !== true) {
        this.proposeOnCompletion(record, instance, event, userId)
        instance.memoryProposed = true
      }
      record.active = null
    }

    const view = this.render(record, instance, { advanced: true }, completed ? transition.fromStateId : undefined)
    record.responseByIdempotencyKey[cacheKey] = view
    this.saveRecord(record)
    return view
  }

  pause(userId: string, instanceId: string, idempotencyKey: string): FixedEventInstanceView {
    const record = this.loadRecord(userId)
    const cacheKey = `pause:${instanceId}:${idempotencyKey}`
    const cached = record.responseByIdempotencyKey[cacheKey]
    if (cached) return cached
    if (!record.active || record.active.instanceId !== instanceId) throw new Error('fixed_event_not_found')
    record.active.status = 'paused'
    const view = this.render(record, record.active, { advanced: false })
    record.responseByIdempotencyKey[cacheKey] = view
    this.saveRecord(record)
    return view
  }

  resume(userId: string, instanceId: string, idempotencyKey: string): FixedEventInstanceView {
    const record = this.loadRecord(userId)
    const cacheKey = `resume:${instanceId}:${idempotencyKey}`
    const cached = record.responseByIdempotencyKey[cacheKey]
    if (cached) return cached
    if (!record.active || record.active.instanceId !== instanceId) throw new Error('fixed_event_not_found')
    record.active.status = 'active'
    const view = this.render(record, record.active, { advanced: true })
    record.responseByIdempotencyKey[cacheKey] = view
    this.saveRecord(record)
    return view
  }

  private proposeOnCompletion(record: FixedEventUserRecord, instance: FixedEventInstanceRecord, event: FixedEvent, userId: string): void {
    const confirmedSentence = instance.confirmedExpressions[instance.confirmedExpressions.length - 1] ?? ''
    const outcomeId = instance.selectedOutcomeId ?? ''
    const proposals: MemoryProposalInput[] = []
    for (const rule of event.memoryRules) {
      if (!rule.sourceIntentIds.some((id) => instance.resolvedIntentIds.includes(id))) continue
      const rendered = rule.contentTemplate
        .replace(/\{\{confirmed_user_sentence\}\}/g, confirmedSentence)
        .replace(/\{\{([a-z0-9_]+)\}\}/g, (_, key: string) => String(record.worldState[key] ?? ''))
        .trim()
      if (!rendered || (rule.kind === 'language' && !confirmedSentence)) continue
      proposals.push({
        kind: rule.kind,
        content: rendered,
        confidence: 'high',
        semanticTags: [event.id, outcomeId],
        ...(rule.kind === 'language' ? { expression: confirmedSentence, naturalExpression: confirmedSentence } : {}),
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
