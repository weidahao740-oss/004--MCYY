import assert from 'node:assert/strict'
import type { ChatStreamEvent } from '@english-pet/contracts'
import { MemoryAccountStore } from './memory-account-store.js'
import { MemoryConversationStore } from './memory-conversation-store.js'
import { MemoryFeedbackStore } from './memory-feedback-store.js'
import { MemoryMemoryStore } from './memory-memory-store.js'

const accountStore = new MemoryAccountStore()
const session = accountStore.createGuest()
const me = accountStore.me(session.token)
if (!me) throw new Error('guest_session_missing')
const userId = me.user.id
const memoryStore = new MemoryMemoryStore()
const feedbackStore = new MemoryFeedbackStore(memoryStore)
const conversationStore = new MemoryConversationStore(memoryStore, feedbackStore)
const conversation = conversationStore.getOrCreate(userId)

async function send(content: string, clientMessageId: string) {
  const events: ChatStreamEvent[] = []
  for await (const event of conversationStore.send(
    userId,
    accountStore.me(session.token)!,
    conversation.id,
    { content, clientMessageId },
    new AbortController().signal,
  )) events.push(event)
  return events
}

await send('Remember that I prefer quiet libraries for focused work.', 'memory-chat-1')
let list = memoryStore.list(userId, true)
assert.equal(list.proposed.length, 1)
assert.equal(list.proposed[0].kind, 'life')

let saved = memoryStore.act(userId, list.proposed[0].id, {
  action: 'confirm', expectedVersion: list.proposed[0].version,
  content: list.proposed[0].content, idempotencyKey: 'memory-chat-confirm-1',
})
assert.equal(saved.status, 'confirmed')

const recalled = await send('What helps me focus in quiet libraries?', 'memory-chat-2')
const recalledCompleted = recalled.find((event) => event.type === 'completed')
assert.ok(recalledCompleted && recalledCompleted.type === 'completed')
assert.match(recalledCompleted.message.content, /I remember this:/)
assert.match(recalledCompleted.message.content, /quiet libraries/i)

saved = memoryStore.act(userId, saved.id, {
  action: 'delete', expectedVersion: saved.version,
  idempotencyKey: 'memory-chat-delete-1',
})
assert.equal(saved.status, 'deleted')

const afterDelete = await send('What helps me focus in quiet libraries?', 'memory-chat-3')
const deletedCompleted = afterDelete.find((event) => event.type === 'completed')
assert.ok(deletedCompleted && deletedCompleted.type === 'completed')
assert.doesNotMatch(deletedCompleted.message.content, /I remember this:/)

console.log(JSON.stringify({
  ok: true,
  checks: ['explicit-proposal', 'user-confirmation', 'active-memory-injection', 'delete-immediate-filter'],
  proposalKind: list.proposed[0].kind,
  recalledBeforeDelete: recalledCompleted.message.content,
  recalledAfterDelete: deletedCompleted.message.content,
}, null, 2))
