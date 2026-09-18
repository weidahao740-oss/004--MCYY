import { z } from 'zod'

export const transcribeAudioRequestSchema = z.object({
  audioBase64: z.string().min(1).max(8_000_000),
  mimeType: z.string().min(1).max(100),
  languageHint: z.string().min(2).max(16).default('en'),
})

export const transcribeAudioResponseSchema = z.object({
  provider: z.string(),
  model: z.string(),
  text: z.string(),
  confidence: z.number().min(0).max(1).nullable(),
  durationSec: z.number().nonnegative().nullable(),
  editable: z.literal(true),
  degraded: z.boolean(),
  userMessage: z.string(),
})

export const synthesizeSpeechRequestSchema = z.object({
  text: z.string().trim().min(1).max(800),
  speed: z.number().min(0.5).max(2).default(1),
  voice: z.string().min(1).max(100).optional(),
  format: z.enum(['wav', 'mp3', 'opus']).default('wav'),
})

export const synthesizeSpeechResponseSchema = z.object({
  provider: z.string(),
  voice: z.string(),
  mimeType: z.string(),
  audioBase64: z.string(),
  durationSec: z.number().nonnegative().nullable(),
  subtitle: z.string(),
  degraded: z.boolean(),
  errorCode: z.string().nullable(),
})

export type TranscribeAudioRequest = z.infer<typeof transcribeAudioRequestSchema>
export type TranscribeAudioResponse = z.infer<typeof transcribeAudioResponseSchema>
export type SynthesizeSpeechRequest = z.infer<typeof synthesizeSpeechRequestSchema>
export type SynthesizeSpeechResponse = z.infer<typeof synthesizeSpeechResponseSchema>
