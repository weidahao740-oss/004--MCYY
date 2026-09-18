/**
 * TTS 统一适配器接口。硬性要求：支持语速 speed 参数。
 */
import type { AudioBuffer } from '../types.js'

export interface TTSRequest {
  /** 待合成文本（来自 MorrowReply.reply_text，已通过 Schema 校验）。 */
  text: string
  /** 音色名；缺省取 TTS_VOICE 环境变量。 */
  voice?: string
  /** 语速，1.0 为正常；范围 0.5~2.0。 */
  speed?: number
  /** 输出格式，默认 mp3。 */
  format?: 'mp3' | 'wav' | 'opus'
}

export interface TTSResult {
  provider: string
  voice: string
  mimeType: string
  audio: AudioBuffer
  /** 估算秒数。 */
  durationSec?: number
}

export interface TTSAdapter {
  readonly provider: string
  synthesize(req: TTSRequest): Promise<TTSResult>
}
