import { z } from 'zod'
import { journalEntrySchema } from './journal'
import { memorySchema } from './memory'

export const firstDayStateSchema = z.enum([
  'FD00_ENTRY',
  'FD01_WAKE',
  'FD02_NAME',
  'FD03_TODAY',
  'FD04_UNDERSTOOD',
  'FD05_RESTORE',
  'FD06_MEMORY_REVIEW',
  'FD07_JOURNAL',
  'COMPLETED',
])

export const firstDayActionSchema = z.enum([
  'start',
  'continue',
  'submit_name',
  'skip_name',
  'submit_today',
  'confirm_understanding',
  'select_object',
  'complete_memory_review',
  'finish',
])

export const firstDayViewSchema = z.object({
  instanceId: z.string().uuid(),
  status: z.enum(['not_started', 'in_progress', 'completed']),
  state: firstDayStateSchema,
  morrowLines: z.array(z.string().min(1).max(800)),
  userTaskZh: z.string().min(1).max(500),
  userTaskEn: z.string().min(1).max(500),
  nickname: z.string().max(30).nullable(),
  todayExpression: z.string().max(800).nullable(),
  understoodMeaning: z.string().max(800).nullable(),
  restoredObject: z.enum(['lamp', 'plant']).nullable(),
  proposals: z.array(memorySchema).max(3),
  journal: journalEntrySchema.nullable(),
})

export const firstDayActionRequestSchema = z.object({
  action: firstDayActionSchema,
  text: z.string().trim().max(800).optional(),
  object: z.enum(['lamp', 'plant']).optional(),
  idempotencyKey: z.string().min(8).max(160),
}).superRefine((input, context) => {
  if ((input.action === 'submit_name' || input.action === 'submit_today') && !input.text) {
    context.addIssue({ code: 'custom', path: ['text'], message: 'text is required for this action' })
  }
  if (input.action === 'select_object' && !input.object) {
    context.addIssue({ code: 'custom', path: ['object'], message: 'object is required for this action' })
  }
})

export type FirstDayState = z.infer<typeof firstDayStateSchema>
export type FirstDayAction = z.infer<typeof firstDayActionSchema>
export type FirstDayView = z.infer<typeof firstDayViewSchema>
export type FirstDayActionRequest = z.infer<typeof firstDayActionRequestSchema>
