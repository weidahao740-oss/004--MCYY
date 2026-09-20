import { createHash } from 'node:crypto'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { QwenASR } from '../asr/qwen.js'

interface TestRow {
  file: string
  reference: string
  transcript: string
  latencySec: number
  durationSec: number | null
  exactNormalized: boolean
  wordErrors: number
  referenceWords: number
  wer: number
  sha256: string
}

const here = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(here, '../../../../..')
const voiceTestDir = path.join(projectRoot, 'voice-test')
const samplesDir = path.join(voiceTestDir, 'samples')
const transcriptPath = path.join(voiceTestDir, '录音原稿.txt')
const outputPath = path.join(voiceTestDir, 'qwen-asr-results.json')

const references = parseReferences(await readFile(transcriptPath, 'utf8'))
const files = (await readdir(samplesDir)).filter((name) => /^asr_\d+\.wav$/i.test(name)).sort()
const adapter = new QwenASR()
const results: TestRow[] = []

for (const file of files) {
  const audio = new Uint8Array(await readFile(path.join(samplesDir, file)))
  const startedAt = performance.now()
  const result = await adapter.transcribe({ audio, mimeType: 'audio/wav', languageHint: 'en' })
  const reference = references.get(file) ?? ''
  const referenceWords = normalize(reference)
  const transcriptWords = normalize(result.text)
  const wordErrors = levenshtein(referenceWords, transcriptWords)

  const row: TestRow = {
    file,
    reference,
    transcript: result.text,
    latencySec: Number(((performance.now() - startedAt) / 1000).toFixed(3)),
    durationSec: result.durationSec ?? null,
    exactNormalized: wordErrors === 0,
    wordErrors,
    referenceWords: referenceWords.length,
    wer: Number((wordErrors / Math.max(1, referenceWords.length)).toFixed(4)),
    sha256: createHash('sha256').update(audio).digest('hex'),
  }
  results.push(row)
  console.log(`${file}: ${row.exactNormalized ? 'PASS' : 'CHECK'} · WER=${row.wer} · ${row.latencySec}s`)
}

const latencies = results.map((item) => item.latencySec).sort((a, b) => a - b)
const summary = {
  testedAt: new Date().toISOString(),
  provider: adapter.provider,
  model: adapter.model,
  sampleCount: results.length,
  successCount: results.length,
  exactNormalizedCount: results.filter((item) => item.exactNormalized).length,
  totalReferenceWords: results.reduce((sum, item) => sum + item.referenceWords, 0),
  totalWordErrors: results.reduce((sum, item) => sum + item.wordErrors, 0),
  overallWer: Number(
    (
      results.reduce((sum, item) => sum + item.wordErrors, 0) /
      Math.max(1, results.reduce((sum, item) => sum + item.referenceWords, 0))
    ).toFixed(4),
  ),
  latencySec: {
    min: latencies[0] ?? null,
    median: quantile(latencies, 0.5),
    mean: latencies.length ? Number((latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(3)) : null,
    p95: quantile(latencies, 0.95),
    max: latencies.at(-1) ?? null,
  },
}

await writeFile(
  outputPath,
  `${JSON.stringify({ summary, results }, null, 2)}\n`,
  'utf8',
)
console.log(`结果已写入 ${outputPath}`)

function parseReferences(source: string): Map<string, string> {
  return new Map(
    source
      .split(/\r?\n/)
      .filter((line) => line.includes('|'))
      .map((line) => {
        const [file, ...rest] = line.split('|')
        return [file.trim(), rest.join('|').trim()]
      }),
  )
}

function normalize(source: string): string[] {
  return source
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .match(/[a-z0-9]+(?:'[a-z]+)?/g) ?? []
}

function levenshtein(a: string[], b: string[]): number {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index)
  for (let i = 0; i < a.length; i += 1) {
    const current = [i + 1]
    for (let j = 0; j < b.length; j += 1) {
      current.push(Math.min(current[j] + 1, previous[j + 1] + 1, previous[j] + Number(a[i] !== b[j])))
    }
    previous = current
  }
  return previous[b.length]
}

function quantile(values: number[], q: number): number | null {
  if (values.length === 0) return null
  const position = (values.length - 1) * q
  const lower = Math.floor(position)
  const upper = Math.ceil(position)
  const value = values[lower] + (values[upper] - values[lower]) * (position - lower)
  return Number(value.toFixed(3))
}
