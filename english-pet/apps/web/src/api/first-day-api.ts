import type { FirstDayActionRequest, FirstDayView } from '@english-pet/contracts'
import { firstDayViewSchema } from '@english-pet/contracts'
import { z } from 'zod'

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8787').replace(/\/$/, '')

async function json<S extends z.ZodTypeAny>(path: string, token: string, schema: S, init: RequestInit = {}): Promise<z.output<S>> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...init.headers },
  })
  if (!response.ok) throw new Error(`first_day_request_failed_${response.status}`)
  return schema.parse(await response.json())
}

export const firstDayApi = {
  get(token: string): Promise<FirstDayView> {
    return json('/v1/first-day', token, firstDayViewSchema)
  },
  act(token: string, input: FirstDayActionRequest): Promise<FirstDayView> {
    return json('/v1/first-day/actions', token, firstDayViewSchema, { method: 'POST', body: JSON.stringify(input) })
  },
}
