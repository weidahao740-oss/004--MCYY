import { z } from 'zod'

export const languageFeedbackResultSchema = z.enum([
  'successful',
  'more_natural',
  'affects_understanding',
])

export const languageFeedbackFocusSchema = z.object({
  kind: z.enum(['success', 'clarity', 'naturalness', 'pronunciation']),
  title: z.string().min(1).max(160),
  titleZh: z.string().min(1).max(160),
  explanation: z.string().min(1).max(500),
  explanationZh: z.string().min(1).max(500),
})

export const languageFeedbackSchema = z.object({
  id: z.string().uuid(),
  sourceType: z.enum(['event', 'conversation']),
  eventInstanceId: z.string().uuid().nullable(),
  conversationId: z.string().uuid().nullable(),
  result: languageFeedbackResultSchema,
  successExpression: z.string().max(800).nullable(),
  originalExpression: z.string().max(800).nullable(),
  naturalExpression: z.string().max(300).nullable(),
  pronunciationNote: z.string().max(300).nullable(),
  focusItems: z.array(languageFeedbackFocusSchema).min(1).max(3),
  suggestedMemoryId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
})

export const completeConversationRequestSchema = z.object({
  idempotencyKey: z.string().min(8).max(160),
})

export const completeConversationResponseSchema = z.object({
  conversation: z.object({
    id: z.string().uuid(),
    status: z.literal('completed'),
  }),
  feedback: languageFeedbackSchema,
})

export type LanguageFeedbackResult = z.infer<typeof languageFeedbackResultSchema>
export type LanguageFeedbackFocus = z.infer<typeof languageFeedbackFocusSchema>
export type LanguageFeedback = z.infer<typeof languageFeedbackSchema>
export type CompleteConversationRequest = z.infer<typeof completeConversationRequestSchema>
export type CompleteConversationResponse = z.infer<typeof completeConversationResponseSchema>
