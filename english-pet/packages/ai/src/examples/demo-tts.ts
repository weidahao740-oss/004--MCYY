/**
 * demo-tts.ts — 用 Mock TTS 模拟语音合成，展示语速参数、WAV 落盘与失败降级。
 * 运行：npx tsx src/examples/demo-tts.ts
 */
import { writeFileSync } from 'node:fs'
import { MockTTS, safeSynthesize, AdapterError } from '../index.js'
import type { TTSAdapter, TTSRequest, TTSResult } from '../index.js'

/** 一个故意失败的 TTS 适配器，用于演示降级路径。 */
class BrokenTTS implements TTSAdapter {
  readonly provider = 'broken-demo'
  async synthesize(_req: TTSRequest): Promise<TTSResult> {
    throw new AdapterError('tts_http_error', this.provider, '模拟供应商 500 错误（演示用）')
  }
}

async function main(): Promise<void> {
  const tts = new MockTTS()
  const text = 'Quiet places are easier to think in. Do you often work this late?'

  console.log('=== [1] 正常合成（speed=1.0 vs speed=1.3）===')
  const normal = await tts.synthesize({ text, speed: 1.0, voice: 'morrow-soft' })
  const fast = await tts.synthesize({ text, speed: 1.3, voice: 'morrow-soft' })
  console.log(`speed=1.0: duration≈${normal.durationSec?.toFixed(1)}s, ${normal.audio.length} bytes, ${normal.mimeType}`)
  console.log(`speed=1.3: duration≈${fast.durationSec?.toFixed(1)}s, ${fast.audio.length} bytes`)

  const outPath = new URL('../_fixtures/mock-morrow-voice.wav', import.meta.url)
  await import('node:fs/promises').then((fs) => fs.mkdir(new URL('../_fixtures/', import.meta.url), { recursive: true }))
  writeFileSync(outPath, normal.audio)
  console.log('已写出静音 WAV（占位音频）:', outPath.pathname.replace(/^\//, ''))

  console.log('\n=== [2] TTS 失败降级（字幕仍显示，只丢声音）===')
  const broken = new BrokenTTS()
  const safe = await safeSynthesize(broken, { text, speed: 1.0 }, text)
  console.log('degraded  :', safe.degraded, '| errorCode:', safe.errorCode)
  console.log('字幕照常  :', safe.subtitle)
  console.log('→ 用户看到文字，听不到声音；对话不中断。')
}

main().catch((err) => {
  console.error('demo 运行失败:', err)
  process.exitCode = 1
})
