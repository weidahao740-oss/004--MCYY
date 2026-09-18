/**
 * 跨适配器的公共类型。
 * 音频统一用 Uint8Array（浏览器 File 切片与 Node Buffer 均可隐式兼容），
 * 避免在业务层依赖具体供应商 SDK 的类型。
 */

export type AudioBuffer = Uint8Array

/** 统一适配器错误。业务层只捕获 AdapterError，根据 kind 走降级路径。 */
export type AdapterFailureKind =
  | 'llm_timeout'
  | 'llm_http_error'
  | 'llm_invalid_json'
  | 'llm_schema_rejected'
  | 'asr_upload_failed'
  | 'asr_http_error'
  | 'tts_http_error'
  | 'tts_empty_audio'
  | 'config_missing'

export class AdapterError extends Error {
  readonly kind: AdapterFailureKind
  readonly provider: string
  readonly cause?: unknown

  constructor(kind: AdapterFailureKind, provider: string, message: string, cause?: unknown) {
    super(`[${provider}] ${kind}: ${message}`)
    this.name = 'AdapterError'
    this.kind = kind
    this.provider = provider
    this.cause = cause
  }
}

/** 环境变量缺失时抛出，提示开发者配置，而不是在运行期崩溃。 */
export function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value || value.trim() === '') {
    throw new AdapterError(
      'config_missing',
      'env',
      `缺少环境变量 ${name}。请参考 packages/ai/README.md 配置真实供应商，或使用 Mock 实现运行 demo。`,
    )
  }
  return value.trim()
}
