import { z } from 'zod'

const nonEmptyIdSchema = z.string().regex(/^[a-z][a-z0-9_]*$/)
const versionSchema = z.string().regex(/^\d+\.\d+\.\d+$/)

export const languageLevelSchema = z.enum(['L1', 'L2', 'L3', 'L4'])
export type LanguageLevel = z.infer<typeof languageLevelSchema>

export const relationshipStageSchema = z.enum([
  'NEW',
  'FAMILIAR',
  'TRUSTED',
  'CLOSE',
])
export type RelationshipStage = z.infer<typeof relationshipStageSchema>

export const eventInputModeSchema = z.enum([
  'text',
  'voice',
  'reference_reply',
  'choice',
  'continue',
])
export type EventInputMode = z.infer<typeof eventInputModeSchema>

export const eventInstanceStatusSchema = z.enum([
  'available',
  'active',
  'paused',
  'completed',
])
export type EventInstanceStatus = z.infer<typeof eventInstanceStatusSchema>

export const eventRepeatPolicySchema = z.enum(['once', 'repeatable'])
export type EventRepeatPolicy = z.infer<typeof eventRepeatPolicySchema>

export const eventSkillSchema = z.enum([
  'gist',
  'interpretation',
  'uncertainty',
  'description',
  'comparison',
  'preference',
  'reason',
  'clarification',
  'rephrasing',
  'planning',
  'condition',
  'suggestion',
  'narration',
  'sequence',
  'reflection',
])
export type EventSkill = z.infer<typeof eventSkillSchema>

export const memoryKindSchema = z.enum(['life', 'language', 'relationship'])
export type EventMemoryKind = z.infer<typeof memoryKindSchema>

export const worldStateValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
])
export type WorldStateValue = z.infer<typeof worldStateValueSchema>

export const worldStateConditionSchema = z.object({
  key: nonEmptyIdSchema,
  operator: z.enum(['equals', 'not_equals', 'exists', 'in']),
  value: z.union([worldStateValueSchema, z.array(worldStateValueSchema)]).optional(),
})
export type WorldStateCondition = z.infer<typeof worldStateConditionSchema>

export const eventTriggerSchema = z.object({
  requiredCompletedEventIds: z.array(nonEmptyIdSchema),
  requiredWorldState: z.array(worldStateConditionSchema),
  allowedRelationshipStages: z.array(relationshipStageSchema).min(1),
  repeatPolicy: eventRepeatPolicySchema,
  cooldownHours: z.number().int().nonnegative().nullable(),
  maxConcurrentInstances: z.literal(1),
})
export type EventTrigger = z.infer<typeof eventTriggerSchema>

export const eventLineSchema = z.object({
  id: nonEmptyIdSchema,
  text: z.string().min(1).max(800),
  levels: z.array(languageLevelSchema).min(1),
})
export type EventLine = z.infer<typeof eventLineSchema>

export const referenceReplySchema = z.object({
  id: nonEmptyIdSchema,
  text: z.string().min(1).max(300),
  editable: z.literal(true),
})
export type ReferenceReply = z.infer<typeof referenceReplySchema>

export const eventStateSchema = z.object({
  id: nonEmptyIdSchema,
  phase: z.enum([
    'opening',
    'input',
    'understanding',
    'clarification',
    'choice',
    'result',
    'closing',
  ]),
  userTask: z.string().min(1).max(500),
  lines: z.array(eventLineSchema).min(1),
  acceptedInputModes: z.array(eventInputModeSchema).min(1),
  referenceReplies: z.array(referenceReplySchema).max(2),
  recoverable: z.literal(true),
  checkpoint: z.boolean(),
})
export type EventState = z.infer<typeof eventStateSchema>

export const eventTransitionSchema = z.object({
  from: nonEmptyIdSchema,
  to: z.union([nonEmptyIdSchema, z.literal('completed')]),
  on: z.enum([
    'continue',
    'meaning_understood',
    'meaning_ambiguous',
    'clarification_resolved',
    'choice_confirmed',
    'user_declines',
    'result_committed',
  ]),
  guard: z.string().min(1).max(500),
})
export type EventTransition = z.infer<typeof eventTransitionSchema>

export const eventMisunderstandingSchema = z.object({
  trigger: z.string().min(1).max(800),
  temporaryEffect: z.string().min(1).max(500),
  morrowLine: z.string().min(1).max(800),
  clarificationPrompt: z.string().min(1).max(800),
  recoveryStateId: nonEmptyIdSchema,
  maxClarificationTurns: z.number().int().min(1).max(2),
  persistMisunderstoodContent: z.literal(false),
})
export type EventMisunderstanding = z.infer<
  typeof eventMisunderstandingSchema
>

export const worldStateWriteSchema = z
  .object({
    key: nonEmptyIdSchema,
    // 要么写死字面 value，要么引用本事件中已确认的槽位（fromSlot），
    // 且槽位取值必须落在 allowedValues 白名单内——不开放任意键/值。
    value: worldStateValueSchema.optional(),
    fromSlot: nonEmptyIdSchema.optional(),
    allowedValues: z.array(worldStateValueSchema).optional(),
  })
  .refine((write) => write.value !== undefined || write.fromSlot !== undefined, {
    message: 'worldStateWrite must set either a literal value or a fromSlot reference',
  })
  .refine(
    (write) => write.fromSlot === undefined || (Array.isArray(write.allowedValues) && write.allowedValues.length > 0),
    { message: 'a fromSlot write must declare a non-empty allowedValues whitelist' },
  )
export type WorldStateWrite = z.infer<typeof worldStateWriteSchema>

export const eventOutcomeSchema = z.object({
  id: nonEmptyIdSchema,
  label: z.string().min(1).max(200),
  condition: z.string().min(1).max(500),
  worldStateWrites: z.array(worldStateWriteSchema),
  visibleEffect: z.string().min(1).max(500),
  futureHook: z.string().max(500).nullable(),
})
export type EventOutcome = z.infer<typeof eventOutcomeSchema>

export const memoryProposalRuleSchema = z.object({
  id: nonEmptyIdSchema,
  kind: memoryKindSchema,
  when: z.string().min(1).max(800),
  contentTemplate: z.string().min(1).max(500),
  requiresUserConfirmation: z.literal(true),
  skipIfSensitiveOrInferred: z.literal(true),
})
export type MemoryProposalRule = z.infer<typeof memoryProposalRuleSchema>

export const resurfacingRuleSchema = z.object({
  expression: z.string().min(1).max(300),
  targetEventIds: z.array(nonEmptyIdSchema),
  semanticContexts: z.array(z.string().min(1).max(120)).min(1),
  mode: z.literal('optional_natural_prompt'),
  requiresConfirmedLanguageMemory: z.literal(true),
  minEventGap: z.number().int().min(1),
  cooldownHours: z.number().int().nonnegative(),
})
export type ResurfacingRule = z.infer<typeof resurfacingRuleSchema>

export const eventDefinitionSchema = z
  .object({
    id: nonEmptyIdSchema,
    version: versionSchema,
    title: z.string().min(1).max(200),
    titleZh: z.string().min(1).max(200),
    summary: z.string().min(1).max(800),
    estimatedMinutes: z.object({
      min: z.number().int().min(1),
      max: z.number().int().max(10),
    }),
    trigger: eventTriggerSchema,
    morrowGoal: z.string().min(1).max(800),
    targetSkills: z.array(eventSkillSchema).min(1),
    keyExpressions: z.array(z.string().min(1).max(300)).min(1),
    states: z.array(eventStateSchema).min(2),
    transitions: z.array(eventTransitionSchema).min(1),
    misunderstanding: eventMisunderstandingSchema,
    outcomes: z.array(eventOutcomeSchema).min(1),
    memoryProposals: z.array(memoryProposalRuleSchema),
    resurfacing: z.array(resurfacingRuleSchema),
    boundaries: z.array(z.string().min(1).max(500)).min(1),
  })
  .superRefine((event, context) => {
    if (event.estimatedMinutes.min > event.estimatedMinutes.max) {
      context.addIssue({
        code: 'custom',
        path: ['estimatedMinutes'],
        message: 'estimatedMinutes.min must not exceed max',
      })
    }

    const stateIds = new Set(event.states.map((state) => state.id))
    if (stateIds.size !== event.states.length) {
      context.addIssue({
        code: 'custom',
        path: ['states'],
        message: 'state ids must be unique within an event',
      })
    }

    for (const transition of event.transitions) {
      if (!stateIds.has(transition.from)) {
        context.addIssue({
          code: 'custom',
          path: ['transitions'],
          message: `transition references unknown from state: ${transition.from}`,
        })
      }
      if (transition.to !== 'completed' && !stateIds.has(transition.to)) {
        context.addIssue({
          code: 'custom',
          path: ['transitions'],
          message: `transition references unknown to state: ${transition.to}`,
        })
      }
    }

    if (!stateIds.has(event.misunderstanding.recoveryStateId)) {
      context.addIssue({
        code: 'custom',
        path: ['misunderstanding', 'recoveryStateId'],
        message: 'misunderstanding recovery state must exist in states',
      })
    }
  })
export type EventDefinition = z.infer<typeof eventDefinitionSchema>

export const eventRulesetSchema = z
  .object({
    id: z.string().regex(/^events-v\d+\.\d+\.\d+$/),
    version: versionSchema,
    personaVersion: z.string().min(1),
    promptVersion: z.string().min(1),
    outputSchemaVersion: z.string().min(1),
    events: z.array(eventDefinitionSchema).length(5),
  })
  .superRefine((ruleset, context) => {
    const ids = new Set(ruleset.events.map((event) => event.id))
    if (ids.size !== ruleset.events.length) {
      context.addIssue({
        code: 'custom',
        path: ['events'],
        message: 'event ids must be unique within a ruleset',
      })
    }

    for (const event of ruleset.events) {
      for (const dependencyId of event.trigger.requiredCompletedEventIds) {
        if (dependencyId !== 'first_day_v1' && !ids.has(dependencyId)) {
          context.addIssue({
            code: 'custom',
            path: ['events', event.id, 'trigger'],
            message: `unknown event dependency: ${dependencyId}`,
          })
        }
      }

      for (const resurfacing of event.resurfacing) {
        for (const targetEventId of resurfacing.targetEventIds) {
          if (!ids.has(targetEventId)) {
            context.addIssue({
              code: 'custom',
              path: ['events', event.id, 'resurfacing'],
              message: `unknown resurfacing target: ${targetEventId}`,
            })
          }
        }
      }
    }
  })
export type EventRuleset = z.infer<typeof eventRulesetSchema>
