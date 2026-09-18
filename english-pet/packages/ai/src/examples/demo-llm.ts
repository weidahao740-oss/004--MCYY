/**
 * demo-llm.ts — 用 Mock LLM 跑一次完整对话，打印结构化输出与 Schema 校验结果。
 * 运行：npx tsx src/examples/demo-llm.ts
 */
import { MockLLM, parseMorrowReply, filterMemoryProposals, safeComplete } from '../index.js'

async function main(): Promise<void> {
  const llm = new MockLLM()

  const systemPrompt =
    'You are Morrow. Return valid JSON matching the morrow-reply-1.0 schema. ' +
    'Keep reply_text under 800 chars. Ask at most one question.'

  const request = {
    systemPrompt,
    jsonMode: true,
    messages: [
      { role: 'user' as const, content: 'I woke up at five today, the traffic was terrible.' },
    ],
  }

  console.log('=== [1] 原始调用（Mock LLM）===')
  const raw = await llm.complete(request)
  console.log('provider:', raw.provider, '| model:', raw.model, '| latencyMs:', raw.latencyMs)
  console.log('usage:', raw.usage)

  console.log('\n=== [2] Schema 校验 ===')
  const parsed = parseMorrowReply(raw.raw)
  if (!parsed.ok) {
    console.error('校验失败:', parsed.error, parsed.issues)
    process.exitCode = 1
    return
  }
  console.log('校验通过: morrow-reply-1.0')
  console.log('reply_text :', parsed.value.reply_text)
  console.log('emotion    :', parsed.value.emotion)
  console.log('event      :', parsed.value.event.action, '→', parsed.value.event.proposed_next_state)
  console.log('question   :', parsed.value.question_count)

  console.log('\n=== [3] 记忆提案（需用户确认后才落库）===')
  const proposals = filterMemoryProposals(parsed.value)
  if (proposals.length === 0) {
    console.log('本轮无记忆提案。')
  } else {
    for (const p of proposals) {
      console.log(`- [${p.kind}/${p.action}/${p.confidence}] ${p.content} (confirmation=${p.requires_user_confirmation})`)
    }
  }

  console.log('\n=== [4] safeComplete 降级包装（同一请求再跑一次，走完整链路）===')
  const safe = await safeComplete(llm, request)
  console.log('degraded   :', safe.degraded, '| errorCode:', safe.errorCode)
  console.log('visibleText:', safe.visibleText)
}

main().catch((err) => {
  console.error('demo 运行失败:', err)
  process.exitCode = 1
})
