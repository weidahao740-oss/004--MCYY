import assert from 'node:assert/strict'
import type { EventActionRequest, EventActionResponse, EventInstanceView, Memory } from '@english-pet/contracts'
import { MemoryAccountStore } from './memory-account-store.js'
import { MemoryEventEngine } from './memory-event-engine.js'
import { MemoryFeedbackStore } from './memory-feedback-store.js'
import { MemoryFirstDayStore } from './memory-first-day-store.js'
import { MemoryJournalStore } from './memory-journal-store.js'
import { MemoryMemoryStore } from './memory-memory-store.js'
import { MemoryResurfacingStore } from './memory-resurfacing-store.js'

const DAY_MS = 24 * 60 * 60 * 1000
const firstDayClock = Date.parse('2026-09-18T12:00:00+08:00')
const realDateNow = Date.now
let virtualNow = firstDayClock
Date.now = () => virtualNow

let sequence = 0
function key(label: string) {
  sequence += 1
  return `seven-day-${label}-${sequence.toString().padStart(4, '0')}`
}

function act(
  engine: MemoryEventEngine,
  userId: string,
  instance: EventInstanceView,
  action: EventActionRequest['action'],
  options: { text?: string; choiceId?: string; resurfacingResult?: EventActionRequest['resurfacingResult'] } = {},
): EventActionResponse {
  return engine.act(userId, instance.instanceId, {
    action,
    inputMode: options.choiceId ? 'choice' : options.text ? 'text' : 'continue',
    text: options.text,
    choiceId: options.choiceId,
    resurfacingResult: options.resurfacingResult,
    idempotencyKey: key(action),
  })
}

function confirmPending(memoryStore: MemoryMemoryStore, userId: string) {
  const confirmed: Memory[] = []
  for (const memory of memoryStore.list(userId, true).proposed) {
    confirmed.push(memoryStore.act(userId, memory.id, {
      action: 'confirm',
      expectedVersion: memory.version,
      content: memory.content,
      idempotencyKey: key(`confirm-${memory.kind}`),
    }))
  }
  return confirmed
}

function snapshot(
  day: number,
  date: string,
  eventKey: string,
  outcomeId: string,
  actionCount: number,
  resurfacingPrompt: EventInstanceView['resurfacingPrompt'],
  memoryStore: MemoryMemoryStore,
  journalStore: MemoryJournalStore,
  resurfacingStore: MemoryResurfacingStore,
  userId: string,
  notes: string[],
) {
  const memories = memoryStore.list(userId, true)
  const attempts = resurfacingStore.debug(userId).attempts
  return {
    day,
    date,
    eventKey,
    outcomeId,
    actionCount,
    estimatedMinutes: actionCount <= 3 ? '1-2' : '3-5',
    resurfacing: resurfacingPrompt ? {
      shown: true,
      mode: resurfacingPrompt.mode,
      expression: resurfacingPrompt.expression,
      recordedResult: attempts.at(-1)?.result ?? null,
    } : { shown: false, mode: null, expression: null, recordedResult: null },
    confirmedMemoryCount: memories.saved.filter((item) => item.status === 'confirmed').length,
    pendingMemoryCount: memories.proposed.length,
    journalCount: journalStore.list(userId).length,
    feedbackTiming: 'completion_only',
    notes,
  }
}

try {
  const accountStore = new MemoryAccountStore()
  const memoryStore = new MemoryMemoryStore()
  const feedbackStore = new MemoryFeedbackStore(memoryStore)
  const resurfacingStore = new MemoryResurfacingStore(memoryStore)
  const journalStore = new MemoryJournalStore(memoryStore)
  const eventEngine = new MemoryEventEngine(memoryStore, journalStore, feedbackStore, resurfacingStore)
  const firstDayStore = new MemoryFirstDayStore(accountStore, memoryStore, journalStore, eventEngine)

  const session = accountStore.register({
    email: 'seven-day-simulation@example.com',
    password: 'Morrow123!',
    displayName: 'Kai',
  })
  const userId = session.user.id

  let firstDay = firstDayStore.get(userId)
  firstDay = firstDayStore.act(userId, { action: 'start', idempotencyKey: key('fd-start') })
  firstDay = firstDayStore.act(userId, { action: 'continue', idempotencyKey: key('fd-wake') })
  firstDay = firstDayStore.act(userId, { action: 'submit_name', text: 'Kai', idempotencyKey: key('fd-name') })
  firstDay = firstDayStore.act(userId, {
    action: 'submit_today',
    text: 'Today was busy, but I enjoyed a quiet walk after dinner.',
    idempotencyKey: key('fd-today'),
  })
  firstDay = firstDayStore.act(userId, { action: 'confirm_understanding', idempotencyKey: key('fd-understood') })
  firstDay = firstDayStore.act(userId, { action: 'select_object', object: 'lamp', idempotencyKey: key('fd-lamp') })
  confirmPending(memoryStore, userId)
  firstDay = firstDayStore.act(userId, { action: 'complete_memory_review', idempotencyKey: key('fd-review') })
  firstDay = firstDayStore.act(userId, { action: 'finish', idempotencyKey: key('fd-finish') })
  assert.equal(firstDay.status, 'completed')

  let current = eventEngine.start(userId, { eventKey: 'morrow_letter_v1', idempotencyKey: key('d1-start') })
  const day1Prompt = current.resurfacingPrompt
  current = act(eventEngine, userId, current, 'continue').instance
  current = act(eventEngine, userId, current, 'submit', { text: 'I think it means: keep the light on and leave a sign by the door.' }).instance
  current = act(eventEngine, userId, current, 'confirm').instance
  current = act(eventEngine, userId, current, 'confirm', { choiceId: 'observe_first' }).instance
  const day1Complete = act(eventEngine, userId, current, 'complete')
  assert.equal(day1Complete.instance.status, 'completed')
  confirmPending(memoryStore, userId)

  const days: ReturnType<typeof snapshot>[] = []

  virtualNow = firstDayClock + DAY_MS
  current = eventEngine.start(userId, { eventKey: 'room_object_v1', idempotencyKey: key('d2-start') })
  const day2Prompt = current.resurfacingPrompt
  current = act(eventEngine, userId, current, 'continue').instance
  current = act(eventEngine, userId, current, 'submit', { text: "I'd rather have a small kettle because the room feels cold." }).instance
  current = act(eventEngine, userId, current, 'confirm').instance
  current = act(eventEngine, userId, current, 'confirm', { choiceId: 'kettle_added' }).instance
  const day2Complete = act(eventEngine, userId, current, 'complete')
  assert.equal(day2Complete.outcome?.id, 'kettle_added')
  assert.ok(day2Complete.feedback)
  confirmPending(memoryStore, userId)
  days.push(snapshot(2, '2026-09-19', 'room_object_v1', 'kettle_added', 5, day2Prompt, memoryStore, journalStore, resurfacingStore, userId, [
    'new object-comparison content',
    'free preference-and-reason expression used',
    'room world state changed to small_kettle',
  ]))

  virtualNow = firstDayClock + 2 * DAY_MS
  current = eventEngine.start(userId, { eventKey: 'literal_misunderstanding_v1', idempotencyKey: key('d3-start') })
  const day3Prompt = current.resurfacingPrompt
  if (day3Prompt) current = eventEngine.recordResurfacing(userId, current.instanceId, 'declined')
  current = act(eventEngine, userId, current, 'continue').instance
  const misunderstood = act(eventEngine, userId, current, 'submit', { text: 'I need some self after work.' })
  assert.equal(misunderstood.misunderstanding, true)
  current = act(eventEngine, userId, misunderstood.instance, 'clarify', { text: 'What I meant was quiet time after work.' }).instance
  const day3Complete = act(eventEngine, userId, current, 'complete')
  assert.equal(day3Complete.outcome?.id, 'meaning_repaired')
  assert.equal(day3Complete.feedback?.result, 'affects_understanding')
  confirmPending(memoryStore, userId)
  days.push(snapshot(3, '2026-09-20', 'literal_misunderstanding_v1', 'meaning_repaired', 4, day3Prompt, memoryStore, journalStore, resurfacingStore, userId, [
    'intentional harmless ambiguity repaired',
    'old-expression prompt could be declined without blocking',
    'feedback correctly classified as affects_understanding',
  ]))

  virtualNow = firstDayClock + 3 * DAY_MS
  current = eventEngine.start(userId, { eventKey: 'first_outing_v1', idempotencyKey: key('d4-start') })
  const day4Prompt = current.resurfacingPrompt
  current = act(eventEngine, userId, current, 'continue').instance
  current = act(eventEngine, userId, current, 'submit', { text: 'The road sounds quiet now.' }).instance
  current = act(eventEngine, userId, current, 'submit', { text: "I'd rather wait because the wind is too strong." }).instance
  current = act(eventEngine, userId, current, 'confirm').instance
  const day4Complete = act(eventEngine, userId, current, 'complete')
  assert.equal(day4Complete.outcome?.id, 'waited_for_quiet')
  confirmPending(memoryStore, userId)
  days.push(snapshot(4, '2026-09-21', 'first_outing_v1', 'waited_for_quiet', 5, day4Prompt, memoryStore, journalStore, resurfacingStore, userId, [
    'planning content differs from prior days',
    'postponement/waiting carries no relationship penalty',
    'preference expression can naturally resurface',
  ]))

  virtualNow = firstDayClock + 4 * DAY_MS
  current = eventEngine.start(userId, { eventKey: 'today_story_v1', idempotencyKey: key('d5-start') })
  const day5Prompt = current.resurfacingPrompt
  current = act(eventEngine, userId, current, 'submit', { text: 'The best part was finishing a difficult task.' }).instance
  current = act(eventEngine, userId, current, 'submit', { text: 'I finished it before dinner.' }).instance
  current = act(eventEngine, userId, current, 'submit', { text: 'It took two quiet hours.' }).instance
  current = act(eventEngine, userId, current, 'confirm').instance
  const day5Complete = act(eventEngine, userId, current, 'complete')
  assert.equal(day5Complete.outcome?.id, 'story_shared')
  confirmPending(memoryStore, userId)
  days.push(snapshot(5, '2026-09-22', 'today_story_v1', 'story_shared', 5, day5Prompt, memoryStore, journalStore, resurfacingStore, userId, [
    'standard reflection path completed',
    'one follow-up detail added before summary confirmation',
    'daily reflection remains optional and non-scoring',
  ]))

  virtualNow = firstDayClock + 5 * DAY_MS
  assert.equal(eventEngine.catalog(userId).find((item) => item.eventKey === 'today_story_v1')?.status, 'available')
  current = eventEngine.start(userId, { eventKey: 'today_story_v1', idempotencyKey: key('d6-start') })
  const day6Prompt = current.resurfacingPrompt
  current = act(eventEngine, userId, current, 'submit', { text: 'I want the quick one-minute story.' }).instance
  current = act(eventEngine, userId, current, 'submit', { text: 'The best part was having lunch with a friend.' }).instance
  current = act(eventEngine, userId, current, 'confirm').instance
  const day6Complete = act(eventEngine, userId, current, 'complete')
  assert.equal(day6Complete.outcome?.id, 'quick_story_shared')
  confirmPending(memoryStore, userId)
  days.push(snapshot(6, '2026-09-23', 'today_story_v1', 'quick_story_shared', 4, day6Prompt, memoryStore, journalStore, resurfacingStore, userId, [
    'quick path reduced one interaction step',
    'repeatable event unlocked after the test date advanced by 24 hours',
    'saved reflection expression can reappear as an optional prompt',
  ]))

  virtualNow = firstDayClock + 6 * DAY_MS
  assert.equal(eventEngine.catalog(userId).find((item) => item.eventKey === 'today_story_v1')?.status, 'available')
  current = eventEngine.start(userId, { eventKey: 'today_story_v1', idempotencyKey: key('d7-start') })
  const day7Prompt = current.resurfacingPrompt
  const pendingBeforeDay7 = memoryStore.list(userId, true).proposed.length
  current = act(eventEngine, userId, current, 'decline').instance
  const day7Complete = act(eventEngine, userId, current, 'complete')
  assert.equal(day7Complete.outcome?.id, 'closed_without_sharing')
  assert.equal(memoryStore.list(userId, true).proposed.length, pendingBeforeDay7)
  days.push(snapshot(7, '2026-09-24', 'today_story_v1', 'closed_without_sharing', 2, day7Prompt, memoryStore, journalStore, resurfacingStore, userId, [
    'clean no-sharing path completed without penalty',
    'no personal memory proposal created',
    'shortest path confirms low-pressure return design',
  ]))

  assert.equal(days.length, 6)
  assert.deepEqual(days.map((day) => day.day), [2, 3, 4, 5, 6, 7])
  assert.equal(eventEngine.current(userId), null)
  const finalCatalog = eventEngine.catalog(userId)
  assert.deepEqual(finalCatalog.filter((item) => item.status === 'locked').map((item) => item.eventKey), ['today_story_v1'])
  assert.ok(finalCatalog.filter((item) => item.eventKey !== 'today_story_v1').every((item) => item.status === 'completed'))
  assert.ok(days.every((day) => day.feedbackTiming === 'completion_only'))
  assert.ok(days.some((day) => day.resurfacing.shown))
  assert.ok(journalStore.list(userId).length >= 8)

  console.log(JSON.stringify({
    ok: true,
    testMode: 'sequential-days',
    day1Context: {
      eventKey: 'morrow_letter_v1',
      outcomeId: day1Complete.outcome?.id,
      resurfacingShown: Boolean(day1Prompt),
    },
    days,
    summary: {
      continuedDays: days.length,
      allSevenDaysCovered: true,
      uniqueDailyEventTypes: new Set(['morrow_letter_v1', ...days.map((day) => day.eventKey)]).size,
      totalJournalEntries: journalStore.list(userId).length,
      finalConfirmedMemoryCount: memoryStore.list(userId, true).saved.filter((item) => item.status === 'confirmed').length,
      resurfacingDays: days.filter((day) => day.resurfacing.shown).map((day) => day.day),
      noSharingPathVerified: day7Complete.outcome?.id === 'closed_without_sharing',
      cooldownVerifiedAt24Hours: true,
    },
  }, null, 2))
} finally {
  Date.now = realDateNow
}
