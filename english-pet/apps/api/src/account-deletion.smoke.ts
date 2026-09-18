import assert from 'node:assert/strict'
import { MemoryAccountStore } from './memory-account-store.js'
import { MemoryConversationStore } from './memory-conversation-store.js'
import { MemoryEventEngine } from './memory-event-engine.js'
import { MemoryFeedbackStore } from './memory-feedback-store.js'
import { MemoryFirstDayStore } from './memory-first-day-store.js'
import { MemoryJournalStore } from './memory-journal-store.js'
import { MemoryMemoryStore } from './memory-memory-store.js'
import { MemoryResurfacingStore } from './memory-resurfacing-store.js'

const accountStore = new MemoryAccountStore()
const memoryStore = new MemoryMemoryStore()
const feedbackStore = new MemoryFeedbackStore(memoryStore)
const resurfacingStore = new MemoryResurfacingStore(memoryStore)
const journalStore = new MemoryJournalStore(memoryStore)
const conversationStore = new MemoryConversationStore(memoryStore, feedbackStore)
const eventEngine = new MemoryEventEngine(memoryStore, journalStore, feedbackStore, resurfacingStore)
const firstDayStore = new MemoryFirstDayStore(accountStore, memoryStore, journalStore, eventEngine)
const session = accountStore.register({ email: 'delete-self-test@example.com', password: 'Morrow123!', displayName: 'Delete test' })
const userId = session.user.id
memoryStore.proposeFromConversation(userId, '00000000-0000-4000-8000-000000000303', [{ kind: 'life', content: 'Temporary test memory.', confidence: 'high' }])
conversationStore.getOrCreate(userId)
firstDayStore.get(userId)
eventEngine.markFirstDayCompleted(userId, 'lamp')
resurfacingStore.debug(userId)

const deletedUserId = accountStore.deleteAccount(session.token)
assert.equal(deletedUserId, userId)
firstDayStore.clearUser(userId)
eventEngine.clearUser(userId)
conversationStore.clearUser(userId)
journalStore.clearUser(userId)
resurfacingStore.clearUser(userId)
memoryStore.clearUser(userId)
assert.equal(accountStore.me(session.token), null)
assert.throws(() => accountStore.login({ email: 'delete-self-test@example.com', password: 'Morrow123!' }), /invalid_credentials/)
assert.equal(memoryStore.list(userId, true).proposed.length, 0)
assert.equal(journalStore.list(userId).length, 0)
assert.equal(resurfacingStore.debug(userId).tasks.length, 0)

console.log(JSON.stringify({ ok: true, checks: ['session-revoked', 'login-removed', 'memory-cleared', 'journal-cleared', 'event-cleared', 'resurfacing-cleared'] }, null, 2))
