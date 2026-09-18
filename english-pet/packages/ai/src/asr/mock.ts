/**
 * Mock ASR：无音频样本时返回"可编辑转写 + 置信度"，用于演示
 * "用户修改转写 → 修改版回传 LLM"的产品流程。
 */
import type { ASRAdapter, ASRRequest, ASRResult } from './adapter.js'

const MOCK_TRANSCRIPTS = [
  { text: 'I woke up at five today, the traffic was terrible.', confidence: 0.92 },
  { text: 'I think the meeting will be finished by noon.', confidence: 0.78 },
  { text: 'Can we just stay here for a little longer?', confidence: 0.54 },
]

export class MockASR implements ASRAdapter {
  readonly provider = 'mock'
  readonly model = 'morrow-mock-asr'

  async transcribe(req: ASRRequest): Promise<ASRResult> {
    // 用音频长度做选择种子，让三次录音得到不同 mock 结果。
    const seed = req.audio.length % MOCK_TRANSCRIPTS.length
    const picked = MOCK_TRANSCRIPTS[seed]
    return {
      provider: this.provider,
      model: this.model,
      text: picked.text,
      confidence: picked.confidence,
      durationSec: req.audio.length > 0 ? Math.round(req.audio.length / 1600) : 10,
      rawResponse: { note: 'mock transcript, not real speech recognition' },
    }
  }
}
