/**
 * 阿里云百炼 Qwen3-ASR-Flash 适配器。
 *
 * 使用 OpenAI 兼容 chat/completions 协议，把本地音频编码为 Data URL。
 * 密钥只从 DASHSCOPE_API_KEY 读取，不写入日志或响应。
 */
import { AdapterError, requireEnv } from '../types.js'
import type { ASRAdapter, ASRRequest, ASRResult } from './adapter.js'

export interface QwenASRConfig {
  apiKey: string
  baseUrl?: string
  model?: string
  timeoutMs?: number
  enableItn?: boolean
}

type QwenResponse = {
  model?: string
  choices?: Array<{
    message?: {
      content?: string | Array<{ text?: string }>
      annotations?: Array<{ language?: string }>
    }
  }>
  usage?: {
    seconds?: number
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
}

export class QwenASR implements ASRAdapter {
  readonly provider = 'dashscope'
  readonly model: string
  private readonly cfg: Required<QwenASRConfig>

  constructor(config?: Partial<QwenASRConfig>) {
    this.cfg = {
      apiKey: config?.apiKey ?? requireEnv('DASHSCOPE_API_KEY'),
      baseUrl: (config?.baseUrl ?? process.env.QWEN_ASR_BASE_URL ?? 'https://dashscope.aliyuncs.com/compatible-mode/v1').replace(/\/$/, ''),
      model: config?.model ?? process.env.QWEN_ASR_MODEL ?? 'qwen3-asr-flash',
      timeoutMs: config?.timeoutMs ?? 30_000,
      enableItn: config?.enableItn ?? false,
    }
    this.model = this.cfg.model
  }

  async transcribe(req: ASRRequest): Promise<ASRResult> {
    const dataUrl = `data:${req.mimeType};base64,${Buffer.from(req.audio).toString('base64')}`
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.cfg.timeoutMs)

    let response: Response
    try {
      response = await fetch(`${this.cfg.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.cfg.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.cfg.model,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'input_audio',
                  input_audio: { data: dataUrl },
                },
              ],
            },
          ],
          stream: false,
          asr_options: {
            language: req.languageHint,
            enable_itn: this.cfg.enableItn,
          },
        }),
        signal: controller.signal,
      })
    } catch (error) {
      throw new AdapterError(
        error instanceof Error && error.name === 'AbortError' ? 'asr_upload_failed' : 'asr_http_error',
        this.provider,
        `音频上传失败: ${(error as Error).message}`,
        error,
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

    const payload = (await response.json()) as QwenResponse
    const content = payload.choices?.[0]?.message?.content
    const text = extractText(content)

    if (!text) {
      throw new AdapterError('asr_http_error', this.provider, '转录结果为空')
    }

    return {
      provider: this.provider,
      model: payload.model ?? this.cfg.model,
      text,
      // Qwen3-ASR-Flash 当前响应不提供可靠的 0~1 置信度，不伪造。
      confidence: null,
      durationSec: payload.usage?.seconds,
      rawResponse: payload,
    }
  }
}

function extractText(content: string | Array<{ text?: string }> | undefined): string {
  if (typeof content === 'string') return content.trim()
  if (!Array.isArray(content)) return ''
  return content
    .map((item) => item?.text ?? '')
    .join('')
    .trim()
}
