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
import { fromJson, openDatabase, toJson } from './sqlite-db.js'
import type { SqliteFeedbackStore } from './sqlite-feedback-store.js'
import type { SqliteMemoryStore } from './sqlite-memory-store.js'
import { MORROW_OUTPUT_SCHEMA_VERSION, MORROW_PROMPT_VERSION, MORROW_SYSTEM_PROMPT } from './morrow-system-prompt.js'

/**
 * SQLite 持久化对话 conversation。行为与 MemoryConversationStore 完全一致。
 */

interface IPersistedConversation {
  id: string
  userId: string
  status: Conversation['status']
  modelMode: Conversation['modelMode']
  messages: ConversationMessage[]
  userMessageByClientId: Record<string, ConversationMessage>
  replyByClientId: Record<string, ConversationMessage>
}

function message(role: 'user' | 'assistant', content: string, degraded = false): ConversationMessage {
  return { id: randomUUID(), role, content, createdAt: new Date().toISOString(), degraded }
}

function publicConversation(record: IPersistedConversation): Conversation {
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

const llm = new MockLLM()

export class SqliteConversationStore {
  constructor(
    private readonly memoryStore: SqliteMemoryStore,
    private readonly feedbackStore: SqliteFeedbackStore,
  ) {}

  private loadRecord(conversationId: string): IPersistedConversation | null {
    const row = openDatabase().prepare('SELECT record FROM conversations WHERE id = ?').get(conversationId) as { record: string } | undefined
    return row ? fromJson<IPersistedConversation>(row.record) : null
  }

  private saveRecord(record: IPersistedConversation) {
    openDatabase()
      .prepare(
        `INSERT INTO conversations (id, user_id, record) VALUES (?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET record = excluded.record`,
      )
      .run(record.id, record.userId, toJson(record))
  }

  private activeIdForUser(userId: string): string | null {
    const row = openDatabase().prepare('SELECT conversation_id FROM active_conversations WHERE user_id = ?').get(userId) as { conversation_id: string } | undefined
    return row ? row.conversation_id : null
  }

  private setActive(userId: string, conversationId: string | null) {
    const db = openDatabase()
    db.prepare('DELETE FROM active_conversations WHERE user_id = ?').run(userId)
    if (conversationId) {
      db.prepare('INSERT INTO active_conversations (user_id, conversation_id) VALUES (?, ?)').run(userId, conversationId)
    }
  }

  getOrCreate(userId: string): Conversation {
    const currentId = this.activeIdForUser(userId)
    const current = currentId ? this.loadRecord(currentId) : null
    if (current && current.status !== 'completed') return publicConversation(current)

    const record: IPersistedConversation = {
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
      userMessageByClientId: {},
      replyByClientId: {},
    }
    this.saveRecord(record)
    this.setActive(userId, record.id)
    return publicConversation(record)
  }

  complete(userId: string, conversationId: string, onlyWhenBlocking: boolean): CompleteConversationResponse {
    const record = this.loadRecord(conversationId)
    if (!record || record.userId !== userId) throw new Error('conversation_not_found')
    const userExpressions = record.messages.filter((item) => item.role === 'user').map((item) => item.content)
    if (userExpressions.length === 0) throw new Error('conversation_empty')
    record.status = 'completed'
    this.setActive(userId, null)
    this.saveRecord(record)
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
    const db = openDatabase()
    db.prepare('DELETE FROM active_conversations WHERE user_id = ?').run(userId)
    db.prepare('DELETE FROM conversations WHERE user_id = ?').run(userId)
  }

  async *send(
    userId: string,
    me: MeResponse,
    conversationId: string,
    input: SendMessageRequest,
    signal: AbortSignal,
  ): AsyncGenerator<ChatStreamEvent> {
    const record = this.loadRecord(conversationId)
    if (!record || record.userId !== userId || record.status === 'completed') {
      yield { type: 'error', code: 'conversation_not_found', message: 'Conversation not found.', retryable: false }
      return
    }
    const completedReply = record.replyByClientId[input.clientMessageId]
    if (completedReply) {
      yield { type: 'completed', message: completedReply, reply: { emotion: 'calm', understoodIntent: 'Repeated request returned the existing reply.', needsClarification: false } }
      return
    }

    let userMessage = record.userMessageByClientId[input.clientMessageId]
    if (!userMessage) {
      userMessage = message('user', input.content)
      record.messages.push(userMessage)
      record.userMessageByClientId[input.clientMessageId] = userMessage
      this.saveRecord(record)
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
    record.replyByClientId[input.clientMessageId] = assistantMessage
    this.saveRecord(record)
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
