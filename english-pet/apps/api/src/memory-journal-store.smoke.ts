import assert from 'node:assert/strict'
import { MemoryJournalStore } from './memory-journal-store.js'
import { MemoryMemoryStore } from './memory-memory-store.js'

const memoryStore = new MemoryMemoryStore()
const journalStore = new MemoryJournalStore(memoryStore)
const userId = 'journal-smoke-user'
const eventInstanceId = '00000000-0000-4000-8000-000000000101'

const proposed = memoryStore.proposeFromEvent(userId, eventInstanceId, 'morrow_letter_v1', 'observe_first')
assert.equal(proposed.length, 1)

let entry = journalStore.createFromEvent({
  userId,
  eventInstanceId,
  eventKey: 'morrow_letter_v1',
  outcomeId: 'observe_first',
  userExpression: "Let's listen to the road before we answer.",
})
const replayed = journalStore.createFromEvent({
  userId,
  eventInstanceId,
  eventKey: 'morrow_letter_v1',
  outcomeId: 'observe_first',
  userExpression: 'A different retry must not create another entry.',
})
assert.equal(replayed.id, entry.id)
assert.equal(entry.whatMorrowRemembers, null)
assert.equal(entry.pronunciationNote, null)
assert.match(entry.whatHappened, /letter stays/i)
assert.equal(journalStore.list(userId).length, 1)

const confirmed = memoryStore.act(userId, proposed[0].id, {
  action: 'confirm', expectedVersion: proposed[0].version,
  content: proposed[0].content, idempotencyKey: 'journal-memory-confirm-1',
})
entry = journalStore.list(userId)[0]
assert.equal(entry.linkedMemoryId, confirmed.id)
assert.equal(entry.whatMorrowRemembers, confirmed.content)

entry = journalStore.act(userId, entry.id, {
  action: 'edit', expectedVersion: entry.version,
  patch: {
    whatHappened: 'The letter stayed by the window while Morrow listened.',
    whatUserSaid: "Let's listen before we answer.",
    naturalExpression: "Let's listen to the road before we answer.",
    whatMorrowRemembers: 'You and Morrow carefully interpreted the first letter.',
  },
  idempotencyKey: 'journal-edit-1',
})
assert.equal(entry.whatMorrowRemembers, 'You and Morrow carefully interpreted the first letter.')
assert.equal(memoryStore.confirmedForEvent(userId, eventInstanceId)[0].content, entry.whatMorrowRemembers)

entry = journalStore.act(userId, entry.id, {
  action: 'hide', expectedVersion: entry.version, idempotencyKey: 'journal-hide-1',
})
assert.equal(entry.visibility, 'hidden')
entry = journalStore.act(userId, entry.id, {
  action: 'restore', expectedVersion: entry.version, idempotencyKey: 'journal-restore-1',
})
assert.equal(entry.visibility, 'visible')
entry = journalStore.act(userId, entry.id, {
  action: 'delete', expectedVersion: entry.version, idempotencyKey: 'journal-delete-1',
})
assert.equal(entry.visibility, 'deleted')
assert.equal(journalStore.list(userId).length, 0)
assert.equal(memoryStore.confirmedForEvent(userId, eventInstanceId).length, 1)

console.log(JSON.stringify({
  ok: true,
  checks: ['one-entry-per-event', 'settled-event-summary', 'original-expression', 'natural-expression', 'no-invented-pronunciation', 'unconfirmed-memory-hidden', 'confirmed-memory-link', 'journal-edit', 'memory-sync', 'hide-restore', 'journal-delete-independent'],
  journalId: entry.id,
  linkedMemoryStillExists: memoryStore.confirmedForEvent(userId, eventInstanceId).length === 1,
}, null, 2))
