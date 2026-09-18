/**
 * OpenAI 兼容音频转录实现（/audio/transcriptions，multipart/form-data）。
 * 兼容 OpenAI gpt-4o-mini-transcribe / whisper-1，以及提供相同端点的供应商。
 * 通过 ASR_API_BASE_URL / ASR_API_KEY / ASR_MODEL 环境变量切换。
 */
import { AdapterError, requireEnv } from '../types.js'
import type { ASRAdapter, ASRRequest, ASRResult } from './adapter.js'

export interface OpenAICompatibleASRConfig {
  baseUrl: string
  apiKey: string
  model: string
  timeoutMs?: number
}

export class OpenAICompatibleASR implements ASRAdapter {
  readonly provider = 'openai-compatible'
  readonly model: string
  private readonly cfg: Required<OpenAICompatibleASRConfig>

  constructor(config?: Partial<OpenAICompatibleASRConfig>) {
    this.cfg = {
      baseUrl: (config?.baseUrl ?? requireEnv('ASR_API_BASE_URL')).replace(/\/$/, ''),
      apiKey: config?.apiKey ?? requireEnv('ASR_API_KEY'),
      model: config?.model ?? requireEnv('ASR_MODEL'),
      timeoutMs: config?.timeoutMs ?? 30_000,
    }
    this.model = this.cfg.model
  }

  async transcribe(req: ASRRequest): Promise<ASRResult> {
    const form = new FormData()
    const owned = req.audio.slice().buffer as ArrayBuffer
    const blob = new Blob([owned], { type: req.mimeType })
    form.append('file', blob, 'audio.webm')
    form.append('model', this.cfg.model)
    if (req.languageHint) form.append('language', req.languageHint)
    // 要求返回词级置信度（多数兼容供应商至少返回整体概率）。
    form.append('response_format', 'verbose_json')

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.cfg.timeoutMs)

    let response: Response
    try {
      response = await fetch(`${this.cfg.baseUrl}/audio/transcriptions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.cfg.apiKey}` },
        body: form,
        signal: controller.signal,
      })
    } catch (err) {
      throw new AdapterError(
        err instanceof Error && err.name === 'AbortError' ? 'asr_upload_failed' : 'asr_http_error',
        this.provider,
        `音频上传失败: ${(err as Error).message}`,
        err,
      )
    } finally {
      clearTimeout(timer)
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      throw new AdapterError(
        'asr_http_error',
        this.provider,
        `供应商返回 HTTP ${response.status}: ${body.slice(0, 300)}`,
      )
    }

    const payload = (await response.json()) as {
      text?: string
      duration?: number
      confidence?: number
      words?: Array<{ confidence?: number }>
    }

    if (typeof payload.text !== 'string' || payload.text.trim() === '') {
      throw new AdapterError('asr_http_error', this.provider, '转录结果为空')
    }

    // verbose_json 的 confidence 字段各供应商不一致，做防御式取值。
    const confidence =
      typeof payload.confidence === 'number'
        ? payload.confidence
        : Array.isArray(payload.words) && payload.words.length > 0
          ? average(payload.words.map((w) => w.confidence).filter((c): c is number => typeof c === 'number'))
          : null

    return {
      provider: this.provider,
      model: this.cfg.model,
      text: payload.text.trim(),
      confidence,
      durationSec: payload.duration,
      rawResponse: payload,
    }
  }
}

function average(nums: number[]): number | null {
  if (nums.length === 0) return null
  return nums.reduce((a, b) => a + b, 0) / nums.length
}
