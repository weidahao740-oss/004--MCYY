import assert from 'node:assert/strict'
import type { EventActionRequest, EventInstanceView } from '@english-pet/contracts'
import { MemoryEventEngine } from './memory-event-engine.js'
import { MemoryResurfacingStore } from './memory-resurfacing-store.js'
import { MemoryMemoryStore } from './memory-memory-store.js'

const memoryStore = new MemoryMemoryStore()
const resurfacingStore = new MemoryResurfacingStore(memoryStore)
const engine = new MemoryEventEngine(memoryStore, undefined, undefined, resurfacingStore)
const userId = 'resurfacing-smoke-user'
let sequence = 0
function id(label: string) {
  sequence += 1
  return `${label}-${sequence.toString().padStart(4, '0')}`
}
function act(instance: EventInstanceView, action: EventActionRequest['action'], options: { text?: string; choiceId?: string } = {}) {
  return engine.act(userId, instance.instanceId, {
    action,
    inputMode: options.choiceId ? 'choice' : options.text ? 'text' : 'continue',
    text: options.text,
    choiceId: options.choiceId,
    idempotencyKey: id(action),
  })
}

const proposed = memoryStore.proposeFromEventFeedback(userId, '00000000-0000-4000-8000-000000000201', {
  kind: 'language', content: 'I think it means…', expression: 'I think it means…', naturalExpression: 'I think it means…',
  confidence: 'high', semanticTags: ['interpretation'],
})
if (!proposed) throw new Error('proposal_missing')
const confirmed = memoryStore.act(userId, proposed.id, {
  action: 'confirm', expectedVersion: proposed.version, content: proposed.content, idempotencyKey: id('confirm-memory'),
})
engine.markFirstDayCompleted(userId, 'lamp')

let current = engine.start(userId, { eventKey: 'morrow_letter_v1', idempotencyKey: id('start-letter') }, 'NEW')
assert.equal(current.resurfacingPrompt, null)
current = act(current, 'continue').instance
current = act(current, 'submit', { text: 'I think it means put a sign by the door.' }).instance
current = act(current, 'confirm').instance
current = act(current, 'confirm', { choiceId: 'observe_first' }).instance
act(current, 'complete')

current = engine.start(userId, { eventKey: 'room_object_v1', idempotencyKey: id('start-room') }, 'NEW')
assert.equal(current.resurfacingPrompt, null)
current = act(current, 'continue').instance
current = act(current, 'submit', { text: "I'd rather have a shelf because it holds the letter." }).instance
current = act(current, 'confirm').instance
current = act(current, 'confirm', { choiceId: 'window' }).instance
act(current, 'complete')

current = engine.start(userId, { eventKey: 'literal_misunderstanding_v1', idempotencyKey: id('start-misunderstanding') }, 'NEW')
assert.equal(current.resurfacingPrompt?.memoryId, confirmed.id)
assert.equal(current.resurfacingPrompt?.mode, 'optional_prompt')
engine.recordResurfacing(userId, current.instanceId, 'used')
assert.equal(engine.current(userId)?.resurfacingPrompt, null)
let debug = resurfacingStore.debug(userId)
const task = debug.tasks.find((item) => item.memoryId === confirmed.id && item.targetEventKey === 'literal_misunderstanding_v1')
assert.equal(task?.serveCount, 1)
assert.equal(task?.successCount, 1)
assert.equal(task?.status, 'mastered')
assert.equal(debug.attempts[0]?.result, 'used')

memoryStore.act(userId, confirmed.id, {
  action: 'pause', expectedVersion: confirmed.version, idempotencyKey: id('pause-memory'),
})
debug = resurfacingStore.debug(userId)
const pausedTask = debug.tasks.find((item) => item.id === task?.id)
assert.equal(pausedTask?.status, 'cancelled')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'confirmed-language-memory-only',
    'target-event-match',
    'minimum-event-gap',
    'optional-prompt',
    'attempt-result-recorded',
    'success-progress-updated',
    'served-prompt-hidden',
    'paused-memory-cancels-task',
  ],
}, null, 2))
