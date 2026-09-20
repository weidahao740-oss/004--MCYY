import assert from 'node:assert/strict'
import type { EventActionRequest, EventInstanceView } from '@english-pet/contracts'
import { MemoryEventEngine } from './memory-event-engine.js'

const engine = new MemoryEventEngine()
const userId = 'event-smoke-user'
let sequence = 0

function id(label: string) {
  sequence += 1
  return `${label}-${sequence.toString().padStart(4, '0')}`
}

function act(instance: EventInstanceView, action: EventActionRequest['action'], options: { text?: string; choiceId?: string; key?: string } = {}) {
  return engine.act(userId, instance.instanceId, {
    action,
    inputMode: options.choiceId ? 'choice' : options.text ? 'text' : 'continue',
    text: options.text,
    choiceId: options.choiceId,
    idempotencyKey: options.key ?? id(action),
  })
}

function assertCatalog(expectedAvailable: string) {
  const catalog = engine.catalog(userId, 'NEW')
  const available = catalog.filter((item) => item.status === 'available').map((item) => item.eventKey)
  assert.deepEqual(available, [expectedAvailable])
}

engine.markFirstDayCompleted(userId, 'lamp')
assertCatalog('morrow_letter_v1')

const startKey = id('start-letter')
let current = engine.start(userId, { eventKey: 'morrow_letter_v1', idempotencyKey: startKey }, 'NEW')
const replayedStart = engine.start(userId, { eventKey: 'morrow_letter_v1', idempotencyKey: startKey }, 'NEW')
assert.equal(replayedStart.instanceId, current.instanceId)

const pausedState = current.currentState.id
current = act(current, 'pause').instance
assert.equal(current.status, 'paused')
current = act(current, 'continue').instance
assert.equal(current.status, 'active')
assert.equal(current.currentState.id, pausedState)

current = act(current, 'continue').instance
const ambiguity = act(current, 'submit', { text: 'I think we should leave.' })
assert.equal(ambiguity.misunderstanding, true)
assert.equal(ambiguity.instance.clarificationCount, 1)
current = act(ambiguity.instance, 'clarify', { text: 'I mean put a sign there.' }).instance
current = act(current, 'confirm').instance
current = act(current, 'confirm', { choiceId: 'observe_first' }).instance
const letterCompleteKey = id('letter-complete')
const letterComplete = act(current, 'complete', { key: letterCompleteKey })
const letterReplay = act(current, 'complete', { key: letterCompleteKey })
assert.equal(letterComplete.instance.status, 'completed')
assert.equal(letterComplete.outcome?.id, 'observe_first')
assert.deepEqual(letterReplay, letterComplete)
assert.equal(letterComplete.instance.worldState.letter_response, 'observe_first')
assertCatalog('room_object_v1')

current = engine.start(userId, { eventKey: 'room_object_v1', idempotencyKey: id('start-room') }, 'NEW')
current = act(current, 'continue').instance
current = act(current, 'submit', { text: "I'd rather have a shelf because it can hold the letter." }).instance
current = act(current, 'confirm').instance
current = act(current, 'confirm', { choiceId: 'window' }).instance
const roomCompleteKey = id('room-complete')
const roomComplete = act(current, 'complete', { key: roomCompleteKey })
const roomReplay = act(current, 'complete', { key: roomCompleteKey })
assert.equal(roomComplete.outcome?.id, 'shelf_added')
assert.equal(roomComplete.instance.worldState.room_added_object, 'narrow_shelf')
assert.equal(roomComplete.instance.worldState.room_added_object_location, 'window')
assert.deepEqual(roomReplay, roomComplete)
assertCatalog('literal_misunderstanding_v1')

current = engine.start(userId, { eventKey: 'literal_misunderstanding_v1', idempotencyKey: id('start-misunderstanding') }, 'NEW')
const openingAmbiguity = act(current, 'submit', { text: 'I need some self after work.' })
assert.equal(openingAmbiguity.instance.currentState.id, 'mm02_input')
assert.equal(openingAmbiguity.misunderstanding, false)
const misunderstood = act(openingAmbiguity.instance, 'submit', { text: 'I need some self after work.' })
assert.equal(misunderstood.misunderstanding, true)
current = act(misunderstood.instance, 'clarify', { text: 'What I meant was quiet time.' }).instance
const misunderstandingComplete = act(current, 'complete')
assert.equal(misunderstandingComplete.outcome?.id, 'meaning_repaired')
assert.equal(misunderstandingComplete.instance.worldState.last_communication_result, 'repaired')
assertCatalog('first_outing_v1')

current = engine.start(userId, { eventKey: 'first_outing_v1', idempotencyKey: id('start-outing') }, 'NEW')
current = act(current, 'continue').instance
current = act(current, 'submit', { text: 'The road sounds quiet now.' }).instance
current = act(current, 'confirm', { choiceId: 'went_to_mailbox' }).instance
current = act(current, 'confirm').instance
const outingComplete = act(current, 'complete')
assert.equal(outingComplete.outcome?.id, 'went_to_mailbox')
assert.equal(outingComplete.instance.worldState.first_outing_status, 'completed_now')
assertCatalog('today_story_v1')

current = engine.start(userId, { eventKey: 'today_story_v1', idempotencyKey: id('start-today') }, 'NEW')
current = act(current, 'submit', { text: 'I want the quick one-minute story.' }).instance
current = act(current, 'submit', { text: 'The best part was having lunch with a friend.' }).instance
current = act(current, 'confirm').instance
const todayComplete = act(current, 'complete')
assert.equal(todayComplete.outcome?.id, 'quick_story_shared')
assert.equal(todayComplete.instance.worldState.last_today_story_result, 'quick_story_shared')
assert.equal(engine.current(userId), null)

const statuses = engine.catalog(userId, 'NEW').map(({ eventKey, status }) => ({ eventKey, status }))
assert.deepEqual(statuses, [
  { eventKey: 'morrow_letter_v1', status: 'completed' },
  { eventKey: 'room_object_v1', status: 'completed' },
  { eventKey: 'literal_misunderstanding_v1', status: 'completed' },
  { eventKey: 'first_outing_v1', status: 'completed' },
  { eventKey: 'today_story_v1', status: 'locked' },
])

// 另一用户：验证落位选择 door 时动态写入 door（而非硬编码 window）
const doorEngine = new MemoryEventEngine()
const doorUser = 'event-smoke-user-door'
function doorAct(inst: EventInstanceView, action: EventActionRequest['action'], options: { text?: string; choiceId?: string } = {}) {
  return doorEngine.act(doorUser, inst.instanceId, {
    action,
    inputMode: options.choiceId ? 'choice' : options.text ? 'text' : 'continue',
    text: options.text,
    choiceId: options.choiceId,
    idempotencyKey: id(`door-${action}`),
  })
}
doorEngine.markFirstDayCompleted(doorUser, 'lamp')
let d = doorEngine.start(doorUser, { eventKey: 'morrow_letter_v1', idempotencyKey: id('d-letter-start') }, 'NEW')
d = doorAct(d, 'continue').instance
d = doorAct(d, 'submit', { text: 'I think it means: keep the light on and leave a sign by the door.' }).instance
d = doorAct(d, 'confirm').instance
d = doorAct(d, 'confirm', { choiceId: 'reply_now' }).instance
doorAct(d, 'complete')
d = doorEngine.start(doorUser, { eventKey: 'room_object_v1', idempotencyKey: id('d-room-start') }, 'NEW')
d = doorAct(d, 'continue').instance
d = doorAct(d, 'submit', { text: 'I would rather have a chair because it is warmer.' }).instance
d = doorAct(d, 'confirm').instance
d = doorAct(d, 'confirm', { choiceId: 'door' }).instance
const doorDone = doorAct(d, 'complete')
assert.equal(doorDone.outcome?.id, 'chair_added')
assert.equal(doorDone.instance.worldState.room_added_object, 'low_chair')
assert.equal(doorDone.instance.worldState.room_added_object_location, 'door')

console.log(JSON.stringify({
  ok: true,
  rulesetId: todayComplete.instance.rulesetId,
  completedEventKeys: todayComplete.instance.completedEventKeys,
  finalWorldState: todayComplete.instance.worldState,
  checks: ['trigger-order', 'pause-resume', 'misunderstanding-recovery', 'branch-outcomes', 'idempotency', 'cooldown'],
}, null, 2))
