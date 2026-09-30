import { z } from 'zod'
import { memoryKindSchema } from './events'

export const memoryStatusSchema = z.enum(['proposed', 'confirmed', 'paused', 'rejected', 'deleted', 'expired'])
export const memoryConfidenceSchema = z.enum(['high', 'medium', 'low'])
export const memorySourceTypeSchema = z.enum(['conversation', 'event'])
export const memoryActionSchema = z.enum(['confirm', 'edit', 'pause', 'resume', 'reject', 'delete'])

export const memorySchema = z.object({
  id: z.string().uuid(),
  kind: memoryKindSchema,
  status: memoryStatusSchema,
  content: z.string().max(500),
  expression: z.string().max(300).nullable(),
  naturalExpression: z.string().max(300).nullable(),
  semanticTags: z.array(z.string().max(80)).max(12),
  confidence: memoryConfidenceSchema,
  requiresUserConfirmation: z.literal(true),
  sourceType: memorySourceTypeSchema,
  sourceConversationId: z.string().uuid().nullable(),
  sourceEventInstanceId: z.string().uuid().nullable(),
  version: z.number().int().positive(),
  createdAt: z.string().datetime(),
  confirmedAt: z.string().datetime().nullable(),
  pausedAt: z.string().datetime().nullable(),
  expiresAt: z.string().datetime().nullable(),
})

export const memoryListResponseSchema = z.object({
  memoryEnabled: z.boolean(),
  proposed: z.array(memorySchema),
  saved: z.array(memorySchema),
  restrictedProposalCount: z.number().int().nonnegative(),
  persistence: z.enum(['memory', 'sqlite', 'postgresql']),
})

export const memoryActionRequestSchema = z.object({
  action: memoryActionSchema,
  expectedVersion: z.number().int().positive(),
  content: z.string().trim().min(1).max(500).optional(),
  idempotencyKey: z.string().min(8).max(160),
}).superRefine((input, context) => {
  if ((input.action === 'confirm' || input.action === 'edit') && !input.content) {
    context.addIssue({ code: 'custom', path: ['content'], message: 'content is required for confirm and edit' })
  }
})

export const memorySearchContextSchema = z.object({
  query: z.string().max(800),
  eventKey: z.string().max(96).nullable().default(null),
  limit: z.number().int().min(1).max(8).default(5),
})

export type MemoryKind = z.infer<typeof memoryKindSchema>
export type MemoryStatus = z.infer<typeof memoryStatusSchema>
export type MemoryConfidence = z.infer<typeof memoryConfidenceSchema>
export type Memory = z.infer<typeof memorySchema>
export type MemoryListResponse = z.infer<typeof memoryListResponseSchema>
export type MemoryActionRequest = z.infer<typeof memoryActionRequestSchema>
export type MemorySearchContext = z.infer<typeof memorySearchContextSchema>
