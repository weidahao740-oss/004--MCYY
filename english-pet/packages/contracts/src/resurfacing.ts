import { z } from 'zod'

export const resurfacingStatusSchema = z.enum(['pending', 'eligible', 'served', 'mastered', 'snoozed', 'cancelled'])
export const resurfacingModeSchema = z.enum(['optional_prompt', 'natural_modeling'])
export const resurfacingResultSchema = z.enum(['used', 'paraphrased', 'ignored', 'declined', 'not_applicable'])

export const resurfacingPromptSchema = z.object({
  taskId: z.string().uuid(),
  memoryId: z.string().uuid(),
  expression: z.string().min(1).max(300),
  semanticContexts: z.array(z.string().min(1).max(120)).min(1),
  mode: resurfacingModeSchema,
  prompt: z.string().min(1).max(500),
  promptZh: z.string().min(1).max(500),
})

export const resurfacingRecordRequestSchema = z.object({
  result: resurfacingResultSchema,
  idempotencyKey: z.string().min(8).max(160),
})

export const resurfacingAttemptSchema = z.object({
  id: z.string().uuid(),
  taskId: z.string().uuid(),
  eventInstanceId: z.string().uuid(),
  mode: resurfacingModeSchema,
  result: resurfacingResultSchema,
  createdAt: z.string().datetime(),
})

export type ResurfacingStatus = z.infer<typeof resurfacingStatusSchema>
export type ResurfacingMode = z.infer<typeof resurfacingModeSchema>
export type ResurfacingResult = z.infer<typeof resurfacingResultSchema>
export type ResurfacingPrompt = z.infer<typeof resurfacingPromptSchema>
export type ResurfacingRecordRequest = z.infer<typeof resurfacingRecordRequestSchema>
export type ResurfacingAttempt = z.infer<typeof resurfacingAttemptSchema>
