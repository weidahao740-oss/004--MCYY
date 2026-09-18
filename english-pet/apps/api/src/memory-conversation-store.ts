import { randomUUID } from 'node:crypto'
import { MockLLM, filterMemoryProposals, safeComplete, type ChatMessage } from '@english-pet/ai'
import type {
  ChatStreamEvent,
  CompleteConversationResponse,
  Conversation,
  ConversationMessage,
  MeResponse,
  SendMessageRequest,
  Memory,
} from '@english-pet/contracts'
import { MemoryFeedbackStore } from './memory-feedback-store.js'
import { MemoryMemoryStore } from './memory-memory-store.js'
import { MORROW_OUTPUT_SCHEMA_VERSION, MORROW_PROMPT_VERSION, MORROW_SYSTEM_PROMPT } from './morrow-system-prompt.js'

interface IConversationRecord extends Conversation {
  userId: string
  userMessageByClientId: Map<string, ConversationMessage>
  replyByClientId: Map<string, ConversationMessage>
}

const conversations = new Map<string, IConversationRecord>()
const activeConversationIdByUser = new Map<string, string>()
const llm = new MockLLM()

function message(role: 'user' | 'assistant', content: string, degraded = false): ConversationMessage {
  return { id: randomUUID(), role, content, createdAt: new Date().toISOString(), degraded }
}

function publicConversation(record: IConversationRecord): Conversation {
  return {
    id: record.id,
    status: record.status,
    messages: record.messages,
    modelMode: record.modelMode,
  }
}

function buildSystemPrompt(me: MeResponse, recent: ConversationMessage[], userInput: string, activeMemories: Memory[]): string {
  const recentContext = recent
    .slice(-8)
    .map((item) => `${item.role.toUpperCase()}: ${item.content}`)
    .join('\n')

  return `${MORROW_SYSTEM_PROMPT}

PROMPT_VERSION: ${MORROW_PROMPT_VERSION}
OUTPUT_SCHEMA_VERSION: ${MORROW_OUTPUT_SCHEMA_VERSION}

PRODUCT_MODE:
free_chat

USER_LANGUAGE_PROFILE:
- level: ${me.settings.languageLevel}
- preferred_reply_length: ${me.settings.preferredReplyLength}
- speech_rate: ${me.settings.speechRate}
- subtitles_enabled: ${me.settings.subtitlesEnabled}
- correction_preference: ${me.settings.correctionPreference}

RELATIONSHIP_STATE:
- stage: ${me.pet.relationshipStage}
- shared_reference_ids: []

CURRENT_EVENT:
null

ACTIVE_MEMORIES:
${JSON.stringify(activeMemories.map(({ id, kind, content }) => ({ id, kind, content })))}

RECENT_CONTEXT:
${recentContext || '(none)'}

INPUT_METADATA:
- input_mode: text
- asr_confidence: null
- user_requested_help: none
- event_should_end: false

USER_INPUT:
${userInput}`
}

function chatMessages(history: ConversationMessage[]): ChatMessage[] {
  return history.slice(-8).map((item) => ({ role: item.role, content: item.content }))
}

export class MemoryConversationStore {
  constructor(
    private readonly memoryStore: MemoryMemoryStore,
    private readonly feedbackStore: MemoryFeedbackStore,
  ) {}

  getOrCreate(userId: string): Conversation {
    const currentId = activeConversationIdByUser.get(userId)
    const current = currentId ? conversations.get(currentId) : undefined
    if (current && current.status !== 'completed') return publicConversation(current)

    const record: IConversationRecord = {
      id: randomUUID(),
      userId,
      status: 'active',
      modelMode: 'mock',
      messages: [
        message(
          'assistant',
          "The room is quiet tonight. Tell me one small thing about your day, and I'll try not to take it too literally.",
        ),
      ],
      userMessageByClientId: new Map(),
      replyByClientId: new Map(),
    }
    conversations.set(record.id, record)
    activeConversationIdByUser.set(userId, record.id)
    return publicConversation(record)
  }

  complete(userId: string, conversationId: string, onlyWhenBlocking: boolean): CompleteConversationResponse {
    const record = conversations.get(conversationId)
    if (!record || record.userId !== userId) throw new Error('conversation_not_found')
    const userExpressions = record.messages.filter((item) => item.role === 'user').map((item) => item.content)
    if (userExpressions.length === 0) throw new Error('conversation_empty')
    record.status = 'completed'
    activeConversationIdByUser.delete(userId)
    return {
      conversation: { id: record.id, status: 'completed' },
      feedback: this.feedbackStore.createFromConversation({
        userId,
        conversationId: record.id,
        expressions: userExpressions,
        onlyWhenBlocking,
      }),
    }
  }

  clearUser(userId: string) {
    activeConversationIdByUser.delete(userId)
    for (const [id, record] of conversations) {
      if (record.userId === userId) conversations.delete(id)
    }
  }

  async *send(
    userId: string,
    me: MeResponse,
    conversationId: string,
    input: SendMessageRequest,
    signal: AbortSignal,
  ): AsyncGenerator<ChatStreamEvent> {
    const record = conversations.get(conversationId)
    if (!record || record.userId !== userId || record.status === 'completed') {
      yield { type: 'error', code: 'conversation_not_found', message: 'Conversation not found.', retryable: false }
      return
    }
    const completedReply = record.replyByClientId.get(input.clientMessageId)
    if (completedReply) {
      yield { type: 'completed', message: completedReply, reply: { emotion: 'calm', understoodIntent: 'Repeated request returned the existing reply.', needsClarification: false } }
      return
    }

    let userMessage = record.userMessageByClientId.get(input.clientMessageId)
    if (!userMessage) {
      userMessage = message('user', input.content)
      record.messages.push(userMessage)
      record.userMessageByClientId.set(input.clientMessageId, userMessage)
    }
    yield { type: 'accepted', conversationId, message: userMessage }

    if (signal.aborted) return
    const activeMemories = this.memoryStore.search(userId, { query: input.content, eventKey: null, limit: 5 }, me.settings.memoryEnabled)
    const outcome = await Promise.race([
      safeComplete(
        llm,
        {
          systemPrompt: buildSystemPrompt(me, record.messages.slice(0, -1), input.content, activeMemories),
          messages: chatMessages(record.messages),
          jsonMode: true,
          maxOutputTokens: 500,
        },
        {
          retryOnce: true,
          fallbackText: "The connection went quiet for a moment. Your message is still here; try again when you're ready.",
        },
      ),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('llm_timeout')), 10_000)
      }),
    ])

    const replyText = outcome.visibleText
    for (const part of replyText.match(/.{1,18}(?:\s|$)|.{1,18}/g) ?? [replyText]) {
      if (signal.aborted) return
      yield { type: 'delta', delta: part }
      await new Promise((resolve) => setTimeout(resolve, 35))
    }

    const assistantMessage = message('assistant', replyText, outcome.degraded)
    record.messages.push(assistantMessage)
    record.replyByClientId.set(input.clientMessageId, assistantMessage)
    if (outcome.reply) {
      this.memoryStore.proposeFromConversation(
        userId,
        record.id,
        filterMemoryProposals(outcome.reply)
          .filter((proposal) => proposal.action === 'create')
          .map((proposal) => ({
            kind: proposal.kind,
            content: proposal.content,
            confidence: proposal.confidence,
            semanticTags: proposal.kind === 'language' ? ['expression'] : [],
          })),
      )
    }
    yield {
      type: 'completed',
      message: assistantMessage,
      reply: {
        emotion: outcome.reply?.emotion ?? 'uncertain',
        understoodIntent: outcome.reply?.understood_intent ?? 'The reply used the safe text fallback.',
        needsClarification: outcome.reply?.needs_clarification ?? true,
      },
    }
  }
}
