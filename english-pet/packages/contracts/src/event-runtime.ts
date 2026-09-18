import { z } from 'zod'
import {
  eventInputModeSchema,
  eventInstanceStatusSchema,
  eventStateSchema,
  worldStateValueSchema,
} from './events'
import { languageFeedbackSchema } from './feedback'
import { resurfacingPromptSchema, resurfacingResultSchema } from './resurfacing'

export const eventActionKindSchema = z.enum(['continue', 'submit', 'confirm', 'clarify', 'decline', 'pause', 'complete'])

export const eventCatalogItemSchema = z.object({
  eventKey: z.string(),
  version: z.string(),
  title: z.string(),
  titleZh: z.string(),
  status: z.enum(['locked', 'available', 'active', 'paused', 'completed']),
  estimatedMinutes: z.object({ min: z.number().int(), max: z.number().int() }),
})

export const eventInstanceViewSchema = z.object({
  instanceId: z.string().uuid(),
  eventKey: z.string(),
  eventVersion: z.string(),
  rulesetId: z.string(),
  status: eventInstanceStatusSchema,
  currentState: eventStateSchema,
  clarificationCount: z.number().int().nonnegative(),
  selectedOutcomeId: z.string().nullable(),
  allowedActions: z.array(eventActionKindSchema),
  availableOutcomes: z.array(z.object({
    id: z.string(),
    label: z.string(),
  })),
  worldState: z.record(z.string(), worldStateValueSchema),
  completedEventKeys: z.array(z.string()),
  resurfacingPrompt: resurfacingPromptSchema.nullable(),
})

export const startEventRequestSchema = z.object({
  eventKey: z.string().min(1).max(96),
  idempotencyKey: z.string().min(8).max(160),
})

export const eventActionRequestSchema = z.object({
  action: eventActionKindSchema,
  inputMode: eventInputModeSchema.default('text'),
  text: z.string().trim().max(800).optional(),
  choiceId: z.string().max(96).optional(),
  resurfacingResult: resurfacingResultSchema.optional(),
  idempotencyKey: z.string().min(8).max(160),
})

export const eventActionResponseSchema = z.object({
  instance: eventInstanceViewSchema,
  message: z.string(),
  messageZh: z.string(),
  misunderstanding: z.boolean(),
  recovered: z.boolean(),
  outcome: z.object({
    id: z.string(),
    visibleEffect: z.string(),
  }).nullable(),
  feedback: languageFeedbackSchema.nullable(),
})

export type EventCatalogItem = z.infer<typeof eventCatalogItemSchema>
export type EventActionKind = z.infer<typeof eventActionKindSchema>
export type EventInstanceView = z.infer<typeof eventInstanceViewSchema>
export type StartEventRequest = z.infer<typeof startEventRequestSchema>
export type EventActionRequest = z.infer<typeof eventActionRequestSchema>
export type EventActionResponse = z.infer<typeof eventActionResponseSchema>
