import { completeTeaching } from './fixed-teaching-test-helper.js'
import assert from 'node:assert/strict'
import { existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fixedContentV1, getFixedContentEvent } from '@english-pet/domain'
import { fixedEventSchema, type FixedEvent, type Memory } from '@english-pet/contracts'
import { openDatabase } from './sqlite-db.js'
import { selectRecallCandidate, SqliteFixedEventEngine } from './sqlite-fixed-event-engine.js'
import { SqliteMemoryStore } from './sqlite-memory-store.js'

const dbPath = join(tmpdir(), `fixed-scheduler-smoke-${Date.now()}.db`)
process.env.SQLITE_PATH = dbPath
let now = new Date('2026-10-11T01:00:00.000Z')
let sequence = 0
const key = (label: string) => `${label}-${++sequence}`

function asrAdvance(engine: SqliteFixedEventEngine, userId: string, instanceId: string, text: string, idempotencyKey: string) {
  const stateId = engine.current(userId)!.currentState.id
  completeTeaching(engine, userId, instanceId)
  const proof = engine.issueAsrProof(userId, instanceId, stateId, text)
  return engine.advance(userId, instanceId, { inputMode: 'confirmed_asr_text', text, asrProof: proof.proof, idempotencyKey })
}

function memoryCandidate(
  id: string,
  kind: Memory['kind'],
  semanticTags: string[],
  createdAt: string,
): Memory {
  return {
    id,
    kind,
    status: 'confirmed',
    content: `memory-${id}`,
    expression: kind === 'language' ? `expression-${id}` : null,
    naturalExpression: kind === 'language' ? `expression-${id}` : null,
    semanticTags,
    confidence: 'high',
    requiresUserConfirmation: true,
    sourceType: 'event',
    sourceConversationId: null,
    sourceEventInstanceId: '00000000-0000-4000-8000-000000000001',
    version: 1,
    createdAt,
    confirmedAt: createdAt,
    pausedAt: null,
    expiresAt: null,
  }
}

function recallVariant(sourceTypes: FixedEvent['recallSourceTypes']): FixedEvent {
  return {
    ...getFixedContentEvent('b2_recall_room_v1')!,
    recallSourceTypes: sourceTypes,
  }
}

function finishBfv(engine: SqliteFixedEventEngine, user: string) {
  let view = engine.start(user, { eventId: 'birth_first_voice_v1', idempotencyKey: key('bfv-start') })
  const id = view.instanceId
  engine.advance(user, id, { inputMode: 'choice', choiceId: 'c1e1_choice_open', idempotencyKey: key('bfv-open') })
  engine.advance(user, id, { inputMode: 'choice', choiceId: 'c1e1_choice_presence', idempotencyKey: key('bfv-route') })
  asrAdvance(engine, user, id, "Yes, I'm here.", key('bfv-presence'))
  engine.advance(user, id, { inputMode: 'choice', choiceId: 'c1e1_choice_feedback_presence', idempotencyKey: key('bfv-feedback') })
view = engine.advance(user, id, { inputMode: 'choice', choiceId: 'c1e1_choice_finish', idempotencyKey: key('bfv-finish') })
  assert.equal(view.status, 'completed')
}

function finishDaily(engine: SqliteFixedEventEngine, user: string, eventId: string) {
  let view = engine.start(user, { eventId, idempotencyKey: key('daily-start') })
  const id = view.instanceId
  const event = getFixedContentEvent(eventId)!
  const openState = event.states.find((state) => state.id === view.currentState.id)!
  view = engine.advance(user, id, { inputMode: 'choice', choiceId: openState.choices[0].id, idempotencyKey: key('daily-open') })
  const replyState = event.states.find((state) => state.id === view.currentState.id)!
  view = engine.advance(user, id, { inputMode: 'choice', choiceId: replyState.choices[0].id, idempotencyKey: key('daily-choice') })
  const resultState = event.states.find((state) => state.id === view.currentState.id)!
  view = engine.advance(user, id, { inputMode: 'choice', choiceId: resultState.choices[0].id, idempotencyKey: key('daily-finish') })
  assert.equal(view.status, 'completed')
}

const e206 = getFixedContentEvent('b2_my_likes_v1')!
assert.deepEqual(e206.prerequisiteEventIds, ['b2_outside_road_v1'])
assert.ok(!e206.prerequisiteEventIds.includes('b2_colors_v1'))
const e212 = getFixedContentEvent('b2_ready_for_school_v1')!
assert.ok(e212.prerequisiteEventIds.includes('b2_sound_comes_back_v1'))
assert.ok(!e212.prerequisiteEventIds.includes('b2_recall_room_v1'))
const mainlineEvent = getFixedContentEvent('birth_first_voice_v1')!
assert.equal(mainlineEvent.eventType, 'mainline')
assert.equal(mainlineEvent.triggerMode, 'mainline_invitation')
assert.equal(mainlineEvent.triggerStrength, 'direct_invitation')
const dailyEvent = getFixedContentEvent('dt_weather_outside_v1')!
assert.equal(dailyEvent.eventType, 'daily')
assert.equal(dailyEvent.triggerMode, 'daily_environment')
assert.equal(dailyEvent.triggerStrength, 'ambient_hint')
const recallEvent = getFixedContentEvent('b2_recall_room_v1')!
assert.equal(recallEvent.eventType, 'recall')
assert.equal(recallEvent.triggerMode, 'recall_background')
assert.equal(recallEvent.triggerStrength, 'background_gentle')
assert.ok(recallEvent.recallSemanticTags.includes('b2_recall_room_v1'))
assert.equal(fixedContentV1.events.every((event) => fixedEventSchema.safeParse(event).success), true)
assert.equal(fixedEventSchema.safeParse({ ...recallEvent, recallSemanticTags: [] }).success, false)
assert.equal(fixedEventSchema.safeParse({ ...recallEvent, recallSourceTypes: [] }).success, false)

const unrelatedRelationship = memoryCandidate(
  '00000000-0000-4000-8000-000000000010', 'relationship', ['unrelated_school_lunch'], '2026-10-10T00:00:00.000Z',
)
const relatedRelationship = memoryCandidate(
  '00000000-0000-4000-8000-000000000011', 'relationship', ['first_room'], '2026-10-10T01:00:00.000Z',
)
const relatedLanguage = memoryCandidate(
  '00000000-0000-4000-8000-000000000012', 'language', ['b2_recall_room_v1'], '2026-10-10T02:00:00.000Z',
)
const exactRelationship = memoryCandidate(
  '00000000-0000-4000-8000-000000000013', 'relationship', ['b2_recall_room_v1'], '2026-10-10T03:00:00.000Z',
)
assert.equal(selectRecallCandidate(recallEvent, [unrelatedRelationship]), null)
assert.equal(selectRecallCandidate(recallVariant(['shared_memory']), [relatedLanguage]), null)
assert.equal(selectRecallCandidate(recallVariant(['legacy_expression']), [relatedRelationship]), null)
assert.equal(selectRecallCandidate(recallEvent, [relatedRelationship])?.sourceType, 'shared_memory')
assert.equal(selectRecallCandidate(recallEvent, [relatedLanguage])?.sourceType, 'legacy_expression')
assert.equal(
  selectRecallCandidate(recallEvent, [unrelatedRelationship, relatedRelationship, exactRelationship])?.memory.id,
  exactRelationship.id,
)


function seedCompletedMainlineUser(userId: string, completedEventIds = completedMainline) {
  openDatabase().prepare('INSERT INTO fixed_event_state (user_id, record) VALUES (?, ?)').run(userId, JSON.stringify({
    userId,
    worldState: {}, completedEventIds, startedEventIds: completedEventIds,
    dailyCompletionByEventId: {}, dailyTopicCursor: null, budget: null, active: null,
    responseByIdempotencyKey: {}, commandByIdempotencyKey: {},
  }))
}

const engine = new SqliteFixedEventEngine({ now: () => now })
const dependencyUser = 'dependency-user'
const completedMainline = [
  'birth_first_voice_v1', 'b1_first_room_object_v1', 'b2_room_tour_v1', 'b2_name_objects_v1',
  'b2_outside_road_v1', 'b2_my_likes_v1', 'b2_small_task_v1', 'b2_sound_comes_back_v1',
]
openDatabase().prepare('INSERT INTO fixed_event_state (user_id, record) VALUES (?, ?)').run(dependencyUser, JSON.stringify({
  userId: dependencyUser,
  worldState: {},
  completedEventIds: completedMainline,
  startedEventIds: completedMainline,
  dailyCompletionByEventId: {},
  dailyTopicCursor: null,
  budget: null,
  active: null,
  responseByIdempotencyKey: {},
  commandByIdempotencyKey: {},
}))
let catalog = engine.catalog(dependencyUser)
assert.equal(catalog.find((item) => item.eventId === 'b2_ready_for_school_v1')?.status, 'available')
assert.equal(catalog.some((item) => item.eventId === 'b2_recall_room_v1'), false)

const dailyUser = 'daily-user'
finishBfv(engine, dailyUser)
catalog = engine.catalog(dailyUser)
assert.equal(catalog.find((item) => item.eventId === 'dt_weather_outside_v1')?.status, 'available')
finishDaily(engine, dailyUser, 'dt_weather_outside_v1')
catalog = engine.catalog(dailyUser)
assert.equal(catalog.find((item) => item.eventId === 'dt_weather_outside_v1')?.status, 'cooldown')
assert.notEqual(catalog.find((item) => item.recommendedNext)?.eventId, 'dt_weather_outside_v1')
now = new Date('2026-10-12T02:00:01.000Z')
const restarted = new SqliteFixedEventEngine({ now: () => now })
catalog = restarted.catalog(dailyUser)
assert.equal(catalog.find((item) => item.eventId === 'dt_weather_outside_v1')?.status, 'available')

const pauseUser = 'pause-user'
finishBfv(restarted, pauseUser)
let bro = restarted.start(pauseUser, { eventId: 'b1_first_room_object_v1', idempotencyKey: key('bro-start') })
const checkpoint = bro.currentState.id
const paused = restarted.pause(pauseUser, bro.instanceId, key('bro-pause'))
assert.equal(paused.status, 'paused')
const afterRestart = new SqliteFixedEventEngine({ now: () => now })
assert.equal(afterRestart.current(pauseUser)?.currentState.id, checkpoint)
assert.equal(afterRestart.current(pauseUser)?.worldState.first_shared_object, undefined)
const resumed = afterRestart.resume(pauseUser, bro.instanceId, key('bro-resume'))
assert.equal(resumed.status, 'active')
assert.equal(resumed.currentState.id, checkpoint)

const recallMemoryStore = new SqliteMemoryStore()
const recallUser = 'recall-user'
seedCompletedMainlineUser(recallUser)
const unrelatedRecallUser = 'unrelated-recall-user'
seedCompletedMainlineUser(unrelatedRecallUser)
const unrelatedProposal = recallMemoryStore.proposeFromFixedEvent(unrelatedRecallUser, '00000000-0000-4000-8000-000000000098', [{
  kind: 'relationship', content: '你和 Morrow 一起记住了学校午餐。', confidence: 'high', semanticTags: ['unrelated_school_lunch'],
}])[0]
recallMemoryStore.act(unrelatedRecallUser, unrelatedProposal.id, { action: 'confirm', expectedVersion: unrelatedProposal.version, content: unrelatedProposal.content, idempotencyKey: 'confirm-unrelated-memory' })
const unrelatedEngine = new SqliteFixedEventEngine({ memoryStore: recallMemoryStore, now: () => now })
assert.equal(unrelatedEngine.recommendation(unrelatedRecallUser).recallPrompt, null)

const proposed = recallMemoryStore.proposeFromFixedEvent(recallUser, '00000000-0000-4000-8000-000000000099', [{
  kind: 'relationship', content: '你和 Morrow 一起记住了房间的第一束光。', confidence: 'high', semanticTags: ['b2_recall_room_v1', 'first_room'],
}])[0]
recallMemoryStore.act(recallUser, proposed.id, { action: 'confirm', expectedVersion: proposed.version, content: proposed.content, idempotencyKey: 'confirm-recall-memory' })
const recallEngine = new SqliteFixedEventEngine({ memoryStore: recallMemoryStore, now: () => now })
const recommendation = recallEngine.recommendation(recallUser)
assert.equal(recommendation.dispatchType, 'mainline')
assert.equal(recommendation.event?.eventId, 'b2_ready_for_school_v1')
assert.equal(recommendation.recallPrompt?.eventId, 'b2_recall_room_v1')
assert.equal(recommendation.recallPrompt?.sourceType, 'shared_memory')
assert.equal(recommendation.activeInstance, null)
assert.equal(recallEngine.current(recallUser), null)
const competingMainline = recallEngine.start(recallUser, { eventId: 'b2_ready_for_school_v1', idempotencyKey: key('competing-mainline') })
assert.equal(competingMainline.status, 'active')
assert.throws(() => recallEngine.start('manual-recall-user', { eventId: 'b2_recall_room_v1', idempotencyKey: key('manual-recall') }), /fixed_event_locked/)

const legacyRecallUser = 'legacy-recall-user'
seedCompletedMainlineUser(legacyRecallUser)
const legacyProposal = recallMemoryStore.proposeFromFixedEvent(legacyRecallUser, '00000000-0000-4000-8000-000000000100', [{
  kind: 'language', content: 'I think it means…', expression: 'I think it means…', naturalExpression: 'I think it means…', confidence: 'high', semanticTags: ['b2_recall_room_v1', 'first_room'],
}])[0]
recallMemoryStore.act(legacyRecallUser, legacyProposal.id, { action: 'confirm', expectedVersion: legacyProposal.version, content: legacyProposal.content, idempotencyKey: 'confirm-legacy-memory' })
const legacyRecommendation = recallEngine.recommendation(legacyRecallUser)
assert.equal(legacyRecommendation.dispatchType, 'mainline')
assert.equal(legacyRecommendation.recallPrompt?.eventId, 'b2_recall_room_v1')
assert.equal(legacyRecommendation.recallPrompt?.sourceType, 'legacy_expression')
assert.equal(legacyRecommendation.activeInstance, null)

const pausedRecallUser = 'paused-recall-user'
seedCompletedMainlineUser(pausedRecallUser)
const pausedProposal = recallMemoryStore.proposeFromFixedEvent(pausedRecallUser, '00000000-0000-4000-8000-000000000101', [{
  kind: 'relationship', content: '暂停的房间回忆。', confidence: 'high', semanticTags: ['b2_recall_room_v1'],
}])[0]
let pausedMemory = recallMemoryStore.act(pausedRecallUser, pausedProposal.id, { action: 'confirm', expectedVersion: pausedProposal.version, content: pausedProposal.content, idempotencyKey: 'confirm-paused-recall' })
pausedMemory = recallMemoryStore.act(pausedRecallUser, pausedMemory.id, { action: 'pause', expectedVersion: pausedMemory.version, idempotencyKey: 'pause-recall-memory' })
assert.equal(pausedMemory.status, 'paused')
assert.equal(recallEngine.recommendation(pausedRecallUser).recallPrompt, null)

const recallOnlyUser = 'recall-only-user'
openDatabase().prepare('INSERT INTO fixed_event_state (user_id, record) VALUES (?, ?)').run(recallOnlyUser, JSON.stringify({
  userId: recallOnlyUser,
  worldState: {}, completedEventIds: completedMainline, startedEventIds: completedMainline,
  dailyCompletionByEventId: {}, dailyTopicCursor: null,
  budget: {
    localDate: '2026-10-12', timeZone: 'Asia/Shanghai', newMainlineUsed: 2, newDailyUsed: 1,
    newLearningObjectsUsed: 10, newCoreExpressionsUsed: 3, recallUsed: 0, extraEventUsed: 1, extraEventGranted: true,
  },
  active: null, responseByIdempotencyKey: {}, commandByIdempotencyKey: {},
}))
const recallOnlyProposal = recallMemoryStore.proposeFromFixedEvent(recallOnlyUser, '00000000-0000-4000-8000-000000000102', [{
  kind: 'relationship', content: '预算后自然想起房间。', confidence: 'high', semanticTags: ['b2_recall_room_v1'],
}])[0]
recallMemoryStore.act(recallOnlyUser, recallOnlyProposal.id, { action: 'confirm', expectedVersion: recallOnlyProposal.version, content: recallOnlyProposal.content, idempotencyKey: 'confirm-recall-only' })
let recallOnlyRecommendation = recallEngine.recommendation(recallOnlyUser)
assert.equal(recallOnlyRecommendation.dispatchType, 'recall')
assert.equal(recallOnlyRecommendation.activeInstance?.eventId, 'b2_recall_room_v1')
assert.equal(recallOnlyRecommendation.recallPrompt, null)
assert.equal(recallOnlyRecommendation.budget.recallUsed, 1)
const recallOnlyInstance = recallOnlyRecommendation.activeInstance!
const recallDefinition = getFixedContentEvent(recallOnlyInstance.eventId)!
const recallOpening = recallDefinition.states.find((state) => state.id === recallOnlyInstance.currentState.id)!
assert.ok(recallOpening.choices.length > 0)
const recallAdvanced = recallEngine.advance(recallOnlyUser, recallOnlyInstance.instanceId, {
  inputMode: 'choice', choiceId: recallOpening.choices[0].id, idempotencyKey: key('recall-natural-open'),
})
assert.equal(recallAdvanced.advanced, true)

const budgetUser = 'budget-user'
finishBfv(recallEngine, budgetUser)
let budgetView = recallEngine.recommendation(budgetUser)
assert.equal(budgetView.budget.newMainlineUsed, 1)
const firstDaily = recallEngine.catalog(budgetUser).find((item) => item.eventType === 'daily' && item.status === 'available')!
finishDaily(recallEngine, budgetUser, firstDaily.eventId)
const afterDailyCatalog = recallEngine.catalog(budgetUser)
assert.ok(afterDailyCatalog.filter((item) => item.eventType === 'daily' && item.status === 'available').every((item) => getFixedContentEvent(item.eventId)!.newContentBudget.introducesNewContent === false))

const beforeDefaultLimitUser = 'before-default-limit-user'
assert.throws(
  () => recallEngine.requestExtraEvent(beforeDefaultLimitUser, 'extra-too-early'),
  /fixed_extra_event_unavailable/,
)

const completedBeforeSchool = ['birth_first_voice_v1', 'b1_first_room_object_v1', 'b2_room_tour_v1', 'b2_name_objects_v1', 'b2_outside_road_v1', 'b2_my_likes_v1', 'b2_small_task_v1']
const extraUnlockUser = 'extra-unlock-user'
openDatabase().prepare('INSERT INTO fixed_event_state (user_id, record) VALUES (?, ?)').run(extraUnlockUser, JSON.stringify({
  userId: extraUnlockUser, worldState: {}, completedEventIds: completedBeforeSchool, startedEventIds: completedBeforeSchool,
  dailyCompletionByEventId: {
    b2_mistake_v1: now.toISOString(), b2_feeling_check_v1: now.toISOString(),
    dt_rest_together_v1: now.toISOString(), dt_good_night_v1: now.toISOString(),
  }, dailyTopicCursor: 'dt_good_night_v1',
  budget: {
    localDate: '2026-10-12', timeZone: 'Asia/Shanghai', newMainlineUsed: 2, newDailyUsed: 1,
    newLearningObjectsUsed: 6, newCoreExpressionsUsed: 2, recallUsed: 1, extraEventUsed: 0, extraEventGranted: false,
  },
  active: null, responseByIdempotencyKey: {}, commandByIdempotencyKey: {},
}))
assert.equal(recallEngine.recommendation(extraUnlockUser).kind, 'companion')
const extraGrantFirst = recallEngine.requestExtraEvent(extraUnlockUser, 'extra-unlock-once')
const extraGrantReplay = recallEngine.requestExtraEvent(extraUnlockUser, 'extra-unlock-once')
assert.deepEqual(extraGrantReplay, extraGrantFirst)
assert.throws(
  () => recallEngine.requestExtraEvent(extraUnlockUser, 'extra-unlock-second-key'),
  /fixed_extra_event_unavailable/,
)
const unlockedExtra = recallEngine.recommendation(extraUnlockUser)
assert.equal(unlockedExtra.dispatchType, 'mainline')
assert.equal(unlockedExtra.event?.eventId, 'b2_sound_comes_back_v1')
const extraStarted = recallEngine.start(extraUnlockUser, { eventId: 'b2_sound_comes_back_v1', idempotencyKey: 'extra-mainline-start' })
assert.equal(extraStarted.status, 'active')
assert.equal(recallEngine.recommendation(extraUnlockUser).budget.extraEventUsed, 1)

const budgetCapUser = 'budget-cap-user'
openDatabase().prepare('INSERT INTO fixed_event_state (user_id, record) VALUES (?, ?)').run(budgetCapUser, JSON.stringify({
  userId: budgetCapUser, worldState: {}, completedEventIds: completedBeforeSchool, startedEventIds: completedBeforeSchool,
  dailyCompletionByEventId: {
    b2_mistake_v1: now.toISOString(),
    b2_feeling_check_v1: now.toISOString(),
    dt_rest_together_v1: now.toISOString(),
    dt_good_night_v1: now.toISOString(),
  }, dailyTopicCursor: 'dt_good_night_v1',
  budget: {
    localDate: '2026-10-12', timeZone: 'Asia/Shanghai', newMainlineUsed: 2, newDailyUsed: 1,
    newLearningObjectsUsed: 9, newCoreExpressionsUsed: 3, recallUsed: 1, extraEventUsed: 0, extraEventGranted: false,
  },
  active: null, responseByIdempotencyKey: {}, commandByIdempotencyKey: {},
}))
let companion = recallEngine.recommendation(budgetCapUser)
assert.equal(companion.kind, 'companion')
assert.equal(companion.dispatchType, 'companion')
assert.equal(companion.triggerMode, 'ordinary_companion')
assert.equal(companion.triggerStrength, 'none')
assert.equal(companion.reason, 'budget_reached')
assert.equal(companion.canRequestExtraEvent, true)
recallEngine.requestExtraEvent(budgetCapUser, 'extra-once')
assert.throws(() => recallEngine.requestExtraEvent(budgetCapUser, 'extra-twice'), /fixed_extra_event_unavailable/)
// 额外事件不突破学习对象/核心表达硬上限；因此仍保持普通陪伴。
companion = recallEngine.recommendation(budgetCapUser)
assert.equal(companion.kind, 'companion')

const budgetResumeUser = 'budget-resume-user'
openDatabase().prepare('INSERT INTO fixed_event_state (user_id, record) VALUES (?, ?)').run(budgetResumeUser, JSON.stringify({
  userId: budgetResumeUser, worldState: {}, completedEventIds: [], startedEventIds: ['birth_first_voice_v1'],
  dailyCompletionByEventId: {}, dailyTopicCursor: null,
  budget: {
    localDate: '2026-10-12', timeZone: 'Asia/Shanghai', newMainlineUsed: 2, newDailyUsed: 1,
    newLearningObjectsUsed: 10, newCoreExpressionsUsed: 3, recallUsed: 1, extraEventUsed: 1, extraEventGranted: true,
  },
  active: {
    eventId: 'birth_first_voice_v1', instanceId: '00000000-0000-4000-8000-000000000201', currentStateId: 'c1e1_route',
    status: 'paused', selectedOutcomeId: null, resultLineIds: [], confirmedExpressions: [], resolvedIntentIds: [],
    memoryProposed: false, completedAt: null, recallSourceMemoryId: null, recallSourceType: null,
  },
  responseByIdempotencyKey: {}, commandByIdempotencyKey: {},
}))
const budgetResumeRecommendation = recallEngine.recommendation(budgetResumeUser)
assert.equal(budgetResumeRecommendation.reason, 'resume')
assert.equal(budgetResumeRecommendation.activeInstance?.status, 'paused')
const budgetResumed = recallEngine.resume(
  budgetResumeUser,
  '00000000-0000-4000-8000-000000000201',
  'budget-resume-after-cap',
)
assert.equal(budgetResumed.status, 'active')
assert.equal(budgetResumed.currentState.id, 'c1e1_route')

openDatabase().close()
for (const suffix of ['', '-wal', '-shm']) {
  const file = dbPath + suffix
  if (existsSync(file)) rmSync(file, { force: true })
}

console.log(JSON.stringify({
  ok: true,
  checks: [
    'schema-metadata-three-trigger-strengths', 'e2-06-explicit-dependency-excludes-e2-03', 'e2-12-mainline-dependencies-exclude-e2-11',
    'recall-hidden-manual-start-source-filter-semantic-match-deterministic-choice', 'daily-cooldown-adjacent-dedupe-expiry-restart',
    'mainline-wins-recall-competition-recall-prompt-non-preemptive-mainline-starts',
    'recall-shared-memory-legacy-expression-paused-filter-single-prompt',
    'recall-without-mainline-starts-natural-event-flow',
    'e01-02-pause-resume-checkpoint-no-world-write', 'background-recall-shared-memory-and-legacy-expression',
    'timezone-daily-budget-extra-after-default-only-idempotent-once-hard-caps-companion-resume-after-cap',
  ],
}, null, 2))
