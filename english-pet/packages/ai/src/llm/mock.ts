/**
 * Mock LLM：无密钥时返回符合 morrow-reply-1.0 Schema 的固定/伪随机结构化输出。
 * 仅用于本地开发、CI 与降级路径演示，绝不允许在生产开启。
 */
import type { LLMAdapter, LLMRequest, LLMResult } from './adapter.js'

const REPLY_VARIANTS = [
  'That sounds like a long day already. Why did you have to arrive so early?',
  'Quiet places are easier to think in. Do you often work this late?',
  'I almost mistook that for a plan, not a wish. Which one is it today?',
  'The island holds small moments well. Tell me one thing that went right.',
]

export class MockLLM implements LLMAdapter {
  readonly provider = 'mock'
  readonly model = 'morrow-mock-1.0'

  async complete(req: LLMRequest): Promise<LLMResult> {
    // 用用户最后一条消息做种子，让 mock 输出"看起来"随输入变化，但始终合法。
    const lastUser = [...req.messages].reverse().find((m) => m.role === 'user')
    const userText = lastUser?.content.trim() ?? ''
    const seed = userText.length
    const activeMemoriesMatch = /ACTIVE_MEMORIES:\s*(\[[\s\S]*?\])\s*\n\s*RECENT_CONTEXT:/m.exec(req.systemPrompt)
    let rememberedContent: string | null = null
    if (activeMemoriesMatch) {
      try {
        const parsed = JSON.parse(activeMemoriesMatch[1]) as Array<{ content?: unknown }>
        rememberedContent = typeof parsed[0]?.content === 'string' ? parsed[0].content : null
      } catch {
        rememberedContent = null
      }
    }
    const replyText = rememberedContent
      ? `I remember this: ${rememberedContent} What feels most relevant about it today?`
      : REPLY_VARIANTS[seed % REPLY_VARIANTS.length]
    const explicitLanguageMemory = /(?:remember this expression|use this phrase again)\s*[:：]?\s*(.+)$/i.exec(userText)
    const explicitLifeMemory = /remember that\s+(.+)$/i.exec(userText)
    const memoryProposals = explicitLanguageMemory
      ? [{
          action: 'create' as const,
          kind: 'language' as const,
          content: explicitLanguageMemory[1].slice(0, 300),
          confidence: 'high' as const,
          requires_user_confirmation: true as const,
          source_message_ids: ['msg-mock-1'],
        }]
      : explicitLifeMemory
        ? [{
            action: 'create' as const,
            kind: 'life' as const,
            content: explicitLifeMemory[1].slice(0, 300),
            confidence: 'high' as const,
            requires_user_confirmation: true as const,
            source_message_ids: ['msg-mock-1'],
          }]
        : []

    const structured = {
      reply_text: replyText,
      reply_language: 'en',
      question_count: 1,
      understood_intent: 'The user shared a short update about their day.',
      needs_clarification: false,
      suggested_recovery: 'none',
      emotion: 'curious',
      event: {
        action: 'continue',
        proposed_next_state: 'listen_and_reply',
        effect_summary: null,
      },
      memory_proposals: memoryProposals,
      correction_feedback: {
        success_expression: null,
        original_expression: null,
        natural_expression: null,
        pronunciation_note: null,
      },
      safety: {
        mode: 'normal',
        stop_roleplay: false,
      },
    }

    return {
      provider: this.provider,
      model: this.model,
      raw: JSON.stringify(structured),
      usage: { inputTokens: 2500 + req.messages.length * 220, outputTokens: 180 },
      latencyMs: 12,
    }
  }
}
