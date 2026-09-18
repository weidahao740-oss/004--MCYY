import type { Memory, MemoryActionRequest, MemoryListResponse } from '@english-pet/contracts'
import { memoryListResponseSchema, memorySchema } from '@english-pet/contracts'
import { z } from 'zod'

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8787').replace(/\/$/, '')

async function json<S extends z.ZodTypeAny>(path: string, token: string, schema: S, init: RequestInit = {}): Promise<z.output<S>> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  })
  if (!response.ok) throw new Error(`memory_request_failed_${response.status}`)
  return schema.parse(await response.json())
}

export const memoryApi = {
  list(token: string): Promise<MemoryListResponse> {
    return json('/v1/memories', token, memoryListResponseSchema)
  },
  act(token: string, memoryId: string, input: MemoryActionRequest): Promise<Memory> {
    return json(`/v1/memories/${memoryId}/actions`, token, memorySchema, {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },
}
