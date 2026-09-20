import { z } from 'zod'

const idSchema = z.string().regex(/^[a-z][a-z0-9_]*$/)
const semanticVersionSchema = z.string().regex(/^\d+\.\d+\.\d+$/)
const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/)

export const fixedContentPlatformSchema = z.enum([
  'web_test',
  'wechat_mini_program',
  'mobile_app',
])
export type FixedContentPlatform = z.infer<typeof fixedContentPlatformSchema>

export const fixedContentInputModeSchema = z.enum([
  'text',
  'confirmed_asr_text',
  'reference_reply',
  'choice',
  'continue',
])
export type FixedContentInputMode = z.infer<typeof fixedContentInputModeSchema>

export const manualTranslationSchema = z.object({
  textZh: z.string().min(1).max(1200),
  version: semanticVersionSchema,
  status: z.literal('manual_reviewed'),
  reviewedBy: z.literal('content_owner'),
})
export type ManualTranslation = z.infer<typeof manualTranslationSchema>

export const learningContentPairSchema = z.object({
  contentId: idSchema,
  textVersion: semanticVersionSchema,
  english: z.string().min(1).max(1200),
  translation: manualTranslationSchema,
})
export type LearningContentPair = z.infer<typeof learningContentPairSchema>

export const fixedContentLineSchema = z.object({
  id: idSchema,
  speaker: z.enum(['morrow', 'system_example']),
  purpose: z.enum([
    'story',
    'prompt',
    'clarification',
    'confirmation',
    'result',
    'reference_reply',
  ]),
  learningContent: learningContentPairSchema,
  audioRequired: z.boolean(),
  audioIds: z.array(idSchema).max(1),
})
export type FixedContentLine = z.infer<typeof fixedContentLineSchema>

export const audioBindingSchema = z.object({
  audioId: idSchema,
  lineId: idSchema,
  contentId: idSchema,
  textVersion: semanticVersionSchema,
  translationVersion: semanticVersionSchema,
  voiceProfileId: idSchema,
  fileRef: z.string().min(1).max(500),
  checksumSha256: sha256Schema.nullable(),
  status: z.enum(['planned', 'ready', 'retired']),
})
export type AudioBinding = z.infer<typeof audioBindingSchema>

export const keywordGroupSchema = z.object({
  allOf: z.array(z.string().min(1).max(80)),
  anyOf: z.array(z.string().min(1).max(80)),
  noneOf: z.array(z.string().min(1).max(80)),
  weight: z.number().int().min(1).max(100),
})
export type KeywordGroup = z.infer<typeof keywordGroupSchema>

export const fixedIntentSchema = z.object({
  id: idSchema,
  labelZh: z.string().min(1).max(120),
  eligibleStateIds: z.array(idSchema).min(1),
  priority: z.number().int().min(1).max(1000),
  exactPhrases: z.array(z.string().min(1).max(300)),
  keywordGroups: z.array(keywordGroupSchema),
  excludedPhrases: z.array(z.string().min(1).max(160)),
  minimumScore: z.number().int().min(1).max(100),
  requiredMarginOverSecond: z.number().int().min(0).max(100),
})
export type FixedIntent = z.infer<typeof fixedIntentSchema>

export const fixedChoiceSchema = z.object({
  id: idSchema,
  labelZh: z.string().min(1).max(120),
  submitsIntentId: idSchema,
  referenceReplyLineId: idSchema.nullable(),
})
export type FixedChoice = z.infer<typeof fixedChoiceSchema>

export const fixedContentStateSchema = z.object({
  id: idSchema,
  phase: z.enum([
    'opening',
    'input',
    'confirmation',
    'clarification',
    'choice',
    'result',
    'closing',
  ]),
  uiTitleZh: z.string().min(1).max(120),
  userTaskZh: z.string().min(1).max(500),
  lineIds: z.array(idSchema).min(1),
  acceptedInputModes: z.array(fixedContentInputModeSchema).min(1),
  choices: z.array(fixedChoiceSchema),
  referenceReplyLineIds: z.array(idSchema).max(2),
  recoverable: z.literal(true),
  checkpoint: z.boolean(),
  advanceOnlyOnResolvedIntent: z.literal(true),
})
export type FixedContentState = z.infer<typeof fixedContentStateSchema>

export const fixedContentTransitionSchema = z.object({
  id: idSchema,
  fromStateId: idSchema,
  toStateId: z.union([idSchema, z.literal('completed')]),
  onIntentIds: z.array(idSchema).min(1),
  guard: z.string().min(1).max(600),
  outcomeId: idSchema.nullable(),
})
export type FixedContentTransition = z.infer<typeof fixedContentTransitionSchema>

export const fixedWorldStateWriteSchema = z.object({
  key: idSchema,
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
})
export type FixedWorldStateWrite = z.infer<typeof fixedWorldStateWriteSchema>

export const fixedOutcomeSchema = z.object({
  id: idSchema,
  labelZh: z.string().min(1).max(160),
  worldStateWrites: z.array(fixedWorldStateWriteSchema),
  resultLineIds: z.array(idSchema).min(1),
  futureHook: z.string().max(600).nullable(),
})
export type FixedOutcome = z.infer<typeof fixedOutcomeSchema>

export const fixedMemoryRuleSchema = z.object({
  id: idSchema,
  kind: z.enum(['life', 'language', 'relationship']),
  origin: z.enum(['declared_event_rule', 'explicit_user_request']),
  sourceIntentIds: z.array(idSchema),
  contentTemplate: z.string().min(1).max(600),
  requiresUserConfirmation: z.literal(true),
  rejectIfSensitiveInferredOrUnconfirmed: z.literal(true),
})
export type FixedMemoryRule = z.infer<typeof fixedMemoryRuleSchema>

export const fixedEventSchema = z
  .object({
    id: idSchema,
    version: semanticVersionSchema,
    chapterId: idSchema,
    sequence: z.number().int().positive(),
    titleZh: z.string().min(1).max(160),
    estimatedMinutes: z.object({
      min: z.number().int().min(1),
      max: z.number().int().max(10),
    }),
    entryStateId: idSchema,
    lines: z.array(fixedContentLineSchema).min(1),
    intents: z.array(fixedIntentSchema).min(1),
    states: z.array(fixedContentStateSchema).min(2),
    transitions: z.array(fixedContentTransitionSchema).min(1),
    outcomes: z.array(fixedOutcomeSchema).min(2),
    memoryRules: z.array(fixedMemoryRuleSchema),
    boundariesZh: z.array(z.string().min(1).max(600)).min(1),
  })
  .superRefine((event, context) => {
    if (event.estimatedMinutes.min > event.estimatedMinutes.max) {
      context.addIssue({ code: 'custom', path: ['estimatedMinutes'], message: 'min 不能大于 max' })
    }

    const unique = (values: string[]) => new Set(values).size === values.length
    const lineIds = event.lines.map((line) => line.id)
    const contentIds = event.lines.map((line) => line.learningContent.contentId)
    const intentIds = event.intents.map((intent) => intent.id)
    const stateIds = event.states.map((state) => state.id)
    const transitionIds = event.transitions.map((transition) => transition.id)
    const outcomeIds = event.outcomes.map((outcome) => outcome.id)

    for (const [path, values] of [
      ['lines', lineIds],
      ['learningContent', contentIds],
      ['intents', intentIds],
      ['states', stateIds],
      ['transitions', transitionIds],
      ['outcomes', outcomeIds],
    ] as const) {
      if (!unique(values)) {
        context.addIssue({ code: 'custom', path: [path], message: `${path} 内的 ID 必须唯一` })
      }
    }

    if (!stateIds.includes(event.entryStateId)) {
      context.addIssue({ code: 'custom', path: ['entryStateId'], message: '入口状态不存在' })
    }

    const lineIdSet = new Set(lineIds)
    const intentIdSet = new Set(intentIds)
    const stateIdSet = new Set(stateIds)
    const outcomeIdSet = new Set(outcomeIds)

    for (const intent of event.intents) {
      for (const stateId of intent.eligibleStateIds) {
        if (!stateIdSet.has(stateId)) {
          context.addIssue({ code: 'custom', path: ['intents', intent.id], message: `意图引用未知状态 ${stateId}` })
        }
      }
    }

    for (const state of event.states) {
      for (const lineId of [...state.lineIds, ...state.referenceReplyLineIds]) {
        if (!lineIdSet.has(lineId)) {
          context.addIssue({ code: 'custom', path: ['states', state.id], message: `状态引用未知台词 ${lineId}` })
        }
      }
      for (const choice of state.choices) {
        if (!intentIdSet.has(choice.submitsIntentId)) {
          context.addIssue({ code: 'custom', path: ['states', state.id, 'choices'], message: `选项引用未知意图 ${choice.submitsIntentId}` })
        }
        if (choice.referenceReplyLineId && !lineIdSet.has(choice.referenceReplyLineId)) {
          context.addIssue({ code: 'custom', path: ['states', state.id, 'choices'], message: `选项引用未知参考句 ${choice.referenceReplyLineId}` })
        }
      }
    }

    for (const transition of event.transitions) {
      if (!stateIdSet.has(transition.fromStateId)) {
        context.addIssue({ code: 'custom', path: ['transitions', transition.id], message: `迁移起点不存在 ${transition.fromStateId}` })
      }
      if (transition.toStateId !== 'completed' && !stateIdSet.has(transition.toStateId)) {
        context.addIssue({ code: 'custom', path: ['transitions', transition.id], message: `迁移终点不存在 ${transition.toStateId}` })
      }
      for (const intentId of transition.onIntentIds) {
        if (!intentIdSet.has(intentId)) {
          context.addIssue({ code: 'custom', path: ['transitions', transition.id], message: `迁移引用未知意图 ${intentId}` })
        }
      }
      if (transition.outcomeId && !outcomeIdSet.has(transition.outcomeId)) {
        context.addIssue({ code: 'custom', path: ['transitions', transition.id], message: `迁移引用未知结果 ${transition.outcomeId}` })
      }
    }

    for (const outcome of event.outcomes) {
      for (const lineId of outcome.resultLineIds) {
        if (!lineIdSet.has(lineId)) {
          context.addIssue({ code: 'custom', path: ['outcomes', outcome.id], message: `结果引用未知台词 ${lineId}` })
        }
      }
    }

    for (const memoryRule of event.memoryRules) {
      for (const intentId of memoryRule.sourceIntentIds) {
        if (!intentIdSet.has(intentId)) {
          context.addIssue({ code: 'custom', path: ['memoryRules', memoryRule.id], message: `记忆规则引用未知意图 ${intentId}` })
        }
      }
    }
  })
export type FixedEvent = z.infer<typeof fixedEventSchema>

export const fixedFallbackSchema = z.object({
  kind: z.enum(['no_match', 'low_confidence', 'user_denial', 'repeated_input']),
  uiMessageZh: z.string().min(1).max(500),
  keepsCurrentState: z.literal(true),
  advancesEvent: z.literal(false),
  showCandidateIntentLimit: z.number().int().min(0).max(3),
  allowEditableReferenceReplies: z.literal(true),
})
export type FixedFallback = z.infer<typeof fixedFallbackSchema>

export const translationToggleSchema = z.object({
  defaultExpanded: z.literal(false),
  placement: z.literal('learning_content_bottom_right'),
  collapsedLabelZh: z.literal('查看中文'),
  expandedLabelZh: z.literal('收起中文'),
  persistScope: z.literal('current_content_block'),
  affectsAudio: z.literal(false),
  affectsProgress: z.literal(false),
  hideWhenNoLearningContent: z.literal(true),
})
export type TranslationToggle = z.infer<typeof translationToggleSchema>

export const fixedContentRulesetSchema = z
  .object({
    id: z.string().regex(/^fixed-content-v\d+\.\d+\.\d+$/),
    version: semanticVersionSchema,
    schemaVersion: semanticVersionSchema,
    personaVersion: z.string().min(1),
    defaultUiLocale: z.literal('zh-CN'),
    learningLocale: z.literal('en'),
    supportedPlatforms: z.array(fixedContentPlatformSchema).length(3),
    matchingPolicy: z.object({
      normalizers: z.array(z.enum(['unicode_nfkc', 'lowercase', 'trim', 'collapse_whitespace', 'strip_terminal_punctuation'])).min(1),
      order: z.tuple([
        z.literal('explicit_choice'),
        z.literal('exact_phrase'),
        z.literal('keyword_score'),
        z.literal('conflict_check'),
        z.literal('fallback'),
      ]),
      confidenceThreshold: z.number().int().min(1).max(100),
      minimumWinnerMargin: z.number().int().min(0).max(100),
      tieBehavior: z.literal('do_not_advance_show_candidates'),
      denialBehavior: z.literal('discard_temporary_interpretation_and_stay'),
      repeatedInputBehavior: z.literal('do_not_repeat_commit_offer_alternate_input'),
    }),
    fallbacks: z.array(fixedFallbackSchema).length(4),
    translationToggle: translationToggleSchema,
    audioBindings: z.array(audioBindingSchema),
    events: z.array(fixedEventSchema).min(2),
    llmPolicy: z.object({
      adapterRetained: z.literal(true),
      enabledByDefault: z.literal(false),
      coreDependency: z.literal(false),
      permittedFutureRole: z.enum(['none', 'optional_non_authoritative_enhancement']),
      mayAdvanceState: z.literal(false),
      mayWriteMemory: z.literal(false),
      mayCreateContentIds: z.literal(false),
    }),
  })
  .superRefine((ruleset, context) => {
    const eventIds = ruleset.events.map((event) => event.id)
    if (new Set(eventIds).size !== eventIds.length) {
      context.addIssue({ code: 'custom', path: ['events'], message: '规则集内事件 ID 必须唯一' })
    }

    const lineById = new Map(
      ruleset.events.flatMap((event) => event.lines).map((line) => [line.id, line] as const),
    )
    if (lineById.size !== ruleset.events.flatMap((event) => event.lines).length) {
      context.addIssue({ code: 'custom', path: ['events', 'lines'], message: '规则集内台词 ID 必须全局唯一' })
    }

    const audioIds = ruleset.audioBindings.map((binding) => binding.audioId)
    if (new Set(audioIds).size !== audioIds.length) {
      context.addIssue({ code: 'custom', path: ['audioBindings'], message: '音频 ID 必须唯一' })
    }

    const bindingsByLine = new Map<string, AudioBinding[]>()
    for (const binding of ruleset.audioBindings) {
      const line = lineById.get(binding.lineId)
      if (!line) {
        context.addIssue({ code: 'custom', path: ['audioBindings', binding.audioId], message: `音频引用未知台词 ${binding.lineId}` })
        continue
      }
      if (
        binding.contentId !== line.learningContent.contentId ||
        binding.textVersion !== line.learningContent.textVersion ||
        binding.translationVersion !== line.learningContent.translation.version
      ) {
        context.addIssue({ code: 'custom', path: ['audioBindings', binding.audioId], message: '音频绑定的内容或版本与台词不一致' })
      }
      const current = bindingsByLine.get(binding.lineId) ?? []
      current.push(binding)
      bindingsByLine.set(binding.lineId, current)
    }

    for (const line of lineById.values()) {
      const bindings = bindingsByLine.get(line.id) ?? []
      const bindingIds = new Set(bindings.map((binding) => binding.audioId))
      if (line.audioIds.some((audioId) => !bindingIds.has(audioId))) {
        context.addIssue({ code: 'custom', path: ['events', 'lines', line.id, 'audioIds'], message: '台词音频 ID 未在 audioBindings 中声明' })
      }
      if (line.audioRequired && bindings.length !== 1) {
        context.addIssue({ code: 'custom', path: ['audioBindings', line.id], message: '需语音台词必须且只能绑定一个正常语速音频' })
      }
    }
  })
export type FixedContentRuleset = z.infer<typeof fixedContentRulesetSchema>
