import type {
  FixedEvent,
  FixedFallback,
  FixedIntent,
  FixedContentInputMode,
  MatchingPolicy,
} from '@english-pet/contracts'

/**
 * 确定性意图预览（N2）。
 *
 * 纯函数：不读写任何 store、不推进状态、不产生副作用。输入一个 fixed-content 事件与一段用户输入，
 * 按 matchingPolicy 声明的顺序与硬规则计算最可能的意图，返回"是否唯一解析 + 候选列表 + 提示语"。
 *
 * 匹配顺序（与 policy.order 对齐）：
 *   1. explicit_choice  —— inputMode=choice 且带 choiceId 时，直接解析该选项的 submitsIntentId。
 *   2. exact_phrase      —— 标准化后与意图 exactPhrases 完全相等，记强分。
 *   3. keyword_score    —— 对 eligible 意图的 keywordGroups 计分（allOf 全中 / anyOf 至少一 / noneOf 全不中，累加 weight）。
 *   4. conflict_check    —— excludedPhrases 命中的意图直接出局；再做阈值与领先第二判定。
 *   5. fallback          —— 不满足唯一解析条件时 no_match，回带按 priority 降序的至多 3 个候选。
 *
 * stateId 存在时只在其 eligibleStateIds 命中的意图里匹配；stateId 缺省时对事件全部意图匹配，
 * 并在 no_match 时按 priority 取候选。
 */

export interface IntentMatcherInput {
  inputMode: FixedContentInputMode
  text?: string
  choiceId?: string
}

export interface IntentMatcherRequest {
  event: FixedEvent
  stateId?: string
  input: IntentMatcherInput
  policy: MatchingPolicy
  fallbacks: FixedFallback[]
}

export interface IntentMatcherCandidate {
  intentId: string
  labelZh: string
}

export interface IntentMatcherResult {
  resolvedIntentId?: string
  candidates: IntentMatcherCandidate[]
  fallbackKind?: 'no_match'
  messageZh: string
}

/** 标准化工具：按 matchingPolicy.normalizers 声明顺序逐段应用。绝不删除 not/don't/can't 等否定词。 */
function normalizeByPolicy(text: string, normalizers: MatchingPolicy['normalizers']): string {
  let value = text
  for (const normalizer of normalizers) {
    switch (normalizer) {
      case 'unicode_nfkc':
        value = value.normalize('NFKC')
        break
      case 'lowercase':
        value = value.toLowerCase()
        break
      case 'trim':
        value = value.trim()
        break
      case 'collapse_whitespace':
        value = value.replace(/\s+/g, ' ')
        break
      case 'strip_terminal_punctuation':
        // 仅剥离字符串末尾的标点/符号，保留词内撇号（can't / don't）。
        value = value.replace(/[\p{P}\p{S}]+$/u, '').trim()
        break
    }
  }
  return value
}

interface ScoredIntent {
  intent: FixedIntent
  score: number
  excluded: boolean
}

function intentById(event: FixedEvent, intentId: string): FixedIntent | undefined {
  return event.intents.find((intent) => intent.id === intentId)
}

function findChoice(event: FixedEvent, choiceId: string) {
  for (const state of event.states) {
    const choice = state.choices.find((entry) => entry.id === choiceId)
    if (choice) return choice
  }
  return undefined
}

function candidateOf(intent: FixedIntent): IntentMatcherCandidate {
  return { intentId: intent.id, labelZh: intent.labelZh }
}

function noMatchMessage(fallbacks: FixedFallback[]): string {
  const fallback = fallbacks.find((entry) => entry.kind === 'no_match')
  return fallback?.uiMessageZh ?? '我还不能可靠判断你的意思。'
}

/** 收集 eligible 意图：stateId 命中 eligibleStateIds 的子集，否则事件全部意图。 */
function eligibleIntents(event: FixedEvent, stateId?: string): FixedIntent[] {
  if (!stateId) return event.intents
  return event.intents.filter((intent) => intent.eligibleStateIds.includes(stateId))
}

export function previewFixedContentIntent(request: IntentMatcherRequest): IntentMatcherResult {
  const { event, stateId, input, policy, fallbacks } = request
  const normalized = normalizeByPolicy(input.text ?? '', policy.normalizers)

  // 候选意图集合（按 priority 降序，供 no_match 回带与并列兜底）。
  const eligible = eligibleIntents(event, stateId).slice().sort((a, b) => b.priority - a.priority)

  const candidates = (intents: FixedIntent[], limit = 3): IntentMatcherCandidate[] =>
    intents.slice(0, limit).map(candidateOf)

  // ① 显式选项：直接解析其 submitsIntentId，不做阈值判定。
  if (input.inputMode === 'choice' && input.choiceId) {
    const choice = findChoice(event, input.choiceId)
    if (choice) {
      const resolved = intentById(event, choice.submitsIntentId)
      return {
        resolvedIntentId: choice.submitsIntentId,
        candidates: resolved ? [candidateOf(resolved)] : [{ intentId: choice.submitsIntentId, labelZh: choice.submitsIntentId }],
        messageZh: '已识别你的选择。',
      }
    }
    // 选项不存在则继续走文本/关键词匹配（无文本时自然 no_match）。
  }

  // 没有可参与匹配的文本时，直接走 no_match 回带候选。
  if (normalized.length === 0) {
    return {
      candidates: candidates(eligible),
      fallbackKind: 'no_match',
      messageZh: noMatchMessage(fallbacks),
    }
  }

  // ②③④ 对每个 eligible 意图计分。
  const scored: ScoredIntent[] = eligible.map((intent) => {
    const normalizedExcluded = intent.excludedPhrases.map((phrase) => normalizeByPolicy(phrase, policy.normalizers))
    const excluded = normalizedExcluded.some((phrase) => phrase.length > 0 && normalized.includes(phrase))

    let score = 0
    // 精确短语命中：标准化后与某条 exactPhrase 完全相等，记强分。
    const exactHit = intent.exactPhrases.some((phrase) => normalizeByPolicy(phrase, policy.normalizers) === normalized)
    if (exactHit) score += 100

    // 关键词组计分：allOf 全中、anyOf 至少一、noneOf 全不中才累加 weight。
    for (const group of intent.keywordGroups) {
      const allHit = group.allOf.every((keyword) => normalized.includes(normalizeByPolicy(keyword, policy.normalizers)))
      const anyHit =
        group.anyOf.length === 0 ||
        group.anyOf.some((keyword) => normalized.includes(normalizeByPolicy(keyword, policy.normalizers)))
      const noneHit = group.noneOf.some((keyword) => normalized.includes(normalizeByPolicy(keyword, policy.normalizers)))
      if (allHit && anyHit && !noneHit) score += group.weight
    }

    return { intent, score, excluded }
  })

  // 排除短语命中的意图出局。
  const contenders = scored
    .filter((entry) => !entry.excluded)
    .sort((a, b) => b.score - a.score || b.intent.priority - a.intent.priority)

  const winner = contenders[0]
  const runnerUp = contenders[1]
  const secondScore = runnerUp ? runnerUp.score : 0

  // ⑤ 唯一最高分判定：≥ 全局 confidenceThreshold、≥ 该意图 minimumScore，且领先第二 ≥ requiredMarginOverSecond。
  const resolvable =
    winner &&
    winner.score >= policy.confidenceThreshold &&
    winner.score >= winner.intent.minimumScore &&
    winner.score - secondScore >= winner.intent.requiredMarginOverSecond

  if (resolvable) {
    return {
      resolvedIntentId: winner.intent.id,
      candidates: [candidateOf(winner.intent)],
      messageZh: '已根据输入预览到一个明确意图。',
    }
  }

  return {
    candidates: candidates(eligible),
    fallbackKind: 'no_match',
    messageZh: noMatchMessage(fallbacks),
  }
}
