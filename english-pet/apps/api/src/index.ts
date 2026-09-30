import { serve } from '@hono/node-server'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { loadEnvFile } from 'node:process'
import { fileURLToPath } from 'node:url'
import {
  completeConversationRequestSchema,
  eventActionRequestSchema,
  firstDayActionRequestSchema,
  fixedContentIntentPreviewRequestSchema,
  fixedEventAdvanceRequestSchema,
  fixedEventStartRequestSchema,
  journalActionRequestSchema,
  loginRequestSchema,
  memoryActionRequestSchema,
  petActionRequestSchema,
  registerRequestSchema,
  resurfacingRecordRequestSchema,
  sendMessageRequestSchema,
  startEventRequestSchema,
  synthesizeSpeechRequestSchema,
  transcribeAudioRequestSchema,
  updateSettingsRequestSchema,
} from '@english-pet/contracts'
import { MockASR, MockTTS, QwenASR, safeSynthesize, safeTranscribe } from '@english-pet/ai'
import {
  fixedContentV1,
  getFixedContentEvent,
  getProductionAudioBinding,
  previewFixedContentIntent,
  resolveProductionAudioFile,
} from '@english-pet/domain'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { requestId } from 'hono/request-id'
import { errorResponse, getBearerToken } from './http.js'
import { logger } from './logger.js'
import { MemoryAccountStore } from './memory-account-store.js'
import { MemoryConversationStore } from './memory-conversation-store.js'
import { MemoryEventEngine } from './memory-event-engine.js'
import { MemoryFeedbackStore } from './memory-feedback-store.js'
import { MemoryFirstDayStore } from './memory-first-day-store.js'
import { MemoryJournalStore } from './memory-journal-store.js'
import { MemoryMemoryStore } from './memory-memory-store.js'
import { MemoryResurfacingStore } from './memory-resurfacing-store.js'
import { resolveDbPath } from './sqlite-db.js'
import { SqliteAccountStore } from './sqlite-account-store.js'
import { SqliteConversationStore } from './sqlite-conversation-store.js'
import { SqliteEventEngine } from './sqlite-event-engine.js'
import { SqliteFeedbackStore } from './sqlite-feedback-store.js'
import { SqliteFirstDayStore } from './sqlite-first-day-store.js'
import { SqliteFixedEventEngine } from './sqlite-fixed-event-engine.js'
import { SqliteJournalStore } from './sqlite-journal-store.js'
import { SqliteMemoryStore } from './sqlite-memory-store.js'
import { SqliteResurfacingStore } from './sqlite-resurfacing-store.js'

const envPath = fileURLToPath(new URL('../../../.env', import.meta.url))
if (existsSync(envPath)) loadEnvFile(envPath)

const app = new Hono()

// 存储驱动选择：STORE_DRIVER=sqlite（默认，本地 SQLite 持久化）或 memory（干净测试）。
// 组合图与依赖关系与原内存版完全一致，仅替换实现。
const storeDriver = (process.env.STORE_DRIVER ?? 'sqlite').trim().toLowerCase()
const persistence: 'memory' | 'sqlite' = storeDriver === 'memory' ? 'memory' : 'sqlite'
logger.info({ storeDriver, persistence, sqlitePath: persistence === 'sqlite' ? resolveDbPath() : null }, 'store driver')

let accountStore: MemoryAccountStore | SqliteAccountStore
let memoryStore: MemoryMemoryStore | SqliteMemoryStore
let feedbackStore: MemoryFeedbackStore | SqliteFeedbackStore
let resurfacingStore: MemoryResurfacingStore | SqliteResurfacingStore
let journalStore: MemoryJournalStore | SqliteJournalStore
let conversationStore: MemoryConversationStore | SqliteConversationStore
let eventEngine: MemoryEventEngine | SqliteEventEngine
let firstDayStore: MemoryFirstDayStore | SqliteFirstDayStore

if (storeDriver === 'memory') {
  const a = new MemoryAccountStore()
  const m = new MemoryMemoryStore()
  const f = new MemoryFeedbackStore(m)
  const r = new MemoryResurfacingStore(m)
  const j = new MemoryJournalStore(m)
  const c = new MemoryConversationStore(m, f)
  const e = new MemoryEventEngine(m, j, f, r)
  const fd = new MemoryFirstDayStore(a, m, j, e)
  accountStore = a
  memoryStore = m
  feedbackStore = f
  resurfacingStore = r
  journalStore = j
  conversationStore = c
  eventEngine = e
  firstDayStore = fd
} else {
  const a = new SqliteAccountStore()
  const m = new SqliteMemoryStore()
  const f = new SqliteFeedbackStore(m)
  const r = new SqliteResurfacingStore(m)
  const j = new SqliteJournalStore(m)
  const c = new SqliteConversationStore(m, f)
  const e = new SqliteEventEngine(m, j, f, r)
  const fd = new SqliteFirstDayStore(a, m, j, e)
  accountStore = a
  memoryStore = m
  feedbackStore = f
  resurfacingStore = r
  journalStore = j
  conversationStore = c
  eventEngine = e
  firstDayStore = fd
}

// 固定内容事件引擎：纯函数意图匹配器 + SQLite 状态推进。固定走本地 SQLite（openDatabase），不区分 STORE_DRIVER。
const fixedEventEngine = new SqliteFixedEventEngine({ memoryStore, journalStore })

// ASR 显式驱动：AI_ASR_PROVIDER=qwen 才走真实百炼 qwen3-asr-flash；否则一律 MockASR。
// 不再因 DASHSCOPE_API_KEY 隐式走网络。TTS 保持 MockTTS。
const asr = process.env.AI_ASR_PROVIDER === 'qwen' ? new QwenASR() : new MockASR()
const tts = new MockTTS()

const allowedOrigins = (process.env.WEB_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use('*', requestId())
app.use(
  '*',
  cors({
    origin: (origin) => allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
    allowHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
)
app.use('*', async (context, next) => {
  const startedAt = performance.now()
  await next()
  logger.info({
    requestId: context.get('requestId'),
    method: context.req.method,
    path: context.req.path,
    status: context.res.status,
    durationMs: Math.round(performance.now() - startedAt),
  })
})

app.get('/health', (context) => {
  return context.json({
    ok: true,
    service: 'english-pet-api',
    environment: process.env.APP_ENV ?? 'development',
    // N1/N2 已接入 fixed-content 规则集：回带规则集 id 与 schema 版本。
    rulesetVersion: fixedContentV1.id,
    schemaVersion: fixedContentV1.schemaVersion,
  })
})

// N1：下发 fixed-content 规则集本体（与其它 /v1 一致，需 Bearer token）。
app.get('/v1/fixed-content/ruleset', (context) => {
  const token = getBearerToken(context.req.header('Authorization'))
  const me = token ? accountStore.me(token) : null
  if (!me) return errorResponse(context, 'unauthorized', 401)
  return context.json(fixedContentV1)
})

app.post('/v1/auth/guest', (context) => {
  return context.json(accountStore.createGuest(), 201)
})

app.post('/v1/auth/register', async (context) => {
  const body = await context.req.json().catch(() => null)
  const parsed = registerRequestSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse(context, 'bad_request', 400, parsed.error.flatten())
  }

  const token = getBearerToken(context.req.header('Authorization')) ?? undefined
  try {
    return context.json(accountStore.register(parsed.data, token), 201)
  } catch (error) {
    if (error instanceof Error && error.message === 'email_exists') {
      return errorResponse(context, 'email_exists', 409)
    }
    throw error
  }
})

app.post('/v1/auth/session', async (context) => {
  const body = await context.req.json().catch(() => null)
  const parsed = loginRequestSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse(context, 'bad_request', 400, parsed.error.flatten())
  }

  try {
    return context.json(accountStore.login(parsed.data))
  } catch (error) {
    if (error instanceof Error && error.message === 'invalid_credentials') {
      return errorResponse(context, 'invalid_credentials', 401)
    }
    throw error
  }
})

app.delete('/v1/auth/session', (context) => {
  const token = getBearerToken(context.req.header('Authorization'))
  if (!token) return errorResponse(context, 'unauthorized', 401)
  accountStore.signOut(token)
  return context.body(null, 204)
})

app.delete('/v1/me/account', (context) => {
  const token = getBearerToken(context.req.header('Authorization'))
  if (!token) return errorResponse(context, 'unauthorized', 401)
  const userId = accountStore.deleteAccount(token)
  if (!userId) return errorResponse(context, 'unauthorized', 401)
  firstDayStore.clearUser(userId)
  eventEngine.clearUser(userId)
  conversationStore.clearUser(userId)
  journalStore.clearUser(userId)
  resurfacingStore.clearUser(userId)
  memoryStore.clearUser(userId)
  fixedEventEngine.clearUser(userId)
  return context.body(null, 204)
})
app.get('/v1/me', (context) => {
  const token = getBearerToken(context.req.header('Authorization'))
  const me = token ? accountStore.me(token) : null
  return me ? context.json(me) : errorResponse(context, 'unauthorized', 401)
})

app.patch('/v1/me/settings', async (context) => {
  const token = getBearerToken(context.req.header('Authorization'))
  if (!token) return errorResponse(context, 'unauthorized', 401)

  const body = await context.req.json().catch(() => null)
  const parsed = updateSettingsRequestSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse(context, 'bad_request', 400, parsed.error.flatten())
  }

  const me = accountStore.updateSettings(token, parsed.data)
  return me ? context.json(me) : errorResponse(context, 'unauthorized', 401)
})

app.get('/v1/pet/home', (context) => {
  const token = getBearerToken(context.req.header('Authorization'))
  const home = token ? accountStore.getPetHome(token) : null
  return home ? context.json(home) : errorResponse(context, 'unauthorized', 401)
})

app.post('/v1/pet/actions', async (context) => {
  const token = getBearerToken(context.req.header('Authorization'))
  if (!token) return errorResponse(context, 'unauthorized', 401)
  const body = await context.req.json().catch(() => null)
  const parsed = petActionRequestSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse(context, 'bad_request', 400, parsed.error.flatten())
  }
  const home = accountStore.performPetAction(token, parsed.data.action)
  return home ? context.json(home) : errorResponse(context, 'unauthorized', 401)
})

app.get('/v1/journals', (context) => {
  const token = getBearerToken(context.req.header('Authorization'))
  const me = token ? accountStore.me(token) : null
  return me ? context.json({ entries: journalStore.list(me.user.id), persistence }) : errorResponse(context, 'unauthorized', 401)
})

app.post('/v1/journals/:id/actions', async (context) => {
  const token = getBearerToken(context.req.header('Authorization'))
  const me = token ? accountStore.me(token) : null
  if (!me) return errorResponse(context, 'unauthorized', 401)
  const body = await context.req.json().catch(() => null)
  const parsed = journalActionRequestSchema.safeParse(body)
  if (!parsed.success) return errorResponse(context, 'bad_request', 400, parsed.error.flatten())
  try {
    return context.json(journalStore.act(me.user.id, context.req.param('id'), parsed.data))
  } catch (error) {
    if (!(error instanceof Error)) throw error
    if (error.message === 'journal_not_found') return errorResponse(context, 'journal_not_found', 404)
    if (error.message === 'journal_version_conflict') return errorResponse(context, 'journal_version_conflict', 409)
    if (error.message === 'journal_action_not_allowed') return errorResponse(context, 'journal_action_not_allowed', 409)
    if (error.message === 'journal_memory_not_confirmed') return errorResponse(context, 'journal_memory_not_confirmed', 409)
    if (error.message === 'memory_version_conflict') return errorResponse(context, 'memory_version_conflict', 409)
    if (error.message === 'memory_restricted') return errorResponse(context, 'memory_restricted', 409)
    throw error
  }
})

app.get('/v1/memories', (context) => {
  const token = getBearerToken(context.req.header('Authorization'))
  const me = token ? accountStore.me(token) : null
  return me ? context.json(memoryStore.list(me.user.id, me.settings.memoryEnabled)) : errorResponse(context, 'unauthorized', 401)
})

app.post('/v1/memories/:id/actions', async (context) => {
  const token = getBearerToken(context.req.header('Authorization'))
  const me = token ? accountStore.me(token) : null
  if (!me) return errorResponse(context, 'unauthorized', 401)
  const body = await context.req.json().catch(() => null)
  const parsed = memoryActionRequestSchema.safeParse(body)
  if (!parsed.success) return errorResponse(context, 'bad_request', 400, parsed.error.flatten())
  try {
    return context.json(memoryStore.act(me.user.id, context.req.param('id'), parsed.data))
  } catch (error) {
    if (!(error instanceof Error)) throw error
    if (error.message === 'memory_not_found') return errorResponse(context, 'memory_not_found', 404)
    if (error.message === 'memory_version_conflict') return errorResponse(context, 'memory_version_conflict', 409)
    if (error.message === 'memory_action_not_allowed') return errorResponse(context, 'memory_action_not_allowed', 409)
    if (error.message === 'memory_restricted') return errorResponse(context, 'memory_restricted', 409)
    throw error
  }
})

app.get('/v1/first-day', (context) => {
  const token = getBearerToken(context.req.header('Authorization'))
  const me = token ? accountStore.me(token) : null
  return me ? context.json(firstDayStore.get(me.user.id)) : errorResponse(context, 'unauthorized', 401)
})

app.post('/v1/first-day/actions', async (context) => {
  const token = getBearerToken(context.req.header('Authorization'))
  const me = token ? accountStore.me(token) : null
  if (!me) return errorResponse(context, 'unauthorized', 401)
  const body = await context.req.json().catch(() => null)
  const parsed = firstDayActionRequestSchema.safeParse(body)
  if (!parsed.success) return errorResponse(context, 'bad_request', 400, parsed.error.flatten())
  try {
    return context.json(firstDayStore.act(me.user.id, parsed.data))
  } catch (error) {
    if (error instanceof Error && error.message === 'first_day_action_not_allowed') return errorResponse(context, 'first_day_action_not_allowed', 409)
    if (error instanceof Error && error.message === 'first_day_memory_review_incomplete') return errorResponse(context, 'first_day_memory_review_incomplete', 409)
    throw error
  }
})
app.get('/v1/events', (context) => {
  const token = getBearerToken(context.req.header('Authorization'))
  const me = token ? accountStore.me(token) : null
  // 待 N1 接入 fixed-content 规则集并回带 schemaVersion/personaVersion
  return me ? context.json({ rulesetId: 'events-v1.0.0', events: eventEngine.catalog(me.user.id, me.pet.relationshipStage) }) : errorResponse(context, 'unauthorized', 401)
})

app.get('/v1/events/current', (context) => {
  const token = getBearerToken(context.req.header('Authorization'))
  const me = token ? accountStore.me(token) : null
  return me ? context.json({ instance: eventEngine.current(me.user.id) }) : errorResponse(context, 'unauthorized', 401)
})

app.post('/v1/events/start', async (context) => {
  const token = getBearerToken(context.req.header('Authorization'))
  const me = token ? accountStore.me(token) : null
  if (!me) return errorResponse(context, 'unauthorized', 401)
  const body = await context.req.json().catch(() => null)
  const parsed = startEventRequestSchema.safeParse(body)
  if (!parsed.success) return errorResponse(context, 'bad_request', 400, parsed.error.flatten())
  try {
    return context.json(eventEngine.start(me.user.id, parsed.data, me.pet.relationshipStage), 201)
  } catch (error) {
    if (error instanceof Error && error.message === 'event_locked') return errorResponse(context, 'event_locked', 409)
    throw error
  }
})

app.post('/v1/events/:id/resurfacing', async (context) => {
  const token = getBearerToken(context.req.header('Authorization'))
  const me = token ? accountStore.me(token) : null
  if (!me) return errorResponse(context, 'unauthorized', 401)
  const body = await context.req.json().catch(() => null)
  const parsed = resurfacingRecordRequestSchema.safeParse(body)
  if (!parsed.success) return errorResponse(context, 'bad_request', 400, parsed.error.flatten())
  try {
    return context.json(eventEngine.recordResurfacing(me.user.id, context.req.param('id'), parsed.data.result))
  } catch (error) {
    if (error instanceof Error && error.message === 'event_not_found') return errorResponse(context, 'event_not_found', 404)
    if (error instanceof Error && error.message === 'resurfacing_not_available') return errorResponse(context, 'resurfacing_not_available', 409)
    throw error
  }
})
app.post('/v1/events/:id/actions', async (context) => {
  const token = getBearerToken(context.req.header('Authorization'))
  const me = token ? accountStore.me(token) : null
  if (!me) return errorResponse(context, 'unauthorized', 401)
  const body = await context.req.json().catch(() => null)
  const parsed = eventActionRequestSchema.safeParse(body)
  if (!parsed.success) return errorResponse(context, 'bad_request', 400, parsed.error.flatten())
  try {
    return context.json(eventEngine.act(me.user.id, context.req.param('id'), parsed.data))
  } catch (error) {
    if (error instanceof Error && error.message === 'event_not_found') return errorResponse(context, 'event_not_found', 404)
    if (error instanceof Error && error.message === 'transition_not_allowed') return errorResponse(context, 'transition_not_allowed', 409)
    throw error
  }
})

// N2：确定性意图预览。纯预览，不推进事件状态、不写记忆。
app.post('/v1/events/:id/intents', async (context) => {
  const token = getBearerToken(context.req.header('Authorization'))
  const me = token ? accountStore.me(token) : null
  if (!me) return errorResponse(context, 'unauthorized', 401)
  const event = getFixedContentEvent(context.req.param('id'))
  if (!event) return errorResponse(context, 'event_not_found', 404)
  const body = await context.req.json().catch(() => null)
  const parsed = fixedContentIntentPreviewRequestSchema.safeParse(body)
  if (!parsed.success) return errorResponse(context, 'bad_request', 400, parsed.error.flatten())
  const result = previewFixedContentIntent({
    event,
    stateId: parsed.data.stateId,
    input: {
      inputMode: parsed.data.inputMode,
      text: parsed.data.text,
      choiceId: parsed.data.choiceId,
    },
    policy: fixedContentV1.matchingPolicy,
    fallbacks: fixedContentV1.fallbacks,
  })
  return context.json(result)
})

// ── 固定内容事件引擎（状态推进 + SQLite 落库）──
// 目录：返回两个出生事件的可用/已完成/锁定状态。
app.get('/v1/fixed-content/events', (context) => {
  const token = getBearerToken(context.req.header('Authorization'))
  const me = token ? accountStore.me(token) : null
  if (!me) return errorResponse(context, 'unauthorized', 401)
  return context.json({ events: fixedEventEngine.catalog(me.user.id) })
})

// 当前活动实例：无进行中事件时返回 { instance: null }。
app.get('/v1/fixed-content/events/current', (context) => {
  const token = getBearerToken(context.req.header('Authorization'))
  const me = token ? accountStore.me(token) : null
  if (!me) return errorResponse(context, 'unauthorized', 401)
  return context.json({ instance: fixedEventEngine.current(me.user.id) })
})

app.post('/v1/fixed-content/events/:eventId/start', async (context) => {
  const token = getBearerToken(context.req.header('Authorization'))
  const me = token ? accountStore.me(token) : null
  if (!me) return errorResponse(context, 'unauthorized', 401)
  const body = await context.req.json().catch(() => null)
  const parsed = fixedEventStartRequestSchema.safeParse(body)
  if (!parsed.success) return errorResponse(context, 'bad_request', 400, parsed.error.flatten())
  try {
    return context.json(fixedEventEngine.start(me.user.id, {
      eventId: context.req.param('eventId'),
      idempotencyKey: parsed.data.idempotencyKey,
    }), 201)
  } catch (error) {
    if (!(error instanceof Error)) throw error
    if (error.message === 'fixed_event_locked') return errorResponse(context, 'fixed_event_locked', 409)
    throw error
  }
})

app.post('/v1/fixed-content/events/:instanceId/advance', async (context) => {
  const token = getBearerToken(context.req.header('Authorization'))
  const me = token ? accountStore.me(token) : null
  if (!me) return errorResponse(context, 'unauthorized', 401)
  const body = await context.req.json().catch(() => null)
  const parsed = fixedEventAdvanceRequestSchema.safeParse(body)
  if (!parsed.success) return errorResponse(context, 'bad_request', 400, parsed.error.flatten())
  try {
    return context.json(fixedEventEngine.advance(me.user.id, context.req.param('instanceId'), {
      inputMode: parsed.data.inputMode,
      text: parsed.data.text,
      choiceId: parsed.data.choiceId,
      idempotencyKey: parsed.data.idempotencyKey,
    }))
  } catch (error) {
    if (!(error instanceof Error)) throw error
    if (error.message === 'fixed_event_not_found') return errorResponse(context, 'fixed_event_not_found', 404)
    if (error.message === 'fixed_no_active_event') return errorResponse(context, 'fixed_no_active_event', 409)
    throw error
  }
})

app.post('/v1/audio/transcriptions', async (context) => {
  const token = getBearerToken(context.req.header('Authorization'))
  if (!token || !accountStore.me(token)) return errorResponse(context, 'unauthorized', 401)
  const body = await context.req.json().catch(() => null)
  const parsed = transcribeAudioRequestSchema.safeParse(body)
  if (!parsed.success) return errorResponse(context, 'bad_request', 400, parsed.error.flatten())

  const audio = Uint8Array.from(Buffer.from(parsed.data.audioBase64, 'base64'))
  const outcome = await safeTranscribe(asr, {
    audio,
    mimeType: parsed.data.mimeType,
    languageHint: parsed.data.languageHint,
  })
  return context.json({
    provider: outcome.result?.provider ?? asr.provider,
    model: outcome.result?.model ?? asr.model,
    text: outcome.result?.text ?? '',
    confidence: outcome.result?.confidence ?? null,
    durationSec: outcome.result?.durationSec ?? null,
    editable: true as const,
    degraded: outcome.degraded,
    userMessage: outcome.userMessage,
  })
})

// N3：解析预制音频绑定。ready 返回版本绑定与可播 fileRef；planned/retired/未登记不返回可播地址，前端降级文字+译文。
app.get('/v1/audio/bindings/:audioId', (context) => {
  const token = getBearerToken(context.req.header('Authorization'))
  if (!token || !accountStore.me(token)) return errorResponse(context, 'unauthorized', 401)
  const binding = getProductionAudioBinding(context.req.param('audioId'))
  if (!binding) {
    return errorResponse(context, 'audio_not_found', 404)
  }
  if (binding.status !== 'ready' || !binding.fileRef) {
    return errorResponse(context, 'audio_not_ready', 404)
  }
  return context.json({
    audioId: binding.audioId,
    lineId: binding.lineId,
    contentId: binding.contentId,
    textVersion: binding.textVersion,
    translationVersion: binding.translationVersion,
    voiceProfileId: binding.voiceProfileId,
    fileRef: binding.fileRef,
    status: binding.status,
    checksumSha256: binding.checksumSha256,
    durationSeconds: binding.durationSeconds,
    sourceModel: binding.sourceModel,
  })
})

// 开发态：按 fileRef（tts/...）直接返回已审核 WAV；正式端由对象存储 + CDN 提供，此路由不暴露密钥。
app.get('/tts/*', async (context) => {
  const pathname = context.req.path.replace(/^\/tts\//, 'tts/')
  if (!pathname.endsWith('.wav')) return errorResponse(context, 'audio_not_found', 404)
  const file = resolveProductionAudioFile(pathname)
  if (!file) return errorResponse(context, 'audio_not_found', 404)
  const body = await readFile(file)
  return new Response(body, {
    headers: {
      'Content-Type': 'audio/wav',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
})

app.post('/v1/audio/speech', async (context) => {
  const token = getBearerToken(context.req.header('Authorization'))
  if (!token || !accountStore.me(token)) return errorResponse(context, 'unauthorized', 401)
  const body = await context.req.json().catch(() => null)
  const parsed = synthesizeSpeechRequestSchema.safeParse(body)
  if (!parsed.success) return errorResponse(context, 'bad_request', 400, parsed.error.flatten())

  const outcome = await safeSynthesize(
    tts,
    {
      text: parsed.data.text,
      speed: parsed.data.speed,
      voice: parsed.data.voice,
      format: parsed.data.format,
    },
    parsed.data.text,
  )
  return context.json({
    provider: outcome.result?.provider ?? tts.provider,
    voice: outcome.result?.voice ?? 'unavailable',
    mimeType: outcome.result?.mimeType ?? 'audio/wav',
    audioBase64: outcome.result ? Buffer.from(outcome.result.audio).toString('base64') : '',
    durationSec: outcome.result?.durationSec ?? null,
    subtitle: outcome.subtitle,
    degraded: outcome.degraded,
    errorCode: outcome.errorCode,
  })
})

app.post('/v1/conversations', (context) => {
  const token = getBearerToken(context.req.header('Authorization'))
  const me = token ? accountStore.me(token) : null
  return me ? context.json(conversationStore.getOrCreate(me.user.id), 201) : errorResponse(context, 'unauthorized', 401)
})

app.get('/v1/conversations/current', (context) => {
  const token = getBearerToken(context.req.header('Authorization'))
  const me = token ? accountStore.me(token) : null
  return me ? context.json(conversationStore.getOrCreate(me.user.id)) : errorResponse(context, 'unauthorized', 401)
})

app.post('/v1/conversations/:id/complete', async (context) => {
  const token = getBearerToken(context.req.header('Authorization'))
  const me = token ? accountStore.me(token) : null
  if (!me) return errorResponse(context, 'unauthorized', 401)
  const body = await context.req.json().catch(() => null)
  const parsed = completeConversationRequestSchema.safeParse(body)
  if (!parsed.success) return errorResponse(context, 'bad_request', 400, parsed.error.flatten())
  try {
    return context.json(conversationStore.complete(
      me.user.id,
      context.req.param('id'),
      me.settings.correctionPreference === 'only_when_blocking',
    ))
  } catch (error) {
    if (error instanceof Error && error.message === 'conversation_not_found') return errorResponse(context, 'conversation_not_found', 404)
    if (error instanceof Error && error.message === 'conversation_empty') return errorResponse(context, 'conversation_empty', 409)
    throw error
  }
})

// 此为 LLM 实验/测试端链路，正式端默认不挂载，见 API_MIGRATION #24-27 弃用清单。
app.post('/v1/conversations/:id/messages', async (context) => {
  const token = getBearerToken(context.req.header('Authorization'))
  const me = token ? accountStore.me(token) : null
  if (!me) return errorResponse(context, 'unauthorized', 401)
  const body = await context.req.json().catch(() => null)
  const parsed = sendMessageRequestSchema.safeParse(body)
  if (!parsed.success) return errorResponse(context, 'bad_request', 400, parsed.error.flatten())

  const abortController = new AbortController()
  const timeout = setTimeout(() => abortController.abort(), 12_000)
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of conversationStore.send(
          me.user.id,
          me,
          context.req.param('id'),
          parsed.data,
          abortController.signal,
        )) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
        }
      } catch (error) {
        logger.error({ requestId: context.get('requestId'), error: String(error) })
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', code: 'reply_failed', message: '连接暂时安静了，请稍后再试。', retryable: true })}\n\n`))
      } finally {
        clearTimeout(timeout)
        controller.close()
      }
    },
    cancel() {
      clearTimeout(timeout)
      abortController.abort()
    },
  })
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
})

app.notFound((context) => errorResponse(context, 'bad_request', 404))
app.onError((error, context) => {
  logger.error({ requestId: context.get('requestId'), error: String(error) })
  return errorResponse(context, 'internal_error', 500)
})

const port = Number(process.env.PORT ?? 8787)
serve({ fetch: app.fetch, port })
logger.info({ port }, 'API listening')
