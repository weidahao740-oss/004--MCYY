/**
 * 生产预制音频绑定加载器（Phase 4）。
 *
 * 权威绑定来自离线制作产物：`voice-test/morrow-production/manifest.json`。
 * 运行时只播审核通过的正常语速文件，不实时调用 TTS。
 * - 每条台词恰好一个正常语速文件（rate=1.0, pitch=1.0），无 variant/slow。
 * - ready 才返回可访问 fileRef；planned/retired 不返回可播地址，客户端降级文字+译文。
 * - 两条运行时组合台词（brw_prompt_line / brc_prompt_line）含注入变量，登记为 planned。
 *
 * 密钥不进入本模块；本模块只读清单与波形，不调用任何外部服务。
 */
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve, sep } from 'node:path'

export type ProductionAudioStatus = 'planned' | 'ready' | 'retired'

export interface ProductionAudioBinding {
  audioId: string
  lineId: string
  contentId: string
  textVersion: string
  translationVersion: string
  voiceProfileId: string
  /** 存储键 / 开发态 URL 路径，形如 tts/<chapter>/<event>/<line>/1.0.0/audio.wav */
  fileRef: string | null
  checksumSha256: string | null
  durationSeconds: number | null
  activeRmsDbfs: number | null
  peakDbfs: number | null
  status: ProductionAudioStatus
  sourceModel: string
  reason?: string
}

interface ManifestRecord {
  audioId: string
  lineId: string
  contentId: string
  textVersion?: string
  translationVersion?: string
  voiceProfileId?: string
  fileRef?: string
  checksumSha256?: string | null
  durationSeconds?: number
  activeRmsDbfs?: number
  peakDbfs?: number
  status: ProductionAudioStatus
  sourceModel?: string
  reason?: string
}

interface ProductionManifestFile {
  version: string
  voiceProfileId: string
  sourceModel: string
  rate: number
  pitch: number
  total: number
  included: ManifestRecord[]
  excluded: ManifestRecord[]
}

const VOICE_PROFILE = 'morrow_voice_v1'
const SOURCE_MODEL = 'qwen-audio-3.0-tts-flash'

function defaultManifestPath(): string {
  const fromEnv = process.env.PRODUCTION_AUDIO_MANIFEST
  if (fromEnv && existsSync(fromEnv)) return fromEnv
  let dir = dirname(fileURLToPath(new URL(import.meta.url)))
  for (let depth = 0; depth < 8; depth += 1) {
    const candidate = join(dir, 'voice-test', 'morrow-production', 'manifest.json')
    if (existsSync(candidate)) return candidate
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  throw new Error('production audio manifest not found; set PRODUCTION_AUDIO_MANIFEST')
}

function normalize(record: ManifestRecord): ProductionAudioBinding {
  const ready = record.status === 'ready'
  return {
    audioId: record.audioId,
    lineId: record.lineId,
    contentId: record.contentId,
    textVersion: record.textVersion ?? '1.0.0',
    translationVersion: record.translationVersion ?? '1.0.0',
    voiceProfileId: record.voiceProfileId ?? VOICE_PROFILE,
    fileRef: ready && record.fileRef ? record.fileRef : null,
    checksumSha256: ready ? (record.checksumSha256 ?? null) : null,
    durationSeconds: ready ? (record.durationSeconds ?? null) : null,
    activeRmsDbfs: ready ? (record.activeRmsDbfs ?? null) : null,
    peakDbfs: ready ? (record.peakDbfs ?? null) : null,
    status: record.status,
    sourceModel: record.sourceModel ?? SOURCE_MODEL,
    reason: record.reason,
  }
}

let cache: Map<string, ProductionAudioBinding> | null = null
let manifestRoot: string | null = null

function load(): Map<string, ProductionAudioBinding> {
  if (cache) return cache
  const manifestPath = defaultManifestPath()
  manifestRoot = resolve(dirname(manifestPath))
  const raw = JSON.parse(readFileSync(manifestPath, 'utf-8')) as ProductionManifestFile
  const map = new Map<string, ProductionAudioBinding>()
  for (const record of [...raw.included, ...raw.excluded]) {
    map.set(record.audioId, normalize(record))
  }
  cache = map
  return map
}

/** 按 audioId 解析绑定；未登记返回 null。 */
export function getProductionAudioBinding(audioId: string): ProductionAudioBinding | null {
  return load().get(audioId) ?? null
}

/** 全量绑定（N1 可按需引用）。 */
export function listProductionAudioBindings(): ProductionAudioBinding[] {
  return [...load().values()]
}

/** 生产音频根目录（含 tts/），供开发态静态文件服务使用。 */
export function productionAudioRoot(): string {
  load()
  return manifestRoot ?? ''
}

/**
 * 把 fileRef（tts/...）解析为磁盘绝对路径，并阻止路径穿越。
 * 仅用于服务端开发态静态返回；正式端由对象存储 + CDN 提供。
 */
export function resolveProductionAudioFile(fileRef: string): string | null {
  const root = productionAudioRoot()
  if (!root) return null
  const safe = fileRef.split('/').filter((part) => part && part !== '..')
  const abs = resolve(root, safe.join(sep))
  const rootWithSep = root.endsWith(sep) ? root : root + sep
  if (!abs.startsWith(rootWithSep)) return null
  return existsSync(abs) ? abs : null
}
