import type { JournalActionRequest, JournalEntry } from '@english-pet/contracts'
import { journalEntrySchema, journalListResponseSchema } from '@english-pet/contracts'
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
  if (!response.ok) throw new Error(`journal_request_failed_${response.status}`)
  return schema.parse(await response.json())
}

export const journalApi = {
  list(token: string) {
    return json('/v1/journals', token, journalListResponseSchema)
  },
  act(token: string, journalId: string, input: JournalActionRequest): Promise<JournalEntry> {
    return json(`/v1/journals/${journalId}/actions`, token, journalEntrySchema, {
      method: 'POST', body: JSON.stringify(input),
    })
  },
}
