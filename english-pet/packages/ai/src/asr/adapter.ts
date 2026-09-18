/**
 * ASR 统一适配器接口。
 * 硬性要求：返回可编辑转写文本 text + 置信度 confidence；
 * 用户修改后的文本以修改版为准回传 LLM，不把原始转写当真相。
 */
import type { AudioBuffer } from '../types.js'

export interface ASRRequest {
  /** 原始音频字节（客户端上传的 webm/opus/mp3/wav）。 */
  audio: AudioBuffer
  /** 例如 'audio/webm' | 'audio/mp4' | 'audio/wav'。 */
  mimeType: string
  /** 语言提示，本产品固定英语（中式口音英语），例如 'en'。 */
  languageHint?: string
}

export interface ASRResult {
  provider: string
  model: string
  /** 可编辑转写文本；前端展示后允许用户修改，修改版用于后续 LLM 调用。 */
  text: string
  /** 0~1；供应商不返回时为 null。低于阈值时模型应走 needs_clarification + confirm_asr。 */
  confidence: number | null
  /** 估计音频秒数。 */
  durationSec?: number
  /** 供应商原始响应，用于排错；生产日志不应落盘。 */
  rawResponse?: unknown
}

export interface ASRAdapter {
  readonly provider: string
  readonly model: string
  transcribe(req: ASRRequest): Promise<ASRResult>
}
