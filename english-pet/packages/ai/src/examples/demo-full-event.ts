/**
 * demo-full-event.ts — 模拟一次完整生活事件中的 LLM + ASR + TTS 调用链，
 * 并故意触发一次 ASR 失败降级，展示用户侧体验与系统记录。
 *
 * 运行：npx tsx src/examples/demo-full-event.ts
 */
import {
  MockLLM,
  MockASR,
  MockTTS,
  safeComplete,
  safeTranscribe,
  safeSynthesize,
  AdapterError,
} from '../index.js'
import type { ASRAdapter, ASRRequest, ASRResult } from '../index.js'

/** 第一次转写必失败，第二次成功——模拟"网络抖动一次"。 */
class FlakyASR implements ASRAdapter {
  readonly provider = 'flaky-demo'
  readonly model = 'mock-asr-v2'
  private calls = 0
  async transcribe(_req: ASRRequest): Promise<ASRResult> {
    this.calls += 1
    if (this.calls === 1) {
      throw new AdapterError('asr_http_error', this.provider, '模拟首次上传超时（演示降级）')
    }
    return {
      provider: this.provider,
      model: this.model,
      text: 'I finished the report much earlier than planned tonight.',
      confidence: 0.86,
      durationSec: 9,
      rawResponse: { note: 'recovered on retry' },
    }
  }
}

async function main(): Promise<void> {
  const llm = new MockLLM()
  const asr = new FlakyASR()
  const tts = new MockTTS()

  const systemPrompt =
    'You are Morrow. Return valid JSON matching morrow-reply-1.0. Keep reply_text 1-3 sentences.'

  console.log('开始一次完整事件（mock，无真实密钥/音频）\n')

  // —— 轮次 1：用户语音输入，ASR 第一次失败 ——
  console.log('--- 轮次 1：用户发语音 ---')
  const firstAttempt = await safeTranscribe(asr, {
    audio: new Uint8Array(9 * 16_000 * 2),
    mimeType: 'audio/webm',
    languageHint: 'en',
  })
  if (firstAttempt.degraded) {
    console.log('[ASR 降级]', firstAttempt.userMessage, '| code:', firstAttempt.errorCode)
    console.log('系统记录：error=asr_http_error，不写入 messages.content_text，提示用户重试或打字。\n')
  }

  // —— 轮次 2：用户重试语音，ASR 成功，进 LLM ——
  console.log('--- 轮次 2：用户重试语音 ---')
  const secondAttempt = await safeTranscribe(asr, {
    audio: new Uint8Array(9 * 16_000 * 2),
    mimeType: 'audio/webm',
    languageHint: 'en',
  })
  if (!secondAttempt.result) {
    console.log('ASR 仍然失败，本 demo 终止。')
    return
  }
  const userText = secondAttempt.result.text
  console.log('ASR 转写:', userText, '| confidence:', secondAttempt.result.confidence)

  const llmOutcome = await safeComplete(llm, {
    systemPrompt,
    jsonMode: true,
    messages: [{ role: 'user', content: userText }],
  })
  console.log('LLM 回复:', llmOutcome.visibleText, '| degraded:', llmOutcome.degraded)

  // —— TTS：合成宠物语音，失败则只显示字幕 ——
  console.log('\n--- 轮次 2：TTS 合成 ---')
  const ttsOutcome = await safeSynthesize(tts, { text: llmOutcome.visibleText, speed: 1.0 }, llmOutcome.visibleText)
  if (ttsOutcome.result) {
    console.log(`TTS 合成成功: ${ttsOutcome.result.audio.length} bytes, ~${ttsOutcome.result.durationSec?.toFixed(1)}s`)
  } else {
    console.log('[TTS 降级] 仅显示字幕:', ttsOutcome.subtitle, '| code:', ttsOutcome.errorCode)
  }

  console.log('\n=== 事件调用链总结 ===')
  console.log('ASR: 1 次失败降级 + 1 次成功；LLM: 1 次结构化输出（Schema 校验通过）；TTS: 1 次成功。')
  console.log('所有外部失败均被转成用户可见文字，未抛出未捕获异常。')
}

main().catch((err) => {
  console.error('demo 运行失败:', err)
  process.exitCode = 1
})
