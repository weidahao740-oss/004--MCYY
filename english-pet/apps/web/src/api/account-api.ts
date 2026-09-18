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

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8787').replace(/\/$/, '')

export class ApiClientError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message)
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiError | null
    throw new ApiClientError(
      payload?.error.code ?? 'request_failed',
      payload?.error.message ?? 'The service could not complete the request.',
    )
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
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
