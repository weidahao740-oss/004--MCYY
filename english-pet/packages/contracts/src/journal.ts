import { z } from 'zod'

export const journalVisibilitySchema = z.enum(['visible', 'hidden', 'deleted'])

export const journalEntrySchema = z.object({
  id: z.string().uuid(),
  eventInstanceId: z.string().uuid(),
  eventKey: z.string(),
  title: z.string().max(200),
  titleZh: z.string().max(200),
  whatHappened: z.string().max(800),
  whatUserSaid: z.string().max(800).nullable(),
  naturalExpression: z.string().max(300).nullable(),
  pronunciationNote: z.string().max(300).nullable(),
  whatMorrowRemembers: z.string().max(500).nullable(),
  linkedMemoryId: z.string().uuid().nullable(),
  linkedMemoryVersion: z.number().int().positive().nullable(),
  worldChange: z.string().max(500).nullable(),
  visibility: journalVisibilitySchema,
  version: z.number().int().positive(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  textVersion: z.string().nullable(),
  translationVersion: z.string().nullable(),
})

export const journalListResponseSchema = z.object({
  entries: z.array(journalEntrySchema),
  persistence: z.enum(['memory', 'sqlite', 'postgresql']),
})

export const journalEditPatchSchema = z.object({
  whatHappened: z.string().trim().min(1).max(800).optional(),
  whatUserSaid: z.string().trim().min(1).max(800).nullable().optional(),
  naturalExpression: z.string().trim().min(1).max(300).nullable().optional(),
  whatMorrowRemembers: z.string().trim().min(1).max(500).nullable().optional(),
}).refine((value) => Object.keys(value).length > 0, 'At least one journal field is required')

export const journalActionRequestSchema = z.object({
  action: z.enum(['edit', 'hide', 'restore', 'delete']),
  expectedVersion: z.number().int().positive(),
  patch: journalEditPatchSchema.optional(),
  idempotencyKey: z.string().min(8).max(160),
}).superRefine((input, context) => {
  if (input.action === 'edit' && !input.patch) {
    context.addIssue({ code: 'custom', path: ['patch'], message: 'patch is required for edit' })
  }
})

export type JournalEntry = z.infer<typeof journalEntrySchema>
export type JournalActionRequest = z.infer<typeof journalActionRequestSchema>
export type JournalEditPatch = z.infer<typeof journalEditPatchSchema>
