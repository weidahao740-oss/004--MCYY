/**
 * OpenAI 兼容 Chat Completions 实现。
 *
 * 适用于任何暴露 /chat/completions 兼容端点的供应商：
 * OpenAI、DeepSeek、Moonshot Kimi、阿里云百炼（兼容模式）、火山方舟（兼容模式）等。
 * 通过 LLM_API_BASE_URL / LLM_API_KEY / LLM_MODEL 环境变量切换，无需改业务代码。
 *
 * 无密钥时调用 complete() 会抛出 AdapterError(config_missing)，
 * 由 degradation 层转成安全兜底回复，而不是进程崩溃。
 */
import { AdapterError, requireEnv } from '../types.js'
import type { ChatMessage, LLMAdapter, LLMRequest, LLMResult } from './adapter.js'

export interface OpenAICompatibleLLMConfig {
  baseUrl: string
  apiKey: string
  model: string
  /** 超时毫秒，默认 20000。 */
  timeoutMs?: number
}

export class OpenAICompatibleLLM implements LLMAdapter {
  readonly provider = 'openai-compatible'
  readonly model: string
  private readonly cfg: Required<Pick<OpenAICompatibleLLMConfig, 'baseUrl' | 'apiKey' | 'timeoutMs'>> & {
    model: string
  }

  constructor(config?: Partial<OpenAICompatibleLLMConfig>) {
    const baseUrl = config?.baseUrl ?? requireEnv('LLM_API_BASE_URL')
    const apiKey = config?.apiKey ?? requireEnv('LLM_API_KEY')
    const model = config?.model ?? requireEnv('LLM_MODEL')
    this.model = model
    this.cfg = {
      baseUrl: baseUrl.replace(/\/$/, ''),
      apiKey,
      model,
      timeoutMs: config?.timeoutMs ?? 20_000,
    }
  }

  async complete(req: LLMRequest): Promise<LLMResult> {
    const started = Date.now()
    const messages: ChatMessage[] = [
      { role: 'system', content: req.systemPrompt },
      ...req.messages,
    ]

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.cfg.timeoutMs)

    let response: Response
    try {
      response = await fetch(`${this.cfg.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.cfg.apiKey}`,
        },
        body: JSON.stringify({
          model: this.cfg.model,
          messages,
          max_tokens: req.maxOutputTokens ?? 600,
          ...(req.jsonMode ? { response_format: { type: 'json_object' } } : {}),
        }),
        signal: controller.signal,
      })
    } catch (err) {
      throw new AdapterError(
        err instanceof Error && err.name === 'AbortError' ? 'llm_timeout' : 'llm_http_error',
        this.provider,
        `请求失败: ${(err as Error).message}`,
        err,
      )
    } finally {
      clearTimeout(timer)
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      throw new AdapterError(
        'llm_http_error',
        this.provider,
        `供应商返回 HTTP ${response.status}: ${body.slice(0, 300)}`,
      )
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
      usage?: { prompt_tokens?: number; completion_tokens?: number }
    }

    const raw = payload.choices?.[0]?.message?.content
    if (typeof raw !== 'string') {
      throw new AdapterError('llm_invalid_json', this.provider, '响应中没有 choices[0].message.content')
    }

    return {
      provider: this.provider,
      model: this.cfg.model,
      raw,
      usage: {
        inputTokens: payload.usage?.prompt_tokens ?? 0,
        outputTokens: payload.usage?.completion_tokens ?? 0,
      },
      latencyMs: Date.now() - started,
    }
  }
}
