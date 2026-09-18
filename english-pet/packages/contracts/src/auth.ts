import { z } from 'zod'

export const accountKindSchema = z.enum(['guest', 'registered'])
export const userStatusSchema = z.enum(['active', 'suspended', 'deletion_pending'])
export const languageLevelSchemaV1 = z.enum(['L1', 'L2', 'L3', 'L4'])
export const replyLengthSchema = z.enum(['short', 'standard'])
export const speechRateSchema = z.enum(['slow', 'normal'])
export const interfaceLocaleSchema = z.enum(['zh-CN', 'en'])
export const correctionPreferenceSchema = z.enum([
  'after_conversation',
  'only_when_blocking',
])

export const userSettingsSchema = z.object({
  languageLevel: languageLevelSchemaV1,
  preferredReplyLength: replyLengthSchema,
  speechRate: speechRateSchema,
  subtitlesEnabled: z.boolean(),
  correctionPreference: correctionPreferenceSchema,
  memoryEnabled: z.boolean(),
  voiceInputEnabled: z.boolean(),
  voiceOutputEnabled: z.boolean(),
  interfaceLocale: interfaceLocaleSchema,
  timeZone: z.string().min(1).max(64),
})

export const publicUserSchema = z.object({
  id: z.string().uuid(),
  accountKind: accountKindSchema,
  status: userStatusSchema,
  email: z.string().email().nullable(),
  displayName: z.string().min(1).max(30).nullable(),
  createdAt: z.string().datetime(),
})

export const petSummarySchema = z.object({
  id: z.string().uuid(),
  characterKey: z.literal('morrow'),
  displayName: z.literal('Morrow'),
  personaVersion: z.literal('morrow-1.0'),
  relationshipStage: z.enum(['NEW', 'FAMILIAR', 'TRUSTED', 'CLOSE']),
  firstDayStatus: z.enum(['not_started', 'in_progress', 'completed']),
})

export const sessionResponseSchema = z.object({
  token: z.string().min(32),
  user: publicUserSchema,
  settings: userSettingsSchema,
  pet: petSummarySchema,
  persistence: z.enum(['memory', 'postgresql']),
})

export const meResponseSchema = sessionResponseSchema.omit({ token: true })

export const registerRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
  displayName: z.string().trim().min(1).max(30).optional(),
})

export const loginRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
})

export const updateSettingsRequestSchema = userSettingsSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'At least one setting must be provided',
)

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    requestId: z.string(),
    details: z.unknown().optional(),
  }),
})

export type InterfaceLocale = z.infer<typeof interfaceLocaleSchema>
export type SpeechRate = z.infer<typeof speechRateSchema>
export type UserSettings = z.infer<typeof userSettingsSchema>
export type PublicUser = z.infer<typeof publicUserSchema>
export type PetSummary = z.infer<typeof petSummarySchema>
export type SessionResponse = z.infer<typeof sessionResponseSchema>
export type MeResponse = z.infer<typeof meResponseSchema>
export type RegisterRequest = z.infer<typeof registerRequestSchema>
export type LoginRequest = z.infer<typeof loginRequestSchema>
export type UpdateSettingsRequest = z.infer<typeof updateSettingsRequestSchema>
export type ApiError = z.infer<typeof apiErrorSchema>
