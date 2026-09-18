/**
 * Mock TTS：返回一段合法的静音 WAV buffer（带 WAV 头），
 * 使 demo 能真实走"合成 → 落盘 → 可播放"链路，但不消耗任何供应商额度。
 */
import type { TTSAdapter, TTSRequest, TTSResult } from './adapter.js'
import { estimateSpeechSec } from './openai-compatible.js'

export class MockTTS implements TTSAdapter {
  readonly provider = 'mock'

  async synthesize(req: TTSRequest): Promise<TTSResult> {
    const speed = req.speed ?? 1
    const seconds = estimateSpeechSec(req.text, speed)
    return {
      provider: this.provider,
      voice: req.voice ?? 'mock-morrow-voice',
      mimeType: 'audio/wav',
      audio: makeSilentWav(seconds),
      durationSec: seconds,
    }
  }
}

/** 生成 N 秒 16kHz/16bit/单声道 静音 WAV。 */
export function makeSilentWav(seconds: number): Uint8Array {
  const sampleRate = 16_000
  const samples = Math.max(1, Math.floor(seconds * sampleRate))
  const dataSize = samples * 2
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)

  writeAscii(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeAscii(view, 8, 'WAVE')
  writeAscii(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeAscii(view, 36, 'data')
  view.setUint32(40, dataSize, true)
  // PCM 数据全 0 = 静音。
  return new Uint8Array(buffer)
}

function writeAscii(view: DataView, offset: number, text: string): void {
  for (let i = 0; i < text.length; i++) {
    view.setUint8(offset + i, text.charCodeAt(i))
  }
}
