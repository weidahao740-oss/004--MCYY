import assert from 'node:assert/strict'
import { existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { CHAPTER_ONE_MAINLINE_IDS, RETIRED_BIRTH_EVENT_IDS, chapterOneHardGateSatisfied, chapterOneRuntimeSpecs, fixedContentV1 } from '@english-pet/domain'
import { openDatabase } from './sqlite-db.js'
import { SqliteFixedEventEngine } from './sqlite-fixed-event-engine.js'
import { SqliteJournalStore } from './sqlite-journal-store.js'
import { SqliteMemoryStore } from './sqlite-memory-store.js'

const dbPath = join(tmpdir(), `chapter-one-runtime-smoke-${Date.now()}.db`)
process.env.SQLITE_PATH = dbPath
let sequence = 0
const key = (label: string) => `${label}-${++sequence}`
const memoryStore = new SqliteMemoryStore()
const journalStore = new SqliteJournalStore(memoryStore)
const engine = new SqliteFixedEventEngine({ memoryStore, journalStore })
const chapterEvents = fixedContentV1.events.filter((event) => event.chapterId === 'chapter_01_birth')
function say(targetEngine: SqliteFixedEventEngine, userId: string, instanceId: string, stateId: string, text: string, label: string) {
  const proof = targetEngine.issueAsrProof(userId, instanceId, stateId, text)
  return targetEngine.advance(userId, instanceId, { inputMode: 'confirmed_asr_text', text, asrProof: proof.proof, idempotencyKey: key(label) })
}
function choice(targetEngine: SqliteFixedEventEngine, userId: string, instanceId: string, choiceId: string, label: string) {
  return targetEngine.advance(userId, instanceId, { inputMode: 'choice', choiceId, idempotencyKey: key(label) })
}
function insertReadyUser(userId: string, worldState: Record<string, unknown>, completedEventIds: string[]) {
  openDatabase().prepare('INSERT INTO fixed_event_state (user_id, record) VALUES (?, ?)').run(userId, JSON.stringify({ userId, worldState, completedEventIds, startedEventIds: [...completedEventIds], dailyCompletionByEventId: {}, dailyTopicCursor: null, budget: null, active: null, responseByIdempotencyKey: {}, commandByIdempotencyKey: {}, asrProofs: {} }))
}

// 1) 13 个现行事件与运行规格逐项一致，退役 ID 不注册。
assert.equal(chapterEvents.length, 13)
assert.deepEqual(chapterEvents.map((event) => event.id), chapterOneRuntimeSpecs.map((spec) => spec.id))
for (const spec of chapterOneRuntimeSpecs) {
  const event = chapterEvents.find((candidate) => candidate.id === spec.id)!
  assert.equal(event.sequence, spec.sequence)
  assert.equal(event.eventType, spec.eventType)
  assert.deepEqual(event.prerequisiteEventIds, spec.prerequisiteEventIds)
}
for (const retiredId of RETIRED_BIRTH_EVENT_IDS) assert.equal(fixedContentV1.events.some((event) => event.id === retiredId), false)
for (const event of chapterEvents) for (const state of event.states.filter((candidate) => candidate.phase === 'input')) {
  assert.deepEqual(state.acceptedInputModes, ['confirmed_asr_text'])
  assert.equal(state.choices.length, 0)
}

// 2) E01-01 三路线：ASR -> 专属反馈 -> 共同收束 -> 最终才写 first_response_style。
const e1Routes = [
  { suffix: 'presence', text: "Yes, I'm here.", wrong: 'Who are you?', feedback: "Oh, good. I'm Morrow. I wasn't sure anyone was there.", style: 'reassuring_presence' },
  { suffix: 'greeting', text: 'Hi. I can hear you.', wrong: "Yes, I'm here.", feedback: "Hi. I'm Morrow. I'm glad you answered.", style: 'friendly_greeting' },
  { suffix: 'identity', text: 'Who are you?', wrong: 'Hi. I can hear you.', feedback: "I'm Morrow. I just woke up. That's about all I know for now.", style: 'identity_check' },
]
for (const route of e1Routes) {
  const user = `e1-${route.suffix}`
  let view = engine.start(user, { eventId: 'birth_first_voice_v1', idempotencyKey: key('e1-start') })
  const instanceId = view.instanceId
  view = choice(engine, user, instanceId, 'c1e1_choice_open', 'e1-open')
  assert.equal(view.currentState.id, 'c1e1_route')
  view = choice(engine, user, instanceId, `c1e1_choice_${route.suffix}`, 'e1-route')
  assert.equal(view.currentState.id, `c1e1_input_${route.suffix}`)
  const wrongProof = engine.issueAsrProof(user, instanceId, view.currentState.id, route.wrong)
  const wrong = engine.advance(user, instanceId, { inputMode: 'confirmed_asr_text', text: route.wrong, asrProof: wrongProof.proof, idempotencyKey: key('e1-wrong') })
  assert.equal(wrong.advanced, false)
  assert.equal(wrong.currentState.id, `c1e1_input_${route.suffix}`)
  const consumedRetry = engine.advance(user, instanceId, { inputMode: 'confirmed_asr_text', text: route.wrong, asrProof: wrongProof.proof, idempotencyKey: key('e1-consumed-retry') })
  assert.equal(consumedRetry.advanced, false)
  assert.match(consumedRetry.messageZh ?? '', /重新录音识别/)
  view = say(engine, user, instanceId, `c1e1_input_${route.suffix}`, route.text, 'e1-correct')
  assert.equal(view.currentState.id, `c1e1_feedback_${route.suffix}`)
  assert.equal(view.currentState.lines[0]!.learningContent.english, route.feedback)
  assert.equal(view.worldState.first_response_style, undefined)
  view = choice(engine, user, instanceId, `c1e1_choice_feedback_${route.suffix}`, 'e1-feedback')
  assert.equal(view.currentState.id, 'c1e1_result')
  assert.equal(view.currentState.lines[0]!.learningContent.english, 'Everything here feels new. Will you look around with me?')
  assert.equal(view.worldState.first_response_style, undefined)
  view = choice(engine, user, instanceId, 'c1e1_choice_finish', 'e1-finish')
  assert.equal(view.worldState.first_response_style, route.style)
}

// 3) E01-02 权威多阶段延迟结算。
const e2User = 'e2-main'
insertReadyUser(e2User, { first_response_style: 'reassuring_presence' }, ['birth_first_voice_v1'])
let view = engine.start(e2User, { eventId: 'b1_first_room_object_v1', idempotencyKey: key('e2-start') })
const e2 = view.instanceId
view = choice(engine, e2User, e2, 'c1e2_choice_open', 'e2-open')
view = choice(engine, e2User, e2, 'c1e2_choice_lamp', 'e2-route')
const wrongE2Proof = engine.issueAsrProof(e2User, e2, 'c1e2_input_lamp', 'I noticed the plant first.')
const wrongE2Route = engine.advance(e2User, e2, { inputMode: 'confirmed_asr_text', text: 'I noticed the plant first.', asrProof: wrongE2Proof.proof, idempotencyKey: key('e2-wrong-route') })
assert.equal(wrongE2Route.advanced, false)
assert.equal(wrongE2Route.currentState.id, 'c1e2_input_lamp')
assert.equal(wrongE2Route.worldState.first_shared_object, undefined)
view = say(engine, e2User, e2, 'c1e2_input_lamp', 'I noticed the lamp first.', 'e2-first')
assert.equal(view.currentState.id, 'c1e2_morrow_lamp')
assert.equal(view.worldState.first_shared_object, undefined)
view = engine.pause(e2User, e2, key('e2-pause'))
assert.equal(view.status, 'paused')
assert.equal(view.worldState.first_shared_object, undefined)
view = engine.resume(e2User, e2, key('e2-resume'))
assert.equal(view.currentState.id, 'c1e2_morrow_lamp')
assert.equal(view.worldState.first_shared_object, undefined)
view = choice(engine, e2User, e2, 'c1e2_choice_morrow_lamp', 'e2-morrow')
view = say(engine, e2User, e2, 'c1e2_second_lamp', 'What about you?', 'e2-second')
assert.equal(view.currentState.id, 'c1e2_attitude')
assert.equal(view.worldState.first_shared_object, undefined)
view = choice(engine, e2User, e2, 'c1e2_choice_interesting', 'e2-attitude')
assert.equal(view.currentState.id, 'c1e2_feedback_interesting')
view = choice(engine, e2User, e2, 'c1e2_choice_feedback_interesting', 'e2-feedback')
assert.equal(view.currentState.id, 'c1e2_result')
view = choice(engine, e2User, e2, 'c1e2_choice_finish', 'e2-finish')
assert.equal(view.worldState.first_shared_object, 'lamp')

// 4) E01-03：中文剧情态度 -> 同一 ASR 意图（缩写/展开等价）-> Morrow? -> 中文关系态度 -> 收束。
for (const [index, firstText] of ["I'll call you Morrow.", 'I will call you Morrow.'].entries()) {
  const user = `e3-equivalent-${index}`
  insertReadyUser(user, { first_response_style: 'reassuring_presence', first_shared_object: 'lamp' }, ['birth_first_voice_v1', 'b1_first_room_object_v1'])
  let e3View = engine.start(user, { eventId: 'b1_remember_name_v1', idempotencyKey: key('e3-start') })
  const instanceId = e3View.instanceId
  e3View = choice(engine, user, instanceId, 'c1e3_choice_open', 'e3-open')
  assert.equal(e3View.currentState.id, 'c1e3_story_choice')
  assert.deepEqual(e3View.currentState.choices.map((entry) => entry.id), ['c1e3_choice_story_suits', 'c1e3_choice_story_liked', 'c1e3_choice_story_decision'])
  assert.equal(e3View.currentState.choices.some((entry) => /name_full|I will/i.test(entry.id + entry.labelZh)), false)
  e3View = choice(engine, user, instanceId, 'c1e3_choice_story_suits', 'e3-story')
  assert.equal(e3View.currentState.id, 'c1e3_story_feedback_suits')
  e3View = choice(engine, user, instanceId, 'c1e3_choice_story_feedback_suits', 'e3-story-feedback')
  assert.equal(e3View.currentState.id, 'c1e3_first_input')
  e3View = say(engine, user, instanceId, 'c1e3_first_input', firstText, 'e3-first')
  assert.equal(e3View.currentState.id, 'c1e3_first_feedback')
  assert.equal(e3View.worldState.morrow_self_address, undefined)
  e3View = choice(engine, user, instanceId, 'c1e3_choice_first_feedback', 'e3-first-feedback')
  e3View = say(engine, user, instanceId, 'c1e3_second_input', 'Morrow?', 'e3-second')
  e3View = choice(engine, user, instanceId, 'c1e3_choice_second_feedback', 'e3-second-feedback')
  assert.equal(e3View.currentState.id, 'c1e3_attitude')
  assert.equal(e3View.currentState.choices.every((entry) => entry.referenceReplyLineId === null), true)
  assert.equal(e3View.worldState.morrow_self_address, undefined)
  e3View = choice(engine, user, instanceId, 'c1e3_choice_attitude_natural', 'e3-attitude')
  assert.equal(e3View.currentState.id, 'c1e3_attitude_feedback_natural')
  e3View = choice(engine, user, instanceId, 'c1e3_choice_attitude_feedback_natural', 'e3-attitude-feedback')
  assert.equal(e3View.currentState.id, 'c1e3_result')
  e3View = choice(engine, user, instanceId, 'c1e3_choice_finish', 'e3-finish')
  assert.equal(e3View.worldState.morrow_self_address, 'morrow')
}

// 5) E01-04～13 每个所选路线都显式经过专属反馈，再显示共同收束；状态 lines 是唯一渲染来源。
const genericCases = [
  { eventId: 'b1_first_feeling_v1', route: 'calm', feedback: 'Then we can stay quiet for a moment. I like that.', close: 'We may not feel the same, but now we know each other a little better.', second: null },
  { eventId: 'b1_window_light_v1', route: 'warm', feedback: 'I can see why it feels warm to you. It makes the room feel a little gentler.', close: 'We still can’t see much beyond the window, but we looked that way together. That’s enough for a first look.', second: "Let's look together." },
  { eventId: 'b1_first_letter_v1', route: 'hello', feedback: 'Hello. One clear word is enough for a first look.', close: 'We don’t have to read it all at once. We can come back to it.', second: null },
  { eventId: 'b1_bell_sound_v1', route: 'bell', feedback: "Maybe. The small bell is here, but we don't know if it made the sound.", close: 'We don’t have to know what it was yet. We can listen again another time.', second: null },
  { eventId: 'b1_ask_about_you_v1', route: 'busy', feedback: "A busy day, then. I'm glad you stopped by.", close: 'I just wanted to hear how your day has been.', second: null },
  { eventId: 'b1_what_i_like_v1', route: 'quiet', feedback: 'Then we share one thing already. Quiet moments feel good to me.', close: 'We can keep learning what we like.', second: "That's okay." },
  { eventId: 'b1_next_small_plan_v1', route: 'look', feedback: 'All right. We can notice something we missed before.', close: 'A small plan is enough.', second: "Let's do that." },
  { eventId: 'b1_ready_for_outside_v1', route: 'with_you', feedback: "Then I know I won't face it alone.", close: "One step at a time. That's enough for now.", second: 'One step at a time.' },
  { eventId: 'b1_first_thank_you_v1', route: 'welcome', feedback: 'I still wanted you to hear it.', close: "I'm glad we shared this part of the beginning.", second: null },
]
for (const testCase of genericCases) {
  const event = chapterEvents.find((entry) => entry.id === testCase.eventId)!
  const p = `c1e${event.sequence}`
  const inputState = `${p}_input_${testCase.route}`
  const feedbackState = event.states.find((state) => state.id === `${p}_feedback_${testCase.route}`)!
  assert.equal(feedbackState.lineIds.length, 1)
  assert.equal(event.lines.find((entry) => entry.id === feedbackState.lineIds[0])!.learningContent.english, testCase.feedback)
  const afterFeedback = event.transitions.find((transition) => transition.fromStateId === feedbackState.id)!
  if (testCase.second) {
    assert.equal(afterFeedback.toStateId, `${p}_second_${testCase.route}`)
    const secondState = event.states.find((state) => state.id === afterFeedback.toStateId)!
    assert.equal(event.lines.find((entry) => entry.id === secondState.lineIds[secondState.lineIds.length - 1])!.learningContent.english, testCase.second)
    const secondTransition = event.transitions.find((transition) => transition.fromStateId === secondState.id)!
    assert.equal(secondTransition.toStateId, `${p}_result`)
  } else assert.equal(afterFeedback.toStateId, `${p}_result`)
  const resultState = event.states.find((state) => state.id === `${p}_result`)!
  assert.equal(event.lines.find((entry) => entry.id === resultState.lineIds[resultState.lineIds.length - 1])!.learningContent.english, testCase.close)
  assert.ok(event.intents.some((intent) => intent.eligibleStateIds.includes(inputState)))
}
const recall = chapterEvents.find((event) => event.id === 'b1_return_first_words_v1')!
for (const suffix of ['presence', 'greeting', 'identity']) {
  const result = recall.states.find((state) => state.id === `c1e11_result_${suffix}`)!
  assert.deepEqual(result.lineIds, [`c1e11_response_${suffix}`, 'c1e11_close'])
}

// 6) E01-08/09/13 记忆边界与 E01-11 课程证据回访。
assert.equal(chapterEvents.find((event) => event.id === 'b1_ask_about_you_v1')!.memoryRules.length, 0)
assert.equal(chapterEvents.find((event) => event.id === 'b1_what_i_like_v1')!.memoryRules.length, 0)
assert.equal(chapterEvents.find((event) => event.id === 'b1_first_thank_you_v1')!.memoryRules.length, 0)
const recallUser = 'recall-no-memory'
insertReadyUser(recallUser, { first_response_style: 'identity_check', first_shared_object: 'lamp', morrow_self_address: 'morrow', b1_window_light_status: 'completed' }, ['birth_first_voice_v1', 'b1_first_room_object_v1', 'b1_remember_name_v1', 'b1_window_light_v1'])
const recallRecommendation = engine.recommendation(recallUser)
assert.equal(recallRecommendation.recallPrompt?.sourceType, 'course_evidence')

// 7) 章末硬门和历史迁移保持。
const hardState = { first_response_style: 'reassuring_presence', first_shared_object: 'lamp', morrow_self_address: 'morrow', b1_window_light_status: 'completed', b1_what_i_like_status: 'completed', b1_next_small_plan_status: 'completed', b1_ready_for_outside_status: 'completed' }
assert.equal(chapterOneHardGateSatisfied(CHAPTER_ONE_MAINLINE_IDS, hardState), true)
assert.equal(chapterOneHardGateSatisfied(CHAPTER_ONE_MAINLINE_IDS.filter((id) => id !== 'b1_window_light_v1'), hardState), false)
const chapterGateUser = 'chapter-hard-gate-runtime'
const preExitState: Record<string, string | number | boolean> = { ...hardState }
delete preExitState.b1_ready_for_outside_status
insertReadyUser(chapterGateUser, preExitState, CHAPTER_ONE_MAINLINE_IDS.filter((id) => id !== 'b1_ready_for_outside_v1'))
let e12View = engine.start(chapterGateUser, { eventId: 'b1_ready_for_outside_v1', idempotencyKey: key('e12-start') })
const e12 = e12View.instanceId
e12View = choice(engine, chapterGateUser, e12, 'c1e12_choice_open', 'e12-open')
e12View = choice(engine, chapterGateUser, e12, 'c1e12_choice_with_you', 'e12-route')
e12View = say(engine, chapterGateUser, e12, 'c1e12_input_with_you', "I'm with you.", 'e12-first')
e12View = choice(engine, chapterGateUser, e12, 'c1e12_choice_feedback_with_you', 'e12-feedback')
e12View = say(engine, chapterGateUser, e12, 'c1e12_second_with_you', 'One step at a time.', 'e12-second')
assert.equal(e12View.worldState.b1_ready_for_outside_status, undefined)
assert.equal(e12View.worldState.chapter_01_birth, undefined)
e12View = choice(engine, chapterGateUser, e12, 'c1e12_choice_finish', 'e12-finish')
assert.equal(e12View.worldState.b1_ready_for_outside_status, 'completed')
assert.equal(e12View.worldState.chapter_01_birth, 'completed')
const e12Memory = memoryStore.list(chapterGateUser, true).proposed.find((memory) => memory.sourceEventInstanceId === e12)
assert.ok(e12Memory)
memoryStore.act(chapterGateUser, e12Memory.id, { action: 'reject', expectedVersion: e12Memory.version, idempotencyKey: key('e12-reject-memory') })
const e12StoredRecord = openDatabase().prepare('SELECT record FROM fixed_event_state WHERE user_id = ?').get(chapterGateUser) as { record: string }
assert.equal(JSON.parse(e12StoredRecord.record).worldState.chapter_01_birth, 'completed')
const legacyUser = 'legacy-migration'
insertReadyUser(legacyUser, { first_response_style: 'help', first_restored_object: 'plant', morrow_self_address: 'morrow', b1_window_light_status: 'completed', b1_what_i_like_status: 'completed', b1_next_small_plan_status: 'completed', b1_ready_for_outside_status: 'completed' }, ['birth_first_voice_v1', 'birth_restore_object_v1', 'b1_remember_name_v1', 'b1_window_light_v1', 'b1_what_i_like_v1', 'b1_next_small_plan_v1', 'b1_ready_for_outside_v1'])
engine.catalog(legacyUser)
const legacyRow = openDatabase().prepare('SELECT record FROM fixed_event_state WHERE user_id = ?').get(legacyUser) as { record: string }
const legacyRecord = JSON.parse(legacyRow.record)
assert.equal(legacyRecord.worldState.first_response_style, 'reassuring_presence')
assert.equal(legacyRecord.worldState.first_shared_object, 'plant')

openDatabase().close()
for (const suffix of ['', '-wal', '-shm']) { const path = dbPath + suffix; if (existsSync(path)) rmSync(path, { force: true }) }
console.log(JSON.stringify({ ok: true, checks: [
  '13-current-events-config-runtime-match', 'e01-01-three-route-feedback-close-delayed-state', 'wrong-asr-proof-consumed-requires-rerecord',
  'e01-02-authoritative-multistage-delayed-settlement', 'e01-03-chinese-attitudes-single-equivalent-asr-route-second-exchange',
  'e01-04-through-e01-13-feedback-before-close-lines', 'e01-11-course-evidence-without-memory', 'hard-gate-and-legacy-migration',
] }, null, 2))
