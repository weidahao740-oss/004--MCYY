import type {
  ChatStreamEvent,
  CompleteConversationRequest,
  Conversation,
  SendMessageRequest,
} from '@english-pet/contracts'
import { chatStreamEventSchema, completeConversationResponseSchema } from '@english-pet/contracts'

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8787').replace(/\/$/, '')

async function jsonRequest<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  })
  if (!response.ok) throw new Error(`request_failed_${response.status}`)
  return (await response.json()) as T
}

export const conversationApi = {
  current(token: string) {
    return jsonRequest<Conversation>('/v1/conversations/current', token)
  },

  async complete(token: string, conversationId: string, input: CompleteConversationRequest) {
    const result = await jsonRequest<unknown>(`/v1/conversations/${conversationId}/complete`, token, {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return completeConversationResponseSchema.parse(result)
  },

  async streamMessage(
    token: string,
    conversationId: string,
    input: SendMessageRequest,
    signal: AbortSignal,
    onEvent: (event: ChatStreamEvent) => void,
  ): Promise<void> {
    const response = await fetch(`${API_BASE}/v1/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(input),
      signal,
    })
    if (!response.ok || !response.body) throw new Error(`stream_failed_${response.status}`)

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const blocks = buffer.split('\n\n')
      buffer = blocks.pop() ?? ''
      for (const block of blocks) {
        const dataLine = block.split('\n').find((line) => line.startsWith('data: '))
        if (!dataLine) continue
        const parsed = chatStreamEventSchema.safeParse(JSON.parse(dataLine.slice(6)))
        if (parsed.success) onEvent(parsed.data)
      }
    }
  },
}
