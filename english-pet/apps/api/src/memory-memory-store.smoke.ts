import assert from 'node:assert/strict'
import { MemoryMemoryStore } from './memory-memory-store.js'

const store = new MemoryMemoryStore()
const userId = 'memory-smoke-user'
let keyIndex = 0
const key = () => `memory-smoke-${++keyIndex}`

const proposals = store.proposeFromConversation(userId, '00000000-0000-4000-8000-000000000001', [
  { kind: 'life', content: 'The user prefers quiet cafés for focused work.', confidence: 'high', semanticTags: ['cafe', 'work', 'quiet'] },
  { kind: 'language', content: "I'd rather work somewhere quiet.", confidence: 'high', semanticTags: ['preference', 'work'] },
])
assert.equal(proposals.length, 2)
assert.equal(store.list(userId, true).proposed.length, 2)

let life = store.act(userId, proposals[0].id, {
  action: 'confirm', expectedVersion: proposals[0].version,
  content: 'The user prefers quiet cafés for focused work.', idempotencyKey: key(),
})
assert.equal(life.status, 'confirmed')
assert.equal(store.search(userId, { query: 'quiet work café', eventKey: null, limit: 5 }, true).length, 1)
assert.equal(store.search(userId, { query: 'quiet work café', eventKey: null, limit: 5 }, false).length, 0)

const pauseKey = key()
life = store.act(userId, life.id, { action: 'pause', expectedVersion: life.version, idempotencyKey: pauseKey })
const pauseReplay = store.act(userId, life.id, { action: 'pause', expectedVersion: 1, idempotencyKey: pauseKey })
assert.equal(life.status, 'paused')
assert.deepEqual(pauseReplay, life)
assert.equal(store.search(userId, { query: 'quiet work café', eventKey: null, limit: 5 }, true).length, 0)

life = store.act(userId, life.id, { action: 'resume', expectedVersion: life.version, idempotencyKey: key() })
life = store.act(userId, life.id, {
  action: 'edit', expectedVersion: life.version,
  content: 'The user prefers quiet libraries for focused work.', idempotencyKey: key(),
})
assert.equal(store.search(userId, { query: 'quiet library work', eventKey: null, limit: 5 }, true)[0]?.content, life.content)
assert.throws(() => store.act(userId, life.id, {
  action: 'edit', expectedVersion: life.version - 1,
  content: 'Stale overwrite', idempotencyKey: key(),
}), /memory_version_conflict/)

const restricted = store.proposeFromConversation(userId, '00000000-0000-4000-8000-000000000001', [
  { kind: 'life', content: 'My password is secret-123.', confidence: 'high' },
])
assert.equal(restricted.length, 0)
assert.equal(store.list(userId, true).restrictedProposalCount, 1)

const eventProposals = store.proposeFromEvent(
  userId,
  '00000000-0000-4000-8000-000000000002',
  'morrow_letter_v1',
  'observe_first',
)
assert.equal(eventProposals.length, 1)
assert.equal(eventProposals[0].kind, 'relationship')
assert.equal(eventProposals[0].status, 'proposed')

store.act(userId, proposals[1].id, {
  action: 'reject', expectedVersion: proposals[1].version, idempotencyKey: key(),
})
assert.equal(store.list(userId, true).proposed.some((item) => item.id === proposals[1].id), false)

life = store.act(userId, life.id, { action: 'delete', expectedVersion: life.version, idempotencyKey: key() })
assert.equal(life.status, 'deleted')
assert.equal(life.content, '')
assert.equal(store.search(userId, { query: 'quiet library work', eventKey: null, limit: 5 }, true).length, 0)
assert.ok(store.revisionCount(userId) >= 8)

console.log(JSON.stringify({
  ok: true,
  checks: ['proposal', 'confirmation', 'relevance-search', 'global-pause', 'item-pause-resume', 'edit', 'optimistic-lock', 'restricted-filter', 'event-relationship-proposal', 'reject', 'delete', 'idempotency'],
  restrictedProposalCount: store.list(userId, true).restrictedProposalCount,
  revisionCount: store.revisionCount(userId),
}, null, 2))
