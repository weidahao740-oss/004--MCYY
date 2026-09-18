import { z } from 'zod'

export const conversationMessageSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(800),
  createdAt: z.string().datetime(),
  degraded: z.boolean().default(false),
})

export const conversationSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['active', 'paused', 'completed']),
  messages: z.array(conversationMessageSchema),
  modelMode: z.enum(['mock', 'real']),
})

export const createConversationResponseSchema = conversationSchema
export const sendMessageRequestSchema = z.object({
  content: z.string().trim().min(1).max(800),
  clientMessageId: z.string().min(1).max(160),
})

export const chatStreamEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('accepted'), conversationId: z.string().uuid(), message: conversationMessageSchema }),
  z.object({ type: z.literal('delta'), delta: z.string() }),
  z.object({
    type: z.literal('completed'),
    message: conversationMessageSchema,
    reply: z.object({
      emotion: z.string(),
      understoodIntent: z.string(),
      needsClarification: z.boolean(),
    }),
  }),
  z.object({ type: z.literal('error'), code: z.string(), message: z.string(), retryable: z.boolean() }),
])

export type ConversationMessage = z.infer<typeof conversationMessageSchema>
export type Conversation = z.infer<typeof conversationSchema>
export type SendMessageRequest = z.infer<typeof sendMessageRequestSchema>
export type ChatStreamEvent = z.infer<typeof chatStreamEventSchema>
