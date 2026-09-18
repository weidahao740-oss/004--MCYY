import type {
  EventActionRequest,
  ResurfacingRecordRequest,
  StartEventRequest,
} from '@english-pet/contracts'
import {
  eventActionResponseSchema,
  eventCatalogItemSchema,
  eventInstanceViewSchema,
} from '@english-pet/contracts'
import { z } from 'zod'

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8787').replace(/\/$/, '')
const catalogSchema = z.object({ rulesetId: z.string(), events: z.array(eventCatalogItemSchema) })
const currentSchema = z.object({ instance: eventInstanceViewSchema.nullable() })

async function json<S extends z.ZodTypeAny>(path: string, token: string, schema: S, init: RequestInit = {}): Promise<z.output<S>> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  })
  if (!response.ok) throw new Error(`event_request_failed_${response.status}`)
  return schema.parse(await response.json())
}

export const eventApi = {
  catalog(token: string) {
    return json('/v1/events', token, catalogSchema)
  },
  current(token: string) {
    return json('/v1/events/current', token, currentSchema)
  },
  start(token: string, input: StartEventRequest) {
    return json('/v1/events/start', token, eventInstanceViewSchema, { method: 'POST', body: JSON.stringify(input) })
  },
  act(token: string, instanceId: string, input: EventActionRequest) {
    return json(`/v1/events/${instanceId}/actions`, token, eventActionResponseSchema, { method: 'POST', body: JSON.stringify(input) })
  },
  recordResurfacing(token: string, instanceId: string, input: ResurfacingRecordRequest) {
    return json(`/v1/events/${instanceId}/resurfacing`, token, eventInstanceViewSchema, { method: 'POST', body: JSON.stringify(input) })
  },
}
