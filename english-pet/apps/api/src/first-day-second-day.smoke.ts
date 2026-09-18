import assert from 'node:assert/strict'
import { MemoryAccountStore } from './memory-account-store.js'
import { MemoryEventEngine } from './memory-event-engine.js'
import { MemoryFeedbackStore } from './memory-feedback-store.js'
import { MemoryFirstDayStore } from './memory-first-day-store.js'
import { MemoryJournalStore } from './memory-journal-store.js'
import { MemoryMemoryStore } from './memory-memory-store.js'
import { MemoryResurfacingStore } from './memory-resurfacing-store.js'

let sequence = 0
function key(label: string) {
  sequence += 1
  return `${label}-${sequence.toString().padStart(4, '0')}`
}

const accountStore = new MemoryAccountStore()
const memoryStore = new MemoryMemoryStore()
const feedbackStore = new MemoryFeedbackStore(memoryStore)
const resurfacingStore = new MemoryResurfacingStore(memoryStore)
const journalStore = new MemoryJournalStore(memoryStore)
const eventEngine = new MemoryEventEngine(memoryStore, journalStore, feedbackStore, resurfacingStore)
const firstDayStore = new MemoryFirstDayStore(accountStore, memoryStore, journalStore, eventEngine)

const registered = accountStore.register({
  email: 'first-day-loop@example.com', password: 'Morrow123!', displayName: 'Kai',
})
const userId = registered.user.id
assert.equal(registered.pet.firstDayStatus, 'not_started')
assert.equal(eventEngine.catalog(userId)[0].status, 'locked')

let firstDay = firstDayStore.get(userId)
firstDay = firstDayStore.act(userId, { action: 'start', idempotencyKey: key('start') })
firstDay = firstDayStore.act(userId, { action: 'continue', idempotencyKey: key('wake') })
firstDay = firstDayStore.act(userId, { action: 'submit_name', text: 'Kai', idempotencyKey: key('name') })
firstDay = firstDayStore.act(userId, { action: 'submit_today', text: 'Today was busy, but I finished an important task.', idempotencyKey: key('today') })
assert.equal(firstDay.state, 'FD04_UNDERSTOOD')
firstDay = firstDayStore.act(userId, { action: 'confirm_understanding', idempotencyKey: key('understood') })
firstDay = firstDayStore.act(userId, { action: 'select_object', object: 'lamp', idempotencyKey: key('lamp') })
assert.equal(firstDay.proposals.length, 3)
assert.deepEqual(new Set(firstDay.proposals.map((memory) => memory.kind)), new Set(['life', 'language', 'relationship']))

for (const proposal of firstDay.proposals) {
  memoryStore.act(userId, proposal.id, {
    action: 'confirm', expectedVersion: proposal.version, content: proposal.content,
    idempotencyKey: key(`confirm-${proposal.kind}`),
  })
}
firstDay = firstDayStore.get(userId)
assert.equal(firstDay.proposals.length, 0)
firstDay = firstDayStore.act(userId, { action: 'complete_memory_review', idempotencyKey: key('memory-review') })
assert.equal(firstDay.state, 'FD07_JOURNAL')
assert.ok(firstDay.journal)
firstDay = firstDayStore.act(userId, { action: 'finish', idempotencyKey: key('finish') })
assert.equal(firstDay.status, 'completed')
assert.equal(accountStore.me(registered.token)?.pet.firstDayStatus, 'completed')
assert.equal(eventEngine.catalog(userId)[0].status, 'available')

accountStore.getPetHome(registered.token)
assert.equal(accountStore.signOut(registered.token), true)
const returned = accountStore.login({ email: 'first-day-loop@example.com', password: 'Morrow123!' })
assert.equal(returned.user.id, userId)
assert.equal(returned.pet.firstDayStatus, 'completed')
const returnedHome = accountStore.getPetHome(returned.token)
assert.match(returnedHome?.home.returnMessageZh ?? '', /灯还亮着|一起恢复/)

const dayTwo = eventEngine.start(userId, { eventKey: 'morrow_letter_v1', idempotencyKey: key('day-two-event') }, 'NEW')
assert.equal(dayTwo.eventKey, 'morrow_letter_v1')
assert.equal(dayTwo.resurfacingPrompt?.mode, 'natural_modeling')
assert.match(dayTwo.resurfacingPrompt?.promptZh ?? '', /记得你上次确认留下的话/)
assert.equal(journalStore.list(userId).filter((entry) => entry.eventKey === 'first_day_v1').length, 1)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'registered-user',
    'first-day-state-machine',
    'first-expression-understood',
    'world-choice',
    'three-memory-review',
    'first-journal',
    'sign-out-and-login',
    'return-continuity',
    'day-two-event-unlocked',
    'confirmed-expression-resurfaced',
    'no-manual-database-change',
  ],
}, null, 2))
