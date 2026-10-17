import type {
  FixedContentInputMode,
  FixedEventCatalogItem,
  FixedEventDailyBudgetView,
  FixedEventInstanceView,
  FixedEventRecommendationView,
} from '@english-pet/contracts'

import { API_BASE } from './api-base'

async function request<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...init.headers },
  })
  if (!response.ok) throw new Error(`fixed_event_request_failed_${response.status}`)
  return (await response.json()) as T
}

export interface FixedEventAdvanceInput {
  inputMode: FixedContentInputMode
  text?: string
  choiceId?: string
  asrProof?: string
  idempotencyKey: string
}

export const fixedEventApi = {
  catalog(token: string): Promise<{ events: FixedEventCatalogItem[] }> {
    return request('/v1/fixed-content/events', token)
  },
  current(token: string): Promise<{ instance: FixedEventInstanceView | null }> {
    return request('/v1/fixed-content/events/current', token)
  },
  recommendation(token: string): Promise<FixedEventRecommendationView> {
    return request('/v1/fixed-content/recommendation', token)
  },
  start(token: string, eventId: string, idempotencyKey: string): Promise<FixedEventInstanceView> {
    return request(`/v1/fixed-content/events/${eventId}/start`, token, {
      method: 'POST',
      body: JSON.stringify({ eventId, idempotencyKey }),
    })
  },
  advance(token: string, instanceId: string, input: FixedEventAdvanceInput): Promise<FixedEventInstanceView> {
    return request(`/v1/fixed-content/events/${instanceId}/advance`, token, {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },
  pause(token: string, instanceId: string, idempotencyKey: string): Promise<FixedEventInstanceView> {
    return request(`/v1/fixed-content/events/${instanceId}/pause`, token, {
      method: 'POST', body: JSON.stringify({ idempotencyKey }),
    })
  },
  resume(token: string, instanceId: string, idempotencyKey: string): Promise<FixedEventInstanceView> {
    return request(`/v1/fixed-content/events/${instanceId}/resume`, token, {
      method: 'POST', body: JSON.stringify({ idempotencyKey }),
    })
  },
  requestExtra(token: string, idempotencyKey: string): Promise<{ budget: FixedEventDailyBudgetView }> {
    return request('/v1/fixed-content/events/extra', token, {
      method: 'POST', body: JSON.stringify({ idempotencyKey }),
    })
  },
}
