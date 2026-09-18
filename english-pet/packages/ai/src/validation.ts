/**
 * 结构化输出校验层。
 *
 * 本文件中的 morrowReplySchema 与 PET_SYSTEM_PROMPT.md 第 4 节《结构化输出契约》
 * 逐字段对齐（prompt_version: morrow-system-1.0 / output_schema_version: morrow-reply-1.0）。
 * 模型输出必须先 parse 通过才允许进入业务层；parse 失败一律触发降级，不相信模型的"自认合法"。
 */
import { z } from 'zod'

export const morrowReplySchema = z.object({
  reply_text: z.string().min(1).max(800),
  reply_language: z.enum(['en', 'zh-en']),
  question_count: z.number().int().min(0).max(1),
  understood_intent: z.string().max(300),
  needs_clarification: z.boolean(),
  suggested_recovery: z.enum([
    'none',
    'retry_voice',
    'type_text',
    'simpler_english',
    'reference_reply',
    'confirm_asr',
  ]),
  emotion: z.enum(['calm', 'curious', 'warm', 'amused', 'uncertain', 'concerned']),
  event: z.object({
    action: z.enum(['none', 'continue', 'transition', 'pause', 'complete']),
    proposed_next_state: z.string().nullable(),
    effect_summary: z.string().max(300).nullable(),
  }),
  memory_proposals: z
    .array(
      z.object({
        action: z.enum(['create', 'update', 'delete']),
        kind: z.enum(['life', 'language', 'relationship']),
        content: z.string().max(300),
        confidence: z.enum(['high', 'medium', 'low']),
        requires_user_confirmation: z.literal(true),
        source_message_ids: z.array(z.string()).max(5),
      }),
    )
    .max(3),
  correction_feedback: z.object({
    success_expression: z.string().max(300).nullable(),
    original_expression: z.string().max(300).nullable(),
    natural_expression: z.string().max(300).nullable(),
    pronunciation_note: z.string().max(300).nullable(),
  }),
  safety: z.object({
    mode: z.enum(['normal', 'high_stakes_boundary', 'immediate_safety']),
    stop_roleplay: z.boolean(),
  }),
})

export type MorrowReply = z.infer<typeof morrowReplySchema>
export type MemoryProposal = MorrowReply['memory_proposals'][number]
export type EventAction = MorrowReply['event']

export type ParseResult =
  | { ok: true; value: MorrowReply }
  | { ok: false; error: string; issues: string[] }

/**
 * 解析模型返回的原始字符串为 MorrowReply。
 * 容忍模型把 JSON 包在 ```json fence 里（常见失误），其余一律拒绝。
 */
export function parseMorrowReply(raw: string): ParseResult {
  const trimmed = raw.trim()
  const stripped = stripCodeFence(trimmed)

  let parsed: unknown
  try {
    parsed = JSON.parse(stripped)
  } catch (err) {
    return {
      ok: false,
      error: `模型输出不是合法 JSON: ${(err as Error).message}`,
      issues: [],
    }
  }

  const result = morrowReplySchema.safeParse(parsed)
  if (!result.success) {
    return {
      ok: false,
      error: '模型输出未通过 morrow-reply-1.0 Schema 校验',
      issues: result.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`),
    }
  }
  return { ok: true, value: result.data }
}

function stripCodeFence(text: string): string {
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(text)
  return fence ? fence[1] : text
}

/**
 * 记忆提案落库前的二次业务过滤（与 DATA_MODEL.md 第 7 节对齐）：
 * 只接受 requires_user_confirmation === true 的提案，且单轮不超过 3 条。
 */
export function filterMemoryProposals(reply: MorrowReply): MemoryProposal[] {
  return reply.memory_proposals.filter((p) => p.requires_user_confirmation)
}
