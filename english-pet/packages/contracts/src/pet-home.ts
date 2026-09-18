import { z } from 'zod'

export const petEmotionSchema = z.enum(['calm', 'curious', 'warm', 'amused'])
export const petActivitySchema = z.enum([
  'listening_by_window',
  'reading_letter',
  'resting',
])
export const petActionSchema = z.enum(['greet', 'listen', 'rest'])
export const dailyEventStatusSchema = z.enum(['available', 'in_progress', 'completed'])

export const dailyEventSummarySchema = z.object({
  eventKey: z.string(),
  titleZh: z.string(),
  titleEn: z.string(),
  status: dailyEventStatusSchema,
  estimatedMinutes: z.object({ min: z.number().int(), max: z.number().int() }),
})

export const petHomeStateSchema = z.object({
  emotion: petEmotionSchema,
  activity: petActivitySchema,
  statusTextZh: z.string(),
  statusTextEn: z.string(),
  lastSeenAt: z.string().datetime().nullable(),
  returnMessageZh: z.string(),
  returnMessageEn: z.string(),
  todayEvent: dailyEventSummarySchema.nullable(),
})

export const petHomeResponseSchema = z.object({
  pet: z.object({
    id: z.string().uuid(),
    displayName: z.literal('Morrow'),
    relationshipStage: z.enum(['NEW', 'FAMILIAR', 'TRUSTED', 'CLOSE']),
  }),
  home: petHomeStateSchema,
})

export const petActionRequestSchema = z.object({ action: petActionSchema })

export type PetEmotion = z.infer<typeof petEmotionSchema>
export type PetActivity = z.infer<typeof petActivitySchema>
export type PetAction = z.infer<typeof petActionSchema>
export type DailyEventSummary = z.infer<typeof dailyEventSummarySchema>
export type PetHomeState = z.infer<typeof petHomeStateSchema>
export type PetHomeResponse = z.infer<typeof petHomeResponseSchema>
