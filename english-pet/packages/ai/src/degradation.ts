/**
 * 失败降级逻辑。原则：任何外部服务失败都不抛未捕获异常，
 * 而是返回一个安全、可解释、用户可见的文字结果，并记录结构化失败原因。
 *
 * 与 PET_SYSTEM_PROMPT.md 的 suggested_recovery 枚举对齐。
 */
import { AdapterError } from './types.js'
import { parseMorrowReply, type MorrowReply } from './validation.js'
import type { LLMAdapter, LLMRequest, LLMResult } from './llm/adapter.js'
import type { ASRAdapter, ASRRequest, ASRResult } from './asr/adapter.js'
import type { TTSAdapter, TTSRequest, TTSResult } from './tts/adapter.js'

export interface SafeLLMOutcome {
  /** 通过 Schema 校验后的结构化回复；降级时为 null。 */
  reply: MorrowReply | null
  /** 用户可见的文字（无论成功/降级都有值）。 */
  visibleText: string
  degraded: boolean
  errorCode: string | null
  rawResult: LLMResult | null
}

/** LLM 调用 + 校验 + 兜底。模型超时/格式错误/Schema 拒绝时返回安全回复。 */
export async function safeComplete(
  adapter: LLMAdapter,
  req: LLMRequest,
  options?: { retryOnce?: boolean; fallbackText?: string },
): Promise<SafeLLMOutcome> {
  const fallback =
    options?.fallbackText ??
    "I'm having trouble thinking clearly for a moment. Try again, or type your message instead."

  let raw: LLMResult
  try {
    raw = await adapter.complete(req)
  } catch (err) {
    return fail('llm_call_failed', visibleFromError(err), null, rawOrNull(err))
  }

  const parsed = parseMorrowReply(raw.raw)
  if (parsed.ok) {
    return { reply: parsed.value, visibleText: parsed.value.reply_text, degraded: false, errorCode: null, rawResult: raw }
  }

  // 首次 Schema 失败时，允许带一句"必须输出合法 JSON"重试一次。
  if (options?.retryOnce !== false) {
    try {
      const retryReq: LLMRequest = {
        ...req,
        systemPrompt: `${req.systemPrompt}\n\nREMINDER: Return ONLY valid JSON matching the given schema. No markdown, no extra text.`,
      }
      const retryRaw = await adapter.complete(retryReq)
      const retryParsed = parseMorrowReply(retryRaw.raw)
      if (retryParsed.ok) {
        return {
          reply: retryParsed.value,
          visibleText: retryParsed.value.reply_text,
          degraded: false,
          errorCode: null,
          rawResult: retryRaw,
        }
      }
    } catch {
      // 重试也失败则走兜底。
    }
  }

  return fail(parsed.error, fallback, null, raw)

  function fail(errorCode: string, text: string, reply: MorrowReply | null, rawResult: LLMResult | null): SafeLLMOutcome {
    return { reply, visibleText: text, degraded: true, errorCode, rawResult }
  }
}

function rawOrNull(_err: unknown): LLMResult | null {
  return null
}

function visibleFromError(err: unknown): string {
  if (err instanceof AdapterError) {
    if (err.kind === 'llm_timeout') {
      return "It took me a little too long to answer. Try saying that again."
    }
    if (err.kind === 'config_missing') {
      return "Voice chat is not configured on the server yet. Text reply still works."
    }
  }
  return "Something interrupted my reply. You can try again, or switch to typing."
}

export interface SafeASROutcome {
  result: ASRResult | null
  /** 用户可见提示：失败时提示改用文字。 */
  userMessage: string
  degraded: boolean
  errorCode: string | null
}

/** ASR 失败时：不阻塞，提示用户改用文字输入。 */
export async function safeTranscribe(adapter: ASRAdapter, req: ASRRequest): Promise<SafeASROutcome> {
  try {
    const result = await adapter.transcribe(req)
    return { result, userMessage: '', degraded: false, errorCode: null }
  } catch (err) {
    const code = err instanceof AdapterError ? err.kind : 'asr_unknown'
    return {
      result: null,
      userMessage:
        "I couldn't hear that clearly. You can type it, or hold the mic a little closer and try again.",
      degraded: true,
      errorCode: code,
    }
  }
}

export interface SafeTTSOutcome {
  result: TTSResult | null
  /** TTS 失败时仍有字幕文字，用户只看文字、听不到声音。 */
  subtitle: string
  degraded: boolean
  errorCode: string | null
}

/** TTS 失败时：文字字幕照常显示，不阻断对话。 */
export async function safeSynthesize(
  adapter: TTSAdapter,
  req: TTSRequest,
  subtitle: string,
): Promise<SafeTTSOutcome> {
  try {
    const result = await adapter.synthesize(req)
    return { result, subtitle, degraded: false, errorCode: null }
  } catch (err) {
    const code = err instanceof AdapterError ? err.kind : 'tts_unknown'
    return { result: null, subtitle, degraded: true, errorCode: code }
  }
}
