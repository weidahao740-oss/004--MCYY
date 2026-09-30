import { randomUUID } from 'node:crypto'
import type {
  EventActionRequest,
  EventActionResponse,
  EventCatalogItem,
  EventDefinition,
  EventInstanceView,
  EventState,
  RelationshipStage,
  ResurfacingPrompt,
  StartEventRequest,
  WorldStateValue,
} from '@english-pet/contracts'
import { eventsV1, getEventDefinition } from '@english-pet/domain'
import { fromJson, openDatabase, toJson } from './sqlite-db.js'
import type { SqliteFeedbackStore } from './sqlite-feedback-store.js'
import type { SqliteJournalStore } from './sqlite-journal-store.js'
import type { SqliteMemoryStore } from './sqlite-memory-store.js'
import type { SqliteResurfacingStore } from './sqlite-resurfacing-store.js'

/**
 * SQLite 持久化事件引擎(event engine)实例与世界状态。
 * 行为与 MemoryEventEngine 完全一致（错误 message、返回结构逐字对齐）。
 */

interface IRuntimeEvent {
  instanceId: string
  definition: EventDefinition
  status: EventInstanceView['status']
  currentStateId: string
  clarificationCount: number
  selectedOutcomeId: string | null
  lastConfirmedUserExpression: string | null
  confirmedExpressions: Array<{ text: string; inputMode: EventActionRequest['inputMode'] }>
  confirmedSlots: Record<string, WorldStateValue>
  resurfacingPrompt: ResurfacingPrompt | null
  resurfacingRecorded: boolean
  startOrdinal: number
}

interface IUserEventState {
  firstDayCompleted: boolean
  completedEventKeys: Set<string>
  worldState: Record<string, WorldStateValue>
  instances: Map<string, IRuntimeEvent>
  activeInstanceId: string | null
  completedAtByEventKey: Map<string, number>
  completedCountByEventKey: Map<string, number>
  startedEventCount: number
  responseByIdempotencyKey: Map<string, EventActionResponse | EventInstanceView>
}

interface IPersistedRuntimeEvent {
  instanceId: string
  eventKey: string
  status: EventInstanceView['status']
  currentStateId: string
  clarificationCount: number
  selectedOutcomeId: string | null
  lastConfirmedUserExpression: string | null
  confirmedExpressions: Array<{ text: string; inputMode: EventActionRequest['inputMode'] }>
  confirmedSlots: Record<string, WorldStateValue>
  resurfacingPrompt: ResurfacingPrompt | null
  resurfacingRecorded: boolean
  startOrdinal: number
}

interface IPersistedEventState {
  firstDayCompleted: boolean
  completedEventKeys: string[]
  worldState: Record<string, WorldStateValue>
  instances: IPersistedRuntimeEvent[]
  activeInstanceId: string | null
  completedAtByEventKey: Array<[string, number]>
  completedCountByEventKey: Record<string, number>
  startedEventCount: number
  responseByIdempotencyKey: Record<string, EventActionResponse | EventInstanceView>
}

function firstLine(state: EventState): string {
  return state.lines[0]?.text ?? ''
}

function actionsFor(runtime: IRuntimeEvent, state: EventState): EventInstanceView['allowedActions'] {
  if (runtime.status === 'paused') return ['continue']
  if (runtime.status === 'completed') return []
  const transitions = runtime.definition.transitions.filter((item) => item.from === state.id)
  const triggers = new Set(transitions.map((item) => item.on))
  const hasText = state.acceptedInputModes.some((mode) => mode === 'text' || mode === 'voice' || mode === 'reference_reply')
  const hasChoice = state.acceptedInputModes.includes('choice')
  const actions = new Set<EventInstanceView['allowedActions'][number]>(['pause'])
  if (triggers.has('continue')) actions.add('continue')
  if (triggers.has('user_declines')) actions.add('decline')
  if (triggers.has('result_committed')) actions.add('complete')
  if (hasText && (triggers.has('meaning_understood') || triggers.has('meaning_ambiguous') || triggers.has('continue'))) actions.add('submit')
  if (hasText && triggers.has('clarification_resolved')) actions.add('clarify')
  if (hasChoice && (triggers.has('choice_confirmed') || triggers.has('meaning_understood') || triggers.has('clarification_resolved'))) actions.add('confirm')
  return [...actions]
}

function view(runtime: IRuntimeEvent, user: IUserEventState): EventInstanceView {
  const currentState = runtime.definition.states.find((state) => state.id === runtime.currentStateId)
  if (!currentState) throw new Error('event_state_missing')
  return {
    instanceId: runtime.instanceId,
    eventKey: runtime.definition.id,
    eventVersion: runtime.definition.version,
    rulesetId: eventsV1.id,
    status: runtime.status,
    currentState,
    clarificationCount: runtime.clarificationCount,
    selectedOutcomeId: runtime.selectedOutcomeId,
    allowedActions: actionsFor(runtime, currentState),
    availableOutcomes: runtime.selectedOutcomeId === null && currentState.phase === 'choice'
      ? runtime.definition.outcomes.map(({ id, label }) => ({ id, label }))
      : [],
    worldState: { ...user.worldState },
    completedEventKeys: [...user.completedEventKeys],
    resurfacingPrompt: runtime.resurfacingRecorded ? null : runtime.resurfacingPrompt,
  }
}

function conditionSatisfied(condition: EventDefinition['trigger']['requiredWorldState'][number], world: Record<string, WorldStateValue>): boolean {
  const actual = world[condition.key]
  if (condition.operator === 'exists') return actual !== undefined
  if (condition.operator === 'equals') return actual === condition.value
  if (condition.operator === 'not_equals') return actual !== condition.value
  return Array.isArray(condition.value) && condition.value.includes(actual)
}

function unlocked(definition: EventDefinition, user: IUserEventState, relationshipStage: RelationshipStage): boolean {
  if (!definition.trigger.allowedRelationshipStages.includes(relationshipStage)) return false
  const completedAt = user.completedAtByEventKey.get(definition.id)
  if (definition.trigger.repeatPolicy === 'once' && user.completedEventKeys.has(definition.id)) return false
  if (completedAt && definition.trigger.cooldownHours !== null && Date.now() - completedAt < definition.trigger.cooldownHours * 3_600_000) return false
  return definition.trigger.requiredCompletedEventIds.every((key) => user.completedEventKeys.has(key))
    && definition.trigger.requiredWorldState.every((condition) => conditionSatisfied(condition, user.worldState))
}

function statusFor(definition: EventDefinition, user: IUserEventState, relationshipStage: RelationshipStage): EventCatalogItem['status'] {
  const existing = [...user.instances.values()].find((item) => item.definition.id === definition.id)
  if (existing?.status === 'active' || existing?.status === 'paused') return existing.status
  if (definition.trigger.repeatPolicy === 'once' && (existing?.status === 'completed' || user.completedEventKeys.has(definition.id))) return 'completed'
  return unlocked(definition, user, relationshipStage) ? 'available' : 'locked'
}

function chooseTransition(runtime: IRuntimeEvent, action: EventActionRequest) {
  const current = runtime.currentStateId
  const transitions = runtime.definition.transitions.filter((item) => item.from === current)
  const normalized = `${action.text ?? ''} ${action.choiceId ?? ''}`.toLowerCase()
  const ambiguous = /\bleave\b/.test(normalized) && !/(sign|put|place|go away)/.test(normalized)
    || /\bself\b/.test(normalized)
    || /\b(can|can't)\b/.test(normalized) && /\bmaybe\b/.test(normalized)

  const supportsAmbiguityTransition = transitions.some((item) => item.on === 'meaning_ambiguous')
  const preferredTriggers = action.action === 'decline' ? ['user_declines']
    : action.action === 'clarify' ? ['clarification_resolved', 'meaning_ambiguous']
    : action.action === 'complete' ? ['result_committed']
    : ambiguous && supportsAmbiguityTransition ? ['meaning_ambiguous']
    : action.action === 'submit' ? (runtime.selectedOutcomeId ? ['choice_confirmed', 'meaning_understood', 'continue'] : ['meaning_understood', 'choice_confirmed', 'continue'])
    : action.action === 'confirm' ? ['choice_confirmed', 'meaning_understood', 'clarification_resolved', 'continue']
    : ['continue', 'choice_confirmed', 'meaning_understood']

  const transition = preferredTriggers
    .map((trigger) => transitions.find((item) => item.on === trigger))
    .find((item) => item !== undefined)
  return { transition, ambiguous }
}

function inferOutcome(definition: EventDefinition, action: EventActionRequest) {
  if (action.choiceId) {
    const exact = definition.outcomes.find((outcome) => outcome.id === action.choiceId)
    if (exact) return exact
  }
  const text = `${action.text ?? ''} ${action.choiceId ?? ''}`.toLowerCase()
  const aliases: Record<string, string[]> = {
    reply_now: ['reply now', 'answer now'], observe_first: ['wait', 'observe', 'listen'],
    chair_added: ['chair', 'seat'], shelf_added: ['shelf'], kettle_added: ['kettle', 'tea'],
    meaning_confirmed_first_try: ['yes', 'right', 'correct'], meaning_repaired: ['meant', 'clarify', 'not quite'], neutral_example_completed: ['neutral', 'example'],
    went_to_mailbox: ['go now', 'mailbox'], waited_for_quiet: ['wait', 'quiet'], postponed_without_penalty: ['later', 'another day', 'postpone'],
    story_shared: ['standard story'], quick_story_shared: ['quick', 'one-minute', 'one minute'], room_detail_shared: ['room detail', 'kettle sound'], closed_without_sharing: ['stop', 'not talk'],
  }
  return definition.outcomes.find((outcome) => aliases[outcome.id]?.some((alias) => text.includes(alias)))
}

function persistState(state: IUserEventState): IPersistedEventState {
  return {
    firstDayCompleted: state.firstDayCompleted,
    completedEventKeys: [...state.completedEventKeys],
    worldState: state.worldState,
    instances: [...state.instances.values()].map((runtime) => ({
      instanceId: runtime.instanceId,
      eventKey: runtime.definition.id,
      status: runtime.status,
      currentStateId: runtime.currentStateId,
      clarificationCount: runtime.clarificationCount,
      selectedOutcomeId: runtime.selectedOutcomeId,
      lastConfirmedUserExpression: runtime.lastConfirmedUserExpression,
      confirmedExpressions: runtime.confirmedExpressions,
      confirmedSlots: runtime.confirmedSlots,
      resurfacingPrompt: runtime.resurfacingPrompt,
      resurfacingRecorded: runtime.resurfacingRecorded,
      startOrdinal: runtime.startOrdinal,
    })),
    activeInstanceId: state.activeInstanceId,
    completedAtByEventKey: [...state.completedAtByEventKey.entries()],
    completedCountByEventKey: Object.fromEntries(state.completedCountByEventKey.entries()),
    startedEventCount: state.startedEventCount,
    responseByIdempotencyKey: Object.fromEntries(state.responseByIdempotencyKey.entries()),
  }
}

function hydrateState(persisted: IPersistedEventState): IUserEventState {
  const instances = new Map<string, IRuntimeEvent>()
  for (const p of persisted.instances) {
    instances.set(p.instanceId, {
      instanceId: p.instanceId,
      definition: getEventDefinition(p.eventKey)!,
      status: p.status,
      currentStateId: p.currentStateId,
      clarificationCount: p.clarificationCount,
      selectedOutcomeId: p.selectedOutcomeId,
      lastConfirmedUserExpression: p.lastConfirmedUserExpression,
      confirmedExpressions: p.confirmedExpressions,
      confirmedSlots: p.confirmedSlots,
      resurfacingPrompt: p.resurfacingPrompt,
      resurfacingRecorded: p.resurfacingRecorded,
      startOrdinal: p.startOrdinal,
    })
  }
  return {
    firstDayCompleted: persisted.firstDayCompleted,
    completedEventKeys: new Set(persisted.completedEventKeys),
    worldState: persisted.worldState,
    instances,
    activeInstanceId: persisted.activeInstanceId,
    completedAtByEventKey: new Map(persisted.completedAtByEventKey),
    completedCountByEventKey: new Map(Object.entries(persisted.completedCountByEventKey)),
    startedEventCount: persisted.startedEventCount,
    responseByIdempotencyKey: new Map(Object.entries(persisted.responseByIdempotencyKey)),
  }
}

function emptyState(): IUserEventState {
  return {
    firstDayCompleted: false,
    completedEventKeys: new Set(),
    worldState: {},
    instances: new Map(),
    activeInstanceId: null,
    completedAtByEventKey: new Map(),
    completedCountByEventKey: new Map(),
    startedEventCount: 0,
    responseByIdempotencyKey: new Map(),
  }
}

export class SqliteEventEngine {
  constructor(
    private readonly memoryStore?: SqliteMemoryStore,
    private readonly journalStore?: SqliteJournalStore,
    private readonly feedbackStore?: SqliteFeedbackStore,
    private readonly resurfacingStore?: SqliteResurfacingStore,
  ) {}

  private loadState(userId: string): IUserEventState {
    const row = openDatabase().prepare('SELECT record FROM event_state WHERE user_id = ?').get(userId) as { record: string } | undefined
    if (!row) return emptyState()
    return hydrateState(fromJson<IPersistedEventState>(row.record)!)
  }

  private saveState(userId: string, state: IUserEventState) {
    openDatabase()
      .prepare(
        `INSERT INTO event_state (user_id, record) VALUES (?, ?)
         ON CONFLICT(user_id) DO UPDATE SET record = excluded.record`,
      )
      .run(userId, toJson(persistState(state)))
  }

  markFirstDayCompleted(userId: string, restoredObject: 'lamp' | 'plant') {
    const user = this.loadState(userId)
    user.firstDayCompleted = true
    user.completedEventKeys.add('first_day_v1')
    user.completedCountByEventKey.set('first_day_v1', 1)
    user.worldState.first_day_status = 'completed'
    user.worldState.first_restored_object = restoredObject
    user.worldState.room_light_restored = restoredObject === 'lamp'
    this.saveState(userId, user)
  }

  catalog(userId: string, relationshipStage: RelationshipStage = 'NEW'): EventCatalogItem[] {
    const user = this.loadState(userId)
    return eventsV1.events.map((definition) => ({
      eventKey: definition.id,
      version: definition.version,
      title: definition.title,
      titleZh: definition.titleZh,
      status: statusFor(definition, user, relationshipStage),
      estimatedMinutes: definition.estimatedMinutes,
    }))
  }

  current(userId: string): EventInstanceView | null {
    const user = this.loadState(userId)
    const runtime = user.activeInstanceId ? user.instances.get(user.activeInstanceId) : undefined
    if (runtime?.resurfacingPrompt && !this.resurfacingStore?.isPromptActive(userId, runtime.resurfacingPrompt)) runtime.resurfacingPrompt = null
    const result = runtime ? view(runtime, user) : null
    this.saveState(userId, user)
    return result
  }

  start(userId: string, input: StartEventRequest, relationshipStage: RelationshipStage = 'NEW'): EventInstanceView {
    const user = this.loadState(userId)
    const cached = user.responseByIdempotencyKey.get(input.idempotencyKey)
    if (cached && 'instanceId' in cached) {
      this.saveState(userId, user)
      return cached
    }
    const current = this.current(userId)
    if (current) {
      // current() 已落库；这里需重新加载以拿到最新状态（resurfacing 可能已变更）
      const fresh = this.loadState(userId)
      return view(fresh.instances.get(fresh.activeInstanceId!)!, fresh)
    }
    const definition = getEventDefinition(input.eventKey)
    if (!definition || !unlocked(definition, user, relationshipStage)) throw new Error('event_locked')
    const runtime: IRuntimeEvent = {
      instanceId: randomUUID(), definition, status: 'active',
      currentStateId: definition.states[0].id, clarificationCount: 0,
      selectedOutcomeId: null, lastConfirmedUserExpression: null, confirmedExpressions: [],
      confirmedSlots: {},
      resurfacingPrompt: null, resurfacingRecorded: false, startOrdinal: user.startedEventCount + 1,
    }
    user.startedEventCount = runtime.startOrdinal
    runtime.resurfacingPrompt = this.resurfacingStore?.selectForEvent(
      userId, definition, runtime.startOrdinal, user.completedCountByEventKey,
    ) ?? null
    user.instances.set(runtime.instanceId, runtime)
    user.activeInstanceId = runtime.instanceId
    const result = view(runtime, user)
    user.responseByIdempotencyKey.set(input.idempotencyKey, result)
    this.saveState(userId, user)
    return result
  }

  recordResurfacing(userId: string, instanceId: string, result: NonNullable<EventActionRequest['resurfacingResult']>) {
    const user = this.loadState(userId)
    const runtime = user.instances.get(instanceId)
    if (!runtime || !runtime.resurfacingPrompt || runtime.resurfacingRecorded) throw new Error('resurfacing_not_available')
    if (!this.resurfacingStore?.isPromptActive(userId, runtime.resurfacingPrompt)) {
      runtime.resurfacingPrompt = null
      this.saveState(userId, user)
      throw new Error('resurfacing_not_available')
    }
    this.resurfacingStore.recordAttempt(userId, runtime.instanceId, runtime.resurfacingPrompt, result, runtime.startOrdinal)
    runtime.resurfacingRecorded = true
    const viewResult = view(runtime, user)
    this.saveState(userId, user)
    return viewResult
  }

  act(userId: string, instanceId: string, action: EventActionRequest): EventActionResponse {
    const user = this.loadState(userId)
    const cached = user.responseByIdempotencyKey.get(action.idempotencyKey)
    if (cached && 'instance' in cached) {
      this.saveState(userId, user)
      return cached
    }
    const runtime = user.instances.get(instanceId)
    if (!runtime) throw new Error('event_not_found')

    if (action.action === 'pause') {
      runtime.status = 'paused'
      const result = this.response(runtime, user, 'Event paused. You can continue later.', '事件已暂停，可以稍后继续。', false, false, null)
      user.responseByIdempotencyKey.set(action.idempotencyKey, result)
      this.saveState(userId, user)
      return result
    }
    if (runtime.status === 'paused') {
      runtime.status = 'active'
      const result = this.response(runtime, user, firstLine(runtime.definition.states.find((state) => state.id === runtime.currentStateId)!), '已从最近确认状态恢复。', false, false, null)
      user.responseByIdempotencyKey.set(action.idempotencyKey, result)
      this.saveState(userId, user)
      return result
    }

    const { transition, ambiguous } = chooseTransition(runtime, action)
    if (!transition) throw new Error('transition_not_allowed')

    if (runtime.currentStateId === 'ro04_place') {
      const placementInput = `${action.choiceId ?? ''} ${action.text ?? ''}`.toLowerCase()
      if (/\bwindow\b/.test(placementInput)) runtime.confirmedSlots.room_placement = 'window'
      else if (/\bdoor\b/.test(placementInput)) runtime.confirmedSlots.room_placement = 'door'
    }

    if (action.text && (action.action === 'submit' || action.action === 'clarify' || action.action === 'confirm')) {
      const confirmedText = action.text.trim()
      runtime.lastConfirmedUserExpression = confirmedText || runtime.lastConfirmedUserExpression
      if (confirmedText) runtime.confirmedExpressions.push({ text: confirmedText, inputMode: action.inputMode })
    }
    if (runtime.resurfacingPrompt && !runtime.resurfacingRecorded) {
      if (!this.resurfacingStore?.isPromptActive(userId, runtime.resurfacingPrompt)) {
        runtime.resurfacingPrompt = null
      } else if (action.resurfacingResult) {
        this.resurfacingStore.recordAttempt(userId, runtime.instanceId, runtime.resurfacingPrompt, action.resurfacingResult, runtime.startOrdinal)
        runtime.resurfacingRecorded = true
      } else if (action.text) {
        const inferred = this.resurfacingStore.inferResult(runtime.resurfacingPrompt, action.text, action.action)
        if (inferred === 'used' || inferred === 'paraphrased') {
          this.resurfacingStore.recordAttempt(userId, runtime.instanceId, runtime.resurfacingPrompt, inferred, runtime.startOrdinal)
          runtime.resurfacingRecorded = true
        }
      }
    }

    if (action.action === 'decline') {
      const declineOutcomeId = runtime.definition.id === 'first_outing_v1' ? 'postponed_without_penalty'
        : runtime.definition.id === 'today_story_v1' ? 'closed_without_sharing'
        : runtime.definition.id === 'literal_misunderstanding_v1' ? 'neutral_example_completed'
        : null
      if (declineOutcomeId) runtime.selectedOutcomeId = declineOutcomeId
    }

    if (action.action === 'decline' && transition.to === runtime.currentStateId) {
      runtime.status = 'paused'
      const result = this.response(runtime, user, 'Event paused. You can continue later.', '事件已暂停，可以稍后继续。', false, false, null)
      user.responseByIdempotencyKey.set(action.idempotencyKey, result)
      this.saveState(userId, user)
      return result
    }

    if (ambiguous && transition.on === 'meaning_ambiguous' && runtime.clarificationCount < runtime.definition.misunderstanding.maxClarificationTurns) {
      runtime.clarificationCount += 1
      runtime.currentStateId = runtime.definition.misunderstanding.recoveryStateId
      const result = this.response(
        runtime, user,
        `${runtime.definition.misunderstanding.morrowLine} ${runtime.definition.misunderstanding.clarificationPrompt}`,
        'Morrow 发现了一个可澄清的歧义。请继续说明你的意思。',
        true, false, null,
      )
      user.responseByIdempotencyKey.set(action.idempotencyKey, result)
      this.saveState(userId, user)
      return result
    }

    if (transition.to === 'completed') {
      const outcome = runtime.selectedOutcomeId
        ? runtime.definition.outcomes.find((item) => item.id === runtime.selectedOutcomeId) ?? inferOutcome(runtime.definition, action) ?? runtime.definition.outcomes[0]
        : inferOutcome(runtime.definition, action) ?? runtime.definition.outcomes[0]
      runtime.selectedOutcomeId = outcome.id
      runtime.status = 'completed'
      for (const write of outcome.worldStateWrites) {
        if (write.fromSlot) {
          const slotValue = runtime.confirmedSlots[write.fromSlot]
          if (slotValue === undefined) throw new Error(`unconfirmed_slot:${write.fromSlot}`)
          if (!write.allowedValues?.includes(slotValue)) throw new Error(`unconfirmed_slot:${write.fromSlot}`)
          user.worldState[write.key] = slotValue
        } else {
          if (write.value === undefined) throw new Error(`missing_value:${write.key}`)
          user.worldState[write.key] = write.value
        }
      }
      user.completedEventKeys.add(runtime.definition.id)
      user.completedAtByEventKey.set(runtime.definition.id, Date.now())
      user.completedCountByEventKey.set(runtime.definition.id, (user.completedCountByEventKey.get(runtime.definition.id) ?? 0) + 1)
      user.activeInstanceId = null
      if (runtime.resurfacingPrompt && !runtime.resurfacingRecorded) {
        const result = this.resurfacingStore?.isPromptActive(userId, runtime.resurfacingPrompt)
          ? this.resurfacingStore.inferResult(runtime.resurfacingPrompt, runtime.confirmedExpressions.map((item) => item.text).join(' '), action.action)
          : 'not_applicable'
        this.resurfacingStore?.recordAttempt(userId, runtime.instanceId, runtime.resurfacingPrompt, result, runtime.startOrdinal)
        runtime.resurfacingRecorded = true
      }
      this.memoryStore?.proposeFromEvent(userId, runtime.instanceId, runtime.definition.id, outcome.id)
      this.journalStore?.createFromEvent({
        userId,
        eventInstanceId: runtime.instanceId,
        eventKey: runtime.definition.id,
        outcomeId: outcome.id,
        userExpression: runtime.lastConfirmedUserExpression ?? outcome.label,
      })
      const feedback = this.feedbackStore?.createFromEvent({
        userId,
        eventInstanceId: runtime.instanceId,
        definition: runtime.definition,
        expressions: runtime.confirmedExpressions,
        clarificationCount: runtime.clarificationCount,
      }) ?? null
      const result = this.response(runtime, user, outcome.visibleEffect, '事件结果已确认并写入世界状态。', false, action.action === 'clarify', { id: outcome.id, visibleEffect: outcome.visibleEffect }, feedback)
      user.responseByIdempotencyKey.set(action.idempotencyKey, result)
      this.saveState(userId, user)
      return result
    }

    runtime.currentStateId = transition.to
    const inferredOutcome = inferOutcome(runtime.definition, action)
    if (action.choiceId && runtime.definition.outcomes.some((outcome) => outcome.id === action.choiceId)) {
      runtime.selectedOutcomeId = action.choiceId
    } else if (action.text && inferredOutcome) {
      runtime.selectedOutcomeId = inferredOutcome.id
    }
    const nextState = runtime.definition.states.find((state) => state.id === transition.to)
    const result = this.response(runtime, user, nextState ? firstLine(nextState) : '', '状态已推进；你的表达影响了事件路径。', false, action.action === 'clarify', null)
    user.responseByIdempotencyKey.set(action.idempotencyKey, result)
    this.saveState(userId, user)
    return result
  }

  clearUser(userId: string) {
    openDatabase().prepare('DELETE FROM event_state WHERE user_id = ?').run(userId)
  }

  private response(runtime: IRuntimeEvent, user: IUserEventState, message: string, messageZh: string, misunderstanding: boolean, recovered: boolean, outcome: EventActionResponse['outcome'], feedback: EventActionResponse['feedback'] = null): EventActionResponse {
    return { instance: view(runtime, user), message, messageZh, misunderstanding, recovered, outcome, feedback }
  }
}
