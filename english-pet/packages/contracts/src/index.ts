import { z } from 'zod'

export * from './auth'
export * from './conversation'
export * from './event-runtime'
export * from './events'
export * from './fixed-content'
export * from './feedback'
export * from './first-day'
export * from './journal'
export * from './memory'
export * from './pet-home'
export * from './resurfacing'
export * from './voice'

export const healthResponseSchema = z.object({
  ok: z.boolean(),
  service: z.literal('english-pet-api'),
  environment: z.string(),
})

export type HealthResponse = z.infer<typeof healthResponseSchema>
