/**
 * demo-asr.ts — 用 Mock ASR 模拟语音转写，展示"可编辑转写 + 置信度"与低置信度提示。
 * 运行：npx tsx src/examples/demo-asr.ts
 */
import { MockASR, safeTranscribe } from '../index.js'

async function main(): Promise<void> {
  const asr = new MockASR()

  // 模拟客户端上传的一段"音频"（这里只是伪字节，Mock 用其长度选结果）。
  const fakeAudio = new Uint8Array(10 * 16_000 * 2) // 约 10 秒

  console.log('=== [1] 三次 mock 转写（模拟三段用户语音）===')
  for (let i = 0; i < 3; i++) {
    const slice = fakeAudio.slice(0, fakeAudio.length / (i + 1))
    const out = await safeTranscribe(asr, {
      audio: slice,
      mimeType: 'audio/webm',
      languageHint: 'en',
    })
    if (!out.result) {
      console.log(`语音 ${i + 1}: 降级 →`, out.userMessage, '| code:', out.errorCode)
      continue
    }
    console.log(
      `语音 ${i + 1}: text="${out.result.text}" | confidence=${out.result.confidence} | duration=${out.result.durationSec}s`,
    )
  }

  console.log('\n=== [2] 低置信度（<0.6）时的产品行为 ===')
  const lowConf = fakeAudio.slice(0, fakeAudio.length % 3 === 0 ? 1 : fakeAudio.length)
  const out = await asr.transcribe({ audio: lowConf, mimeType: 'audio/webm', languageHint: 'en' })
  const threshold = 0.6
  if (out.confidence !== null && out.confidence < threshold) {
    console.log(`置信度 ${out.confidence} < ${threshold}：模型侧应走 needs_clarification=true + suggested_recovery='confirm_asr'`)
    console.log('UI 提示示例: "I heard: \u201c' + out.text + '\u201d — did I get that right? (editable below)')
  } else {
    console.log(`置信度 ${out.confidence} 高于阈值，可直接进入 LLM。`)
  }

  console.log('\n=== [3] 用户可编辑转写：修改版回传 ===')
  const userEdited = out.text.replace('five', 'six') // 模拟用户手动改了一个词
  console.log('原始转写 :', out.text)
  console.log('用户修改 :', userEdited)
  console.log('→ 回传 LLM 的必须是用户修改版，原始转写只作展示。')
}

main().catch((err) => {
  console.error('demo 运行失败:', err)
  process.exitCode = 1
})
