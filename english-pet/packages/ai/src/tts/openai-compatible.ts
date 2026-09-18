/**
 * OpenAI 兼容 TTS 实现（/audio/speech）。
 * 兼容 OpenAI tts-1 / 提供相同端点的供应商。
 * 通过 TTS_API_BASE_URL / TTS_API_KEY / TTS_VOICE / TTS_SPEED 环境变量切换。
 */
import { AdapterError, requireEnv } from '../types.js'
import type { TTSAdapter, TTSRequest, TTSResult } from './adapter.js'

export interface OpenAICompatibleTTSConfig {
  baseUrl: string
  apiKey: string
  voice: string
  speed: number
  model?: string
  timeoutMs?: number
}

export class OpenAICompatibleTTS implements TTSAdapter {
  readonly provider = 'openai-compatible'
  private readonly cfg: Required<OpenAICompatibleTTSConfig>

  constructor(config?: Partial<OpenAICompatibleTTSConfig>) {
    this.cfg = {
      baseUrl: (config?.baseUrl ?? requireEnv('TTS_API_BASE_URL')).replace(/\/$/, ''),
      apiKey: config?.apiKey ?? requireEnv('TTS_API_KEY'),
      voice: config?.voice ?? requireEnv('TTS_VOICE'),
      speed: config?.speed ?? Number(process.env.TTS_SPEED ?? '1'),
      model: config?.model ?? process.env.TTS_MODEL ?? 'tts-1',
      timeoutMs: config?.timeoutMs ?? 30_000,
    }
  }

  async synthesize(req: TTSRequest): Promise<TTSResult> {
    const speed = clampSpeed(req.speed ?? this.cfg.speed)
    const voice = req.voice ?? this.cfg.voice
    const format = req.format ?? 'mp3'

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.cfg.timeoutMs)

    let response: Response
    try {
      response = await fetch(`${this.cfg.baseUrl}/audio/speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.cfg.apiKey}`,
        },
        body: JSON.stringify({
          model: this.cfg.model,
          voice,
          input: req.text,
          speed,
          response_format: format,
        }),
        signal: controller.signal,
      })
    } catch (err) {
      throw new AdapterError(
        err instanceof Error && err.name === 'AbortError' ? 'tts_http_error' : 'tts_http_error',
        this.provider,
        `合成请求失败: ${(err as Error).message}`,
        err,
      )
    } finally {
      clearTimeout(timer)
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      throw new AdapterError(
        'tts_http_error',
        this.provider,
        `供应商返回 HTTP ${response.status}: ${body.slice(0, 300)}`,
      )
    }

    const buf = new Uint8Array(await response.arrayBuffer())
    if (buf.length === 0) {
      throw new AdapterError('tts_empty_audio', this.provider, '合成音频为空')
    }

    return {
      provider: this.provider,
      voice,
      mimeType: `audio/${format}`,
      audio: buf,
      durationSec: estimateSpeechSec(req.text, speed),
    }
  }
}

export function clampSpeed(speed: number): number {
  if (!Number.isFinite(speed)) return 1
  return Math.min(2, Math.max(0.5, speed))
}

export function estimateSpeechSec(text: string, speed: number): number {
  // 成人英语约 15 词/秒? 实际约 2.5 词/秒；按 1 词约 5 字符粗估。
  const words = text.split(/\s+/).filter(Boolean).length
  return (words / 2.5 / Math.max(0.5, speed)) || 1
}
