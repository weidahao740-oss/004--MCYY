import { serve } from '@hono/node-server'
import { existsSync } from 'node:fs'
import { loadEnvFile } from 'node:process'
import { fileURLToPath } from 'node:url'
import {
  completeConversationRequestSchema,
  eventActionRequestSchema,
  firstDayActionRequestSchema,
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

const envPath = fileURLToPath(new URL('../../../.env', import.meta.url))
if (existsSync(envPath)) loadEnvFile(envPath)

const app = new Hono()
const accountStore = new MemoryAccountStore()
const memoryStore = new MemoryMemoryStore()
const feedbackStore = new MemoryFeedbackStore(memoryStore)
const resurfacingStore = new MemoryResurfacingStore(memoryStore)
const journalStore = new MemoryJournalStore(memoryStore)
const conversationStore = new MemoryConversationStore(memoryStore, feedbackStore)
const eventEngine = new MemoryEventEngine(memoryStore, journalStore, feedbackStore, resurfacingStore)
const firstDayStore = new MemoryFirstDayStore(accountStore, memoryStore, journalStore, eventEngine)
// 开发环境未配置百炼密钥时保留 Mock；服务端配置 DASHSCOPE_API_KEY 后启用真实 qwen3-asr-flash。
const asr = process.env.DASHSCOPE_API_KEY ? new QwenASR() : new MockASR()
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
    // 待 N1 接入：当前为空串占位，正式端需回带 fixed-content 规则集与 Schema 版本。
    rulesetVersion: '',
    schemaVersion: '',
  })
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
  return me ? context.json({ entries: journalStore.list(me.user.id), persistence: 'memory' as const }) : errorResponse(context, 'unauthorized', 401)
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
