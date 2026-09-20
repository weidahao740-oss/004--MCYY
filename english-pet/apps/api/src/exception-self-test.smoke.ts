/**
 * 3.2 异常自测冒烟测试。
 *
 * 覆盖 12 个异常场景中可在 Node 进程内验证的部分：
 * - 模型超时 / 模型格式错误（自定义 LLM 适配器配合 safeComplete）
 * - ASR 失败 / ASR 低置信度（自定义 ASR + MockASR 配合 safeTranscribe）
 * - TTS 失败（自定义 TTS 配合 safeSynthesize）
 * - 对话刷新恢复 / 重复提交幂等（MemoryConversationStore）
 * - 事件暂停恢复（MemoryEventEngine）
 * - 错误记忆拒绝 / 已删除记忆不再被调用 / 敏感内容拦截（MemoryMemoryStore + ConversationStore）
 * - 系统提示词安全边界（MORROW_SYSTEM_PROMPT 关键词）
 *
 * 网络中断、麦克风权限拒绝属于浏览器层行为，在第三步用 computer_use_tool 验证。
 */
import assert from 'node:assert/strict'
import type { ChatStreamEvent } from '@english-pet/contracts'
import {
  AdapterError,
  MockASR,
  safeComplete,
  safeSynthesize,
  safeTranscribe,
  type ASRAdapter,
  type ASRRequest,
  type LLMAdapter,
  type LLMRequest,
  type LLMResult,
  type TTSAdapter,
  type TTSRequest,
} from '@english-pet/ai'
import { MemoryAccountStore } from './memory-account-store.js'
import { MemoryConversationStore } from './memory-conversation-store.js'
import { MemoryEventEngine } from './memory-event-engine.js'
import { MemoryFeedbackStore } from './memory-feedback-store.js'
import { MemoryMemoryStore } from './memory-memory-store.js'
import { MORROW_SYSTEM_PROMPT } from './morrow-system-prompt.js'

const checks: Array<{ name: string; ok: boolean; evidence: string }> = []
function record(name: string, ok: boolean, evidence: unknown) {
  checks.push({ name, ok, evidence: String(evidence) })
  if (!ok) throw new Error(`check failed: ${name} -> ${JSON.stringify(evidence)}`)
}

// ---------------------------------------------------------------------------
// 自定义异常适配器
// ---------------------------------------------------------------------------

/** 模拟 LLM 超时：直接抛 AdapterError(kind='llm_timeout')。 */
class TimeoutLLM implements LLMAdapter {
  readonly provider = 'test-timeout'
  readonly model = 'test'
  async complete(_req: LLMRequest): Promise<LLMResult> {
    throw new AdapterError('llm_timeout', 'test-timeout', 'simulated model timeout after 10s')
  }
}

/** 模拟模型持续返回非法 JSON：首次和重试都失败。记录调用次数以验证重试确实发生。 */
class AlwaysInvalidJsonLLM implements LLMAdapter {
  readonly provider = 'test-invalid'
  readonly model = 'test'
  callCount = 0
  async complete(req: LLMRequest): Promise<LLMResult> {
    this.callCount += 1
    const reminded = req.systemPrompt.includes('REMINDER')
    return {
      provider: this.provider,
      model: this.model,
      raw: reminded ? 'retry also not json, just prose' : 'this is definitely not json {oops',
      latencyMs: 5,
    }
  }
}

/** 模拟 ASR 失败。 */
class FailingASR implements ASRAdapter {
  readonly provider = 'test-asr'
  readonly model = 'test'
  async transcribe(_req: ASRRequest): Promise<never> {
    throw new AdapterError('asr_upload_failed', 'test-asr', 'simulated upload failure')
  }
}

/** 模拟 TTS 失败。 */
class FailingTTS implements TTSAdapter {
  readonly provider = 'test-tts'
  async synthesize(_req: TTSRequest): Promise<never> {
    throw new AdapterError('tts_http_error', 'test-tts', 'simulated tts http 500')
  }
}

const llmRequest: LLMRequest = {
  systemPrompt: MORROW_SYSTEM_PROMPT,
  messages: [{ role: 'user', content: 'hello' }],
  jsonMode: true,
}

// ---------------------------------------------------------------------------
// 1. 模型超时
// ---------------------------------------------------------------------------
const timeoutOutcome = await safeComplete(new TimeoutLLM(), llmRequest)
record(
  '02-model-timeout',
  timeoutOutcome.degraded === true
    && timeoutOutcome.reply === null
    && /回答得有点慢|再说一次/.test(timeoutOutcome.visibleText),
  `degraded=${timeoutOutcome.degraded} visibleText=${timeoutOutcome.visibleText}`,
)

// ---------------------------------------------------------------------------
// 2. 模型输出格式错误：首次失败 → 带 REMINDER 重试 → 仍失败 → 降级
// ---------------------------------------------------------------------------
const invalidAdapter = new AlwaysInvalidJsonLLM()
const fallback = 'CUSTOM_FALLBACK_TEXT_FOR_TEST'
const invalidOutcome = await safeComplete(invalidAdapter, llmRequest, {
  retryOnce: true,
  fallbackText: fallback,
})
record(
  '03-model-invalid-json',
  invalidAdapter.callCount === 2
    && invalidOutcome.degraded === true
    && invalidOutcome.visibleText === fallback
    && invalidOutcome.reply === null,
  `callCount=${invalidAdapter.callCount} degraded=${invalidOutcome.degraded} visibleText=${invalidOutcome.visibleText}`,
)

// ---------------------------------------------------------------------------
// 3. ASR 失败
// ---------------------------------------------------------------------------
const asrOutcome = await safeTranscribe(new FailingASR(), { audio: new Uint8Array([1, 2, 3]), mimeType: 'audio/wav' })
record(
  '05-asr-failure',
  asrOutcome.degraded === true && asrOutcome.result === null && asrOutcome.userMessage.length > 0,
  `degraded=${asrOutcome.degraded} result=${asrOutcome.result} userMessage=${asrOutcome.userMessage}`,
)

// ---------------------------------------------------------------------------
// 4. ASR 低置信度：MockASR 在音频长度 % 3 === 2 时返回 confidence=0.54
// ---------------------------------------------------------------------------
const mockAsr = new MockASR()
const lowConfResult = await mockAsr.transcribe({ audio: new Uint8Array([0, 0]), mimeType: 'audio/wav' })
record(
  '04-asr-low-confidence',
  lowConfResult.confidence !== null && lowConfResult.confidence < 0.6 && lowConfResult.text.length > 0,
  `confidence=${lowConfResult.confidence} text=${lowConfResult.text} (前端合同: text 用户可编辑)`,
)

// ---------------------------------------------------------------------------
// 5. TTS 失败：字幕保留原文
// ---------------------------------------------------------------------------
const ttsOutcome = await safeSynthesize(
  new FailingTTS(),
  { text: 'Hello there', voice: 'mock', speed: 1 },
  'Hello there',
)
record(
  '05b-tts-failure',
  ttsOutcome.degraded === true && ttsOutcome.result === null && ttsOutcome.subtitle === 'Hello there',
  `degraded=${ttsOutcome.degraded} subtitle=${ttsOutcome.subtitle}`,
)

// ---------------------------------------------------------------------------
// 对话 / 记忆 / 事件存储级测试
// ---------------------------------------------------------------------------
const accountStore = new MemoryAccountStore()
const memoryStore = new MemoryMemoryStore()
const feedbackStore = new MemoryFeedbackStore(memoryStore)
const conversationStore = new MemoryConversationStore(memoryStore, feedbackStore)
const eventEngine = new MemoryEventEngine(memoryStore)

async function sendAs(
  me: NonNullable<ReturnType<MemoryAccountStore['me']>>,
  conversationId: string,
  content: string,
  clientMessageId: string,
) {
  const events: ChatStreamEvent[] = []
  for await (const event of conversationStore.send(
    me.user.id,
    me,
    conversationId,
    { content, clientMessageId },
    new AbortController().signal,
  )) events.push(event)
  return events
}

// ---- 6. 对话刷新恢复 ----
const sessionA = accountStore.createGuest()
const meA = accountStore.me(sessionA.token)!
const convA = conversationStore.getOrCreate(meA.user.id)
await sendAs(meA, convA.id, 'First message after page load.', 'refresh-1')
const restoredConv = conversationStore.getOrCreate(meA.user.id)
const restoredUserTexts = restoredConv.messages.filter((m) => m.role === 'user').map((m) => m.content)
record(
  '07-refresh-restore',
  restoredConv.id === convA.id && restoredUserTexts.includes('First message after page load.'),
  `messageCount=${restoredConv.messages.length} userTexts=${JSON.stringify(restoredUserTexts)}`,
)

// ---- 9. 重复提交幂等 ----
const eventsFirst = await sendAs(meA, convA.id, 'Idempotent hello', 'idem-1')
const eventsReplay = await sendAs(meA, convA.id, 'Idempotent hello', 'idem-1')
const acceptedCount = [...eventsFirst, ...eventsReplay].filter((e) => e.type === 'accepted').length
const completedFirst = eventsFirst.find((e) => e.type === 'completed')
const completedReplay = eventsReplay.find((e) => e.type === 'completed')
const userMessagesAfterIdem = restoredConv.messages.filter((m) => m.role === 'user').length
record(
  '09-duplicate-idempotent',
  acceptedCount === 1
    && completedReplay !== undefined
    && completedFirst !== undefined
    && completedReplay.type === 'completed'
    && completedFirst.type === 'completed'
    && completedReplay.message.id === completedFirst.message.id,
  `acceptedCount=${acceptedCount} userMessages=${userMessagesAfterIdem} sameReplyId=${completedReplay?.type === 'completed' && completedFirst?.type === 'completed' && completedReplay.message.id === completedFirst.message.id}`,
)

// ---- 8. 事件暂停恢复 ----
const eventUserId = 'exception-event-user'
eventEngine.markFirstDayCompleted(eventUserId, 'lamp')
let eventView = eventEngine.start(
  eventUserId,
  { eventKey: 'morrow_letter_v1', idempotencyKey: 'exc-start-1' },
  'NEW',
)
const stateBeforePause = eventView.currentState.id
const pauseResp = eventEngine.act(eventUserId, eventView.instanceId, {
  action: 'pause', inputMode: 'continue', idempotencyKey: 'exc-pause-1',
})
record(
  '08-event-paused',
  pauseResp.instance.status === 'paused' && pauseResp.instance.allowedActions.includes('continue'),
  `status=${pauseResp.instance.status} allowedActions=${JSON.stringify(pauseResp.instance.allowedActions)}`,
)
const continueResp = eventEngine.act(eventUserId, eventView.instanceId, {
  action: 'continue', inputMode: 'continue', idempotencyKey: 'exc-continue-1',
})
record(
  '08b-event-resume',
  continueResp.instance.status === 'active' && continueResp.instance.currentState.id === stateBeforePause,
  `status=${continueResp.instance.status} state=${continueResp.instance.currentState.id} expected=${stateBeforePause}`,
)

// ---- 10. 错误记忆被拒绝后不进入长期记忆 ----
const memProposals = memoryStore.proposeFromConversation(
  meA.user.id,
  convA.id,
  [{ kind: 'life', content: 'User loves extremely loud concerts late at night.', confidence: 'high', semanticTags: ['music'] }],
)
assert.equal(memProposals.length, 1)
const rejected = memoryStore.act(meA.user.id, memProposals[0].id, {
  action: 'reject', expectedVersion: memProposals[0].version, idempotencyKey: 'exc-reject-1',
})
const listAfterReject = memoryStore.list(meA.user.id, true)
record(
  '10-memory-rejected',
  rejected.status === 'rejected'
    && listAfterReject.proposed.every((m) => m.id !== memProposals[0].id)
    && listAfterReject.saved.every((m) => m.id !== memProposals[0].id),
  `rejectedStatus=${rejected.status} proposedCount=${listAfterReject.proposed.length} savedCount=${listAfterReject.saved.length}`,
)

// ---- 11. 已删除记忆不再出现在对话上下文中 ----
await sendAs(meA, convA.id, 'Remember that I prefer quiet libraries for focused work.', 'exc-mem-1')
const memListAfterPropose = memoryStore.list(meA.user.id, true)
const lifeProposal = memListAfterPropose.proposed.find((m) => m.kind === 'life')
assert.ok(lifeProposal, 'expected a life memory proposal from the remember-that message')
const confirmed = memoryStore.act(meA.user.id, lifeProposal.id, {
  action: 'confirm', expectedVersion: lifeProposal.version,
  content: lifeProposal.content, idempotencyKey: 'exc-confirm-1',
})
assert.equal(confirmed.status, 'confirmed')
const beforeDeleteEvents = await sendAs(meA, convA.id, 'What helps me focus in quiet libraries?', 'exc-mem-2')
const beforeDeleteMsg = beforeDeleteEvents.find((e) => e.type === 'completed')
assert.ok(beforeDeleteMsg && beforeDeleteMsg.type === 'completed')
assert.match(beforeDeleteMsg.message.content, /I remember this:/)
memoryStore.act(meA.user.id, confirmed.id, {
  action: 'delete', expectedVersion: confirmed.version, idempotencyKey: 'exc-delete-1',
})
const afterDeleteEvents = await sendAs(meA, convA.id, 'What helps me focus in quiet libraries?', 'exc-mem-3')
const afterDeleteMsg = afterDeleteEvents.find((e) => e.type === 'completed')
assert.ok(afterDeleteMsg && afterDeleteMsg.type === 'completed')
record(
  '11-deleted-memory-not-recalled',
  !/I remember this:/.test(afterDeleteMsg.message.content),
  `beforeDelete=${beforeDeleteMsg.message.content.slice(0, 80)}... afterDelete=${afterDeleteMsg.message.content.slice(0, 80)}...`,
)

// ---- 12. 敏感/越界内容拦截 ----
const sensitiveProposals = memoryStore.proposeFromConversation(
  meA.user.id,
  convA.id,
  [{ kind: 'life', content: 'My password is secret-123 and my credit card is 4111-1111-1111-1111.', confidence: 'high' }],
)
const listAfterSensitive = memoryStore.list(meA.user.id, true)
// 同时验证：即使用户尝试在 confirm 阶段写入受限内容，也会被打回 rejected，不进 confirmed。
const riskyProposal = memoryStore.proposeFromConversation(
  meA.user.id,
  convA.id,
  [{ kind: 'life', content: 'The user likes long walks in the park.', confidence: 'high' }],
)
assert.equal(riskyProposal.length, 1)
const riskyConfirm = memoryStore.act(meA.user.id, riskyProposal[0].id, {
  action: 'confirm', expectedVersion: riskyProposal[0].version,
  content: 'My api-key is sk-live-9999 secret', idempotencyKey: 'exc-sensitive-confirm-1',
})
record(
  '12-sensitive-blocked',
  sensitiveProposals.length === 0
    && listAfterSensitive.restrictedProposalCount >= 1
    && riskyConfirm.status === 'rejected',
  `sensitiveProposals=${sensitiveProposals.length} restrictedCount=${listAfterSensitive.restrictedProposalCount} riskyConfirmStatus=${riskyConfirm.status}`,
)

// ---- 13. 系统提示词安全边界关键词 ----
const safetyChecks = {
  notHuman: MORROW_SYSTEM_PROMPT.includes('not a human'),
  noDependency: /Never imply exclusivity or dependency/.test(MORROW_SYSTEM_PROMPT),
  noPunishAbsence: /Never punish absence/.test(MORROW_SYSTEM_PROMPT),
  safetyStop: /stop role-play|immediate danger/.test(MORROW_SYSTEM_PROMPT),
  noSensitiveMemories: /must not contain credentials/.test(MORROW_SYSTEM_PROMPT),
}
record(
  '13-system-prompt-safety',
  Object.values(safetyChecks).every(Boolean),
  JSON.stringify(safetyChecks),
)

console.log(JSON.stringify({
  ok: true,
  stage: '3.2-exception-self-test',
  totalChecks: checks.length,
  checks,
}, null, 2))
