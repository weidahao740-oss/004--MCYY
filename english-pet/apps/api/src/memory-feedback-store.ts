import { randomUUID } from 'node:crypto'
import type {
  EventDefinition,
  EventInputMode,
  LanguageFeedback,
  LanguageFeedbackFocus,
  LanguageFeedbackResult,
  Memory,
} from '@english-pet/contracts'
import { MemoryMemoryStore } from './memory-memory-store.js'

interface EventFeedbackInput {
  userId: string
  eventInstanceId: string
  definition: EventDefinition
  expressions: Array<{ text: string; inputMode: EventInputMode }>
  clarificationCount: number
}

interface ConversationFeedbackInput {
  userId: string
  conversationId: string
  expressions: string[]
  onlyWhenBlocking: boolean
}

const feedbackByEvent = new Map<string, LanguageFeedback>()
const feedbackByConversation = new Map<string, LanguageFeedback>()

function normalize(value: string) {
  return value.toLowerCase().replace(/[“”‘’]/g, "'").replace(/[^a-z0-9'\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

function wordCount(value: string) {
  return normalize(value).split(' ').filter(Boolean).length
}

function stem(value: string) {
  return normalize(value.replace(/…/g, ' ')).replace(/\b(i|we|it|the|a|an|to|is|are|was|were)\b/g, ' ').replace(/\s+/g, ' ').trim()
}

function bestNaturalExpression(definition: EventDefinition, original: string) {
  const source = new Set(stem(original).split(' ').filter((part) => part.length > 2))
  return [...definition.keyExpressions]
    .map((expression) => ({
      expression,
      score: stem(expression).split(' ').filter((part) => source.has(part)).length,
    }))
    .sort((a, b) => b.score - a.score)[0]?.expression ?? definition.keyExpressions[0] ?? null
}

function matchesConfiguredPattern(original: string, natural: string | null) {
  if (!natural) return false
  const originalStem = stem(original)
  const naturalTerms = stem(natural).split(' ').filter((part) => part.length > 2)
  return naturalTerms.length > 0 && naturalTerms.some((part) => originalStem.includes(part))
}

function obviousNaturalRewrite(original: string): string | null {
  const normalized = normalize(original)
  const rules: Array<[RegExp, string]> = [
    [/\bi very like\b/, 'I really like…'],
    [/\bi think it mean\b/, 'I think it means…'],
    [/\bi want choose\b/, 'I want to choose…'],
    [/\bi am agree\b/, 'I agree…'],
    [/\baccording to me\b/, 'In my opinion,…'],
    [/\bdiscuss about\b/, 'discuss…'],
  ]
  return rules.find(([pattern]) => pattern.test(normalized))?.[1] ?? null
}

function successFocus(expression: string): LanguageFeedbackFocus {
  return {
    kind: 'success',
    title: 'Your meaning landed',
    titleZh: '你的意思表达成功了',
    explanation: `“${expression}” gave Morrow enough information to respond and move the interaction forward.`,
    explanationZh: `“${expression}”让 Morrow 得到了足够信息，并推动了互动。`,
  }
}

function noExpressionFocus(): LanguageFeedbackFocus {
  return {
    kind: 'success',
    title: 'No expression to review',
    titleZh: '这次没有需要点评的表达',
    explanation: 'You completed this interaction through choices, so no language issue was invented.',
    explanationZh: '你通过选项完成了互动，因此系统不会虚构语言问题。',
  }
}

function naturalnessFocus(original: string, natural: string): LanguageFeedbackFocus {
  return {
    kind: 'naturalness',
    title: 'A smoother option',
    titleZh: '可以更自然一点',
    explanation: `Your original meaning was clear. A reusable option is “${natural}”.`,
    explanationZh: `原表达的意思已经清楚；更适合复用的说法是“${natural}”。`,
  }
}

function clarityFocus(natural: string): LanguageFeedbackFocus {
  return {
    kind: 'clarity',
    title: 'One phrase changed the meaning',
    titleZh: '有一处影响了理解',
    explanation: `Morrow needed clarification before acting. Next time, make the intended meaning explicit with “${natural}”.`,
    explanationZh: `Morrow 在行动前需要确认含义。下次可用“${natural}”直接说清意图。`,
  }
}

function proposeReviewExpression(
  memoryStore: MemoryMemoryStore,
  userId: string,
  source: { conversationId?: string; eventInstanceId?: string },
  original: string,
  reviewExpression: string | null,
  semanticTags: string[],
): Memory | null {
  if (!reviewExpression) return null
  const proposal = {
    kind: 'language' as const,
    content: reviewExpression,
    expression: original,
    naturalExpression: reviewExpression,
    confidence: 'high' as const,
    semanticTags,
  }
  return source.eventInstanceId
    ? memoryStore.proposeFromEventFeedback(userId, source.eventInstanceId, proposal)
    : memoryStore.proposeFromConversation(userId, source.conversationId!, [proposal])[0] ?? null
}

export class MemoryFeedbackStore {
  constructor(private readonly memoryStore: MemoryMemoryStore) {}

  createFromEvent(input: EventFeedbackInput): LanguageFeedback {
    const existing = feedbackByEvent.get(input.eventInstanceId)
    if (existing) return existing

    const selected = [...input.expressions].reverse().find((item) => item.text.trim().length > 0)
    const original = selected?.text.trim() ?? ''
    const configuredNatural = original ? bestNaturalExpression(input.definition, original) : null
    const explicitRewrite = original ? obviousNaturalRewrite(original) : null
    let result: LanguageFeedbackResult = 'successful'
    let naturalExpression: string | null = null
    const focusItems: LanguageFeedbackFocus[] = original ? [successFocus(original)] : [noExpressionFocus()]

    if (original && input.clarificationCount > 0) {
      result = 'affects_understanding'
      naturalExpression = configuredNatural
      focusItems.push(clarityFocus(configuredNatural ?? original))
    } else if (original && explicitRewrite) {
      result = 'more_natural'
      naturalExpression = explicitRewrite ?? configuredNatural
      if (naturalExpression) focusItems.push(naturalnessFocus(original, naturalExpression))
    }

    const reviewExpression = original ? (naturalExpression ?? (matchesConfiguredPattern(original, configuredNatural) ? original : null)) : null
    const memory = proposeReviewExpression(
      this.memoryStore,
      input.userId,
      { eventInstanceId: input.eventInstanceId },
      original,
      reviewExpression,
      ['feedback', input.definition.id, ...input.definition.targetSkills.slice(0, 3)],
    )
    const feedback: LanguageFeedback = {
      id: randomUUID(),
      sourceType: 'event',
      eventInstanceId: input.eventInstanceId,
      conversationId: null,
      result,
      successExpression: original || null,
      originalExpression: naturalExpression ? original : null,
      naturalExpression,
      pronunciationNote: null,
      focusItems: focusItems.slice(0, 3),
      suggestedMemoryId: memory?.status === 'proposed' ? memory.id : null,
      createdAt: new Date().toISOString(),
    }
    feedbackByEvent.set(input.eventInstanceId, feedback)
    return feedback
  }

  createFromConversation(input: ConversationFeedbackInput): LanguageFeedback {
    const existing = feedbackByConversation.get(input.conversationId)
    if (existing) return existing
    const original = [...input.expressions].reverse().find((item) => item.trim().length > 0)?.trim() ?? ''
    const rewrite = input.onlyWhenBlocking ? null : obviousNaturalRewrite(original)
    const result: LanguageFeedbackResult = rewrite ? 'more_natural' : 'successful'
    const focusItems = [successFocus(original)]
    if (rewrite) focusItems.push(naturalnessFocus(original, rewrite))
    const reviewExpression = rewrite
    const memory = proposeReviewExpression(
      this.memoryStore,
      input.userId,
      { conversationId: input.conversationId },
      original,
      reviewExpression,
      ['feedback', 'free_chat'],
    )
    const feedback: LanguageFeedback = {
      id: randomUUID(),
      sourceType: 'conversation',
      eventInstanceId: null,
      conversationId: input.conversationId,
      result,
      successExpression: original || null,
      originalExpression: rewrite ? original : null,
      naturalExpression: rewrite,
      pronunciationNote: null,
      focusItems: focusItems.slice(0, 3),
      suggestedMemoryId: memory?.status === 'proposed' ? memory.id : null,
      createdAt: new Date().toISOString(),
    }
    feedbackByConversation.set(input.conversationId, feedback)
    return feedback
  }
}
