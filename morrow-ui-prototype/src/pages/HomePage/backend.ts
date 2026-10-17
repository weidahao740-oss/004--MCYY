import type { FixedEventInstanceView, FixedEventRecommendationView, FixedEventCatalogItem, FixedEventTeachingView, FixedEventTeachingRequest } from '../../../../english-pet/packages/contracts/src/fixed-content'
import type { TranscribeAudioResponse } from '../../../../english-pet/packages/contracts/src/voice'

export type { FixedEventInstanceView, FixedEventRecommendationView, FixedEventCatalogItem, FixedEventTeachingView, TranscribeAudioResponse }
export const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
const SESSION_KEY = `morrow:s09:session:${API_BASE || 'same-origin'}`
const PENDING_KEY = `${SESSION_KEY}:pending`
let sessionRequest: Promise<string> | null = null
const commandsInFlight = new Map<string, Promise<unknown>>()

export class ApiError extends Error {
  constructor(message: string, readonly status: number | null = null, readonly code?: string) {
    super(message)
    this.name = 'ApiError'
  }
}

export interface SpeechConfirmation {
  accepted: boolean
  messageZh?: string
}

const messages: Record<string, string> = {
  unauthorized: '当前登录已失效。请先恢复原账号，避免丢失学习进度。',
  fixed_event_locked: '现在还不能开始这件事。请回房间刷新当前安排。',
  fixed_asr_state_mismatch: '这一步已经变化。请回房间重新接着学。',
  fixed_event_not_found: '当前事件已经变化。请回房间重新读取进度。',
  fixed_event_paused: '这件事已经暂停，请先继续。',
  fixed_extra_event_unavailable: '今天暂时不能再增加新事件，可以先陪墨洛待一会儿。',
}

export async function request<T>(path: string, token = '', body?: unknown, signal?: AbortSignal): Promise<T> {
  const controller = new AbortController()
  const cancel = () => controller.abort()
  if (signal?.aborted) cancel()
  else signal?.addEventListener('abort', cancel, { once: true })
  let timedOut = false
  const timer = setTimeout(() => { timedOut = true; controller.abort() }, path === '/v1/audio/transcriptions' ? 90_000 : 30_000)
  try {
    const response = await fetch(`${API_BASE}${path}`, { method: body === undefined ? 'GET' : 'POST',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: controller.signal })
    const data = await response.json().catch(error => {
      if (controller.signal.aborted) throw error
      return null
    })
    if (!response.ok) {
      const value = data?.error?.code ?? data?.code
      const code = typeof value === 'string' ? value : undefined
      throw new ApiError((code && messages[code]) || `服务暂时没有处理成功（${response.status}），请重试或稍后继续。`, response.status, code)
    }
    if (data === null) throw new ApiError('没有完整收到处理结果。可以重试，或回房间重新读取进度。')
    return data as T
  } catch (error) {
    if (signal?.aborted) throw error
    if (timedOut) throw new ApiError('等待服务的时间有点长。可以重试，或回房间接着刚才的进度。')
    if (error instanceof ApiError) throw error
    throw new ApiError('没有连上服务。可以重试，或回房间重新读取进度。')
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', cancel)
  }
}

function pendingCommands(): Record<string, string> {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(PENDING_KEY) || '{}')
    if (!value || typeof value !== 'object' || Array.isArray(value) || Object.values(value).some(key => typeof key !== 'string')) throw new Error()
    return value as Record<string, string>
  } catch {
    throw new Error('暂时读不到本机的操作记录。请保留浏览器数据，稍后重新进入。')
  }
}

function rememberCommands(value: Record<string, string>) {
  try { localStorage.setItem(PENDING_KEY, JSON.stringify(value)) }
  catch { throw new Error('浏览器暂时不能保存操作记录。请允许保存本站数据后再继续。') }
}

function forgetCommand(fingerprint: string, idempotencyKey: string) {
  const latest = pendingCommands()
  if (latest[fingerprint] !== idempotencyKey) return
  delete latest[fingerprint]
  rememberCommands(latest)
}

/** 同一未收到结果的操作沿用原编号；刷新后也不重复结算。 */
export function command<T>(path: string, token: string, body: Record<string, unknown> = {}): Promise<T> {
  const fingerprint = `${path}:${JSON.stringify(body)}`
  const inFlight = commandsInFlight.get(fingerprint)
  if (inFlight) return inFlight as Promise<T>
  const operation = (async () => {
    const pending = pendingCommands()
    const idempotencyKey = pending[fingerprint] ?? crypto.randomUUID()
    pending[fingerprint] = idempotencyKey
    rememberCommands(pending)
    try {
      const result = await request<T>(path, token, { ...body, idempotencyKey })
      forgetCommand(fingerprint, idempotencyKey)
      return result
    } catch (error) {
      // 请求已被明确拒绝时，下一次操作重新编号；响应丢失、超时和服务端异常则沿用旧编号。
      if (error instanceof ApiError && error.status !== null && error.status >= 400 && error.status < 500 && error.status !== 408) forgetCommand(fingerprint, idempotencyKey)
      throw error
    }
  })().finally(() => { commandsInFlight.delete(fingerprint) })
  commandsInFlight.set(fingerprint, operation)
  return operation
}

export function getSession(): Promise<string> {
  if (sessionRequest) return sessionRequest
  sessionRequest = (async () => {
    const saved = localStorage.getItem(SESSION_KEY)
    if (saved) {
      await request('/v1/me', saved)
      return saved
    }
    const session = await request<{ token: string }>('/v1/auth/guest', '', {})
    localStorage.setItem(SESSION_KEY, session.token)
    return session.token
  })().finally(() => { sessionRequest = null })
  return sessionRequest
}

export const teachingCommand = (token: string, instance: FixedEventInstanceView, body: Omit<FixedEventTeachingRequest, 'stateId' | 'idempotencyKey'>) =>
  command<FixedEventTeachingView>(`/v1/fixed-content/events/${instance.instanceId}/teaching`, token, { ...body, stateId: instance.currentState.id })
