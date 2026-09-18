/**
 * LLM 统一适配器接口。业务层只依赖此接口，切换供应商只改环境变量与实现类。
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LLMRequest {
  /** 完整系统提示词（PET_SYSTEM_PROMPT.md + 运行时上下文模板渲染结果）。 */
  systemPrompt: string
  /** 本轮对话历史与用户输入（已组装 ACTIVE_MEMORIES / RECENT_CONTEXT）。 */
  messages: ChatMessage[]
  /** 是否强制 JSON 输出。OpenAI 兼容供应商传 response_format=json_object。 */
  jsonMode?: boolean
  /** 最大输出 token，默认由实现决定。 */
  maxOutputTokens?: number
}

export interface LLMTokenUsage {
  inputTokens: number
  outputTokens: number
}

export interface LLMResult {
  provider: string
  model: string
  /** 模型原始返回文本（应为 JSON 字符串），交给 validation.parseMorrowReply。 */
  raw: string
  usage?: LLMTokenUsage
  latencyMs: number
}

export interface LLMAdapter {
  readonly provider: string
  readonly model: string
  complete(req: LLMRequest): Promise<LLMResult>
}
