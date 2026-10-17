import type {
  ApiError,
  LoginRequest,
  MeResponse,
  PetAction,
  PetHomeResponse,
  RegisterRequest,
  SessionResponse,
  UpdateSettingsRequest,
} from '@english-pet/contracts'

import { API_BASE } from './api-base'

export class ApiClientError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status?: number,
  ) {
    super(message)
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30_000)
  try {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiError | null
    throw new ApiClientError(
      payload?.error?.code ?? 'request_failed',
      payload?.error?.message ?? '服务暂时没有处理成功，请稍后重试。',
      response.status,
    )
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
  } catch (error) {
    if (error instanceof ApiClientError) throw error
    throw new ApiClientError(controller.signal.aborted ? 'request_timeout' : 'network_error',
      controller.signal.aborted ? '等待后台的时间有点长，请重新连接。' : '暂时连不上后台，请检查网络后重试。')
  } finally {
    clearTimeout(timeout)
  }
}

export const accountApi = {
  createGuest() {
    return request<SessionResponse>('/v1/auth/guest', { method: 'POST' })
  },
  register(input: RegisterRequest, token?: string | null) {
    return request<SessionResponse>(
      '/v1/auth/register',
      { method: 'POST', body: JSON.stringify(input) },
      token,
    )
  },
  login(input: LoginRequest) {
    return request<SessionResponse>('/v1/auth/session', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },
  me(token: string) {
    return request<MeResponse>('/v1/me', {}, token)
  },
  updateSettings(token: string, patch: UpdateSettingsRequest) {
    return request<MeResponse>(
      '/v1/me/settings',
      { method: 'PATCH', body: JSON.stringify(patch) },
      token,
    )
  },
  petHome(token: string) {
    return request<PetHomeResponse>('/v1/pet/home', {}, token)
  },
  petAction(token: string, action: PetAction) {
    return request<PetHomeResponse>(
      '/v1/pet/actions',
      { method: 'POST', body: JSON.stringify({ action }) },
      token,
    )
  },
  deleteAccount(token: string) {
    return request<void>('/v1/me/account', { method: 'DELETE' }, token)
  },
  signOut(token: string) {
    return request<void>('/v1/auth/session', { method: 'DELETE' }, token)
  },
}
