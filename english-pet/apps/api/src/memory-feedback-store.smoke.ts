import assert from 'node:assert/strict'
import type { EventActionRequest, EventInstanceView } from '@english-pet/contracts'
import { MemoryConversationStore } from './memory-conversation-store.js'
import { MemoryEventEngine } from './memory-event-engine.js'
import { MemoryFeedbackStore } from './memory-feedback-store.js'
import { MemoryJournalStore } from './memory-journal-store.js'
import { MemoryMemoryStore } from './memory-memory-store.js'

const memoryStore = new MemoryMemoryStore()
const feedbackStore = new MemoryFeedbackStore(memoryStore)
const journalStore = new MemoryJournalStore(memoryStore)
const eventEngine = new MemoryEventEngine(memoryStore, journalStore, feedbackStore)
let sequence = 0
function key(label: string) {
  sequence += 1
  return `${label}-${sequence.toString().padStart(4, '0')}`
}
function act(userId: string, instance: EventInstanceView, action: EventActionRequest['action'], options: { text?: string; choiceId?: string } = {}) {
  return eventEngine.act(userId, instance.instanceId, {
    action,
    inputMode: options.choiceId ? 'choice' : options.text ? 'text' : 'continue',
    text: options.text,
    choiceId: options.choiceId,
    idempotencyKey: key(action),
  })
}

const eventUser = 'feedback-event-user'
eventEngine.markFirstDayCompleted(eventUser, 'lamp')
let current = eventEngine.start(eventUser, { eventKey: 'morrow_letter_v1', idempotencyKey: key('start') }, 'NEW')
current = act(eventUser, current, 'continue').instance
current = act(eventUser, current, 'submit', { text: 'I think we should leave.' }).instance
current = act(eventUser, current, 'clarify', { text: 'I mean put a sign there.' }).instance
current = act(eventUser, current, 'confirm').instance
current = act(eventUser, current, 'confirm', { choiceId: 'observe_first' }).instance
const completed = act(eventUser, current, 'complete')
assert.equal(completed.feedback?.result, 'affects_understanding')
assert.equal(completed.feedback?.focusItems.length, 2)
assert.equal(completed.feedback?.pronunciationNote, null)
assert.ok(completed.feedback?.suggestedMemoryId)
const eventProposal = memoryStore.list(eventUser, true).proposed.find((memory) => memory.id === completed.feedback?.suggestedMemoryId)
assert.equal(eventProposal?.kind, 'language')
assert.equal(eventProposal?.status, 'proposed')

const conversationUser = 'feedback-conversation-user'
const conversationStore = new MemoryConversationStore(memoryStore, feedbackStore)
const conversation = conversationStore.getOrCreate(conversationUser)
for await (const _event of conversationStore.send(
  conversationUser,
  {
    user: { id: conversationUser, accountKind: 'guest', status: 'active', email: null, displayName: 'Guest', createdAt: new Date().toISOString() },
    settings: {
      languageLevel: 'L2', preferredReplyLength: 'standard', speechRate: 'normal', subtitlesEnabled: true,
      correctionPreference: 'after_conversation', memoryEnabled: true, voiceInputEnabled: true, voiceOutputEnabled: true,
      interfaceLocale: 'zh-CN', timeZone: 'Asia/Shanghai',
    },
    pet: { id: '00000000-0000-4000-8000-000000000777', characterKey: 'morrow', displayName: 'Morrow', personaVersion: 'morrow-1.0', relationshipStage: 'NEW', firstDayStatus: 'completed' },
    persistence: 'memory',
  },
  conversation.id,
  { content: 'I very like quiet evenings.', clientMessageId: 'feedback-chat-message-1' },
  new AbortController().signal,
)) { /* consume stream */ }
const conversationFeedback = conversationStore.complete(conversationUser, conversation.id, false)
assert.equal(conversationFeedback.feedback.result, 'more_natural')
assert.equal(conversationFeedback.feedback.naturalExpression, 'I really like…')
assert.equal(conversationFeedback.feedback.focusItems.length, 2)
assert.ok(conversationFeedback.feedback.suggestedMemoryId)
const nextConversation = conversationStore.getOrCreate(conversationUser)
assert.notEqual(nextConversation.id, conversation.id)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'feedback-after-event-only',
    'three-level-result',
    'one-to-three-focus-items',
    'no-invented-pronunciation',
    'language-memory-stays-proposed',
    'conversation-finish-feedback',
    'new-conversation-after-finish',
  ],
}, null, 2))
