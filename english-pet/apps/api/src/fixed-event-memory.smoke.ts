import assert from 'node:assert/strict'
import { existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { openDatabase } from './sqlite-db.js'
import { SqliteFixedEventEngine } from './sqlite-fixed-event-engine.js'

function asrAdvance(engine: SqliteFixedEventEngine, userId: string, instanceId: string, text: string, idempotencyKey: string) {
  const stateId = engine.current(userId)!.currentState.id
  const proof = engine.issueAsrProof(userId, instanceId, stateId, text)
  return engine.advance(userId, instanceId, { inputMode: 'confirmed_asr_text', text, asrProof: proof.proof, idempotencyKey })
}
import { SqliteJournalStore } from './sqlite-journal-store.js'
import { SqliteMemoryStore } from './sqlite-memory-store.js'

// 必须在首次 openDatabase() 前指定临时 DB，避免污染真实 .data/english-pet.db。
const dbPath = join(tmpdir(), `fixed-event-memory-smoke-${Date.now()}.db`)
process.env.SQLITE_PATH = dbPath

let sequence = 0
function key(label: string) {
  sequence += 1
  return `${label}-${sequence.toString().padStart(4, '0')}`
}

const memoryStore = new SqliteMemoryStore()
const journalStore = new SqliteJournalStore(memoryStore)
const engine = new SqliteFixedEventEngine({ memoryStore, journalStore })

// ── 主用户：文本输入走完 bfv(presence) 与 bro(lamp) ─────────────────────────
const mainUser = 'user-main'

// bfv：start → 继续 → 文本帮助 → 完成
let view = engine.start(mainUser, { eventId: 'birth_first_voice_v1', idempotencyKey: key('bfv-start') })
const bfvInstance = view.instanceId
view = engine.advance(mainUser, bfvInstance, { inputMode: 'choice', choiceId: 'c1e1_choice_open', idempotencyKey: key('bfv-open') })
view = engine.advance(mainUser, bfvInstance, { inputMode: 'choice', choiceId: 'c1e1_choice_presence', idempotencyKey: key('bfv-route') })
view = asrAdvance(engine, mainUser, bfvInstance, "Yes, I'm here.", key('bfv-presence'))
assert.equal(view.outcome?.id, 'c1e1_outcome_presence')
view = engine.advance(mainUser, bfvInstance, { inputMode: 'choice', choiceId: 'c1e1_choice_feedback_presence', idempotencyKey: key('bfv-feedback') })
assert.equal(view.currentState.id, 'c1e1_result')
view = engine.advance(mainUser, bfvInstance, { inputMode: 'choice', choiceId: 'c1e1_choice_finish', idempotencyKey: key('bfv-finish') })
assert.equal(view.status, 'completed')

// bro：start → 继续 → 文本选灯 → 完成
view = engine.start(mainUser, { eventId: 'b1_first_room_object_v1', idempotencyKey: key('bro-start') })
const broInstance = view.instanceId
view = engine.advance(mainUser, broInstance, { inputMode: 'choice', choiceId: 'c1e2_choice_open', idempotencyKey: key('bro-open') })
view = engine.advance(mainUser, broInstance, { inputMode: 'choice', choiceId: 'c1e2_choice_lamp', idempotencyKey: key('bro-route') })
view = asrAdvance(engine, mainUser, broInstance, "I noticed the lamp first.", key('bro-lamp'))
assert.equal(view.currentState.id, 'c1e2_morrow_lamp')
view = engine.advance(mainUser, broInstance, { inputMode: 'choice', choiceId: 'c1e2_choice_morrow_lamp', idempotencyKey: key('bro-morrow') })
view = asrAdvance(engine, mainUser, broInstance, 'What about you?', key('bro-second'))
assert.equal(view.currentState.id, 'c1e2_attitude')
view = engine.advance(mainUser, broInstance, { inputMode: 'choice', choiceId: 'c1e2_choice_interesting', idempotencyKey: key('bro-attitude') })
view = engine.advance(mainUser, broInstance, { inputMode: 'choice', choiceId: 'c1e2_choice_feedback_interesting', idempotencyKey: key('bro-feedback') })
assert.equal(view.outcome?.id, 'c1e2_outcome_lamp')
assert.equal(view.worldState.first_shared_object, undefined)
const broFinishKey = key('bro-finish')
view = engine.advance(mainUser, broInstance, { inputMode: 'choice', choiceId: 'c1e2_choice_finish', idempotencyKey: broFinishKey })
assert.equal(view.status, 'completed')
assert.equal(view.worldState.first_shared_object, 'lamp')

// 记忆提案断言
let listed = memoryStore.list(mainUser, true)
const proposedTexts = listed.proposed.map((m) => m.content)
assert.ok(
  proposedTexts.includes('你和墨洛完成了第一次相互理解。'),
  `缺少 bfv relationship 提案，实际: ${JSON.stringify(proposedTexts)}`,
)
assert.ok(
  proposedTexts.includes('你和墨洛完成了第一次共同观察。'),
  `缺少 E01-02 relationship 提案，实际: ${JSON.stringify(proposedTexts)}`,
)
assert.equal(listed.proposed.some((m) => m.kind === 'language'), false, '现行 E01-02 不生成重复语言长期记忆提案')

// 日记断言：2 条，版本字段为 1.0.0
let journals = journalStore.list(mainUser)
assert.equal(journals.length, 2, `日记应为 2 条，实际 ${journals.length}`)
for (const entry of journals) {
  assert.equal(entry.textVersion, '1.0.0', `textVersion 应为 1.0.0，实际 ${entry.textVersion}`)
  assert.equal(entry.translationVersion, '1.0.0', `translationVersion 应为 1.0.0，实际 ${entry.translationVersion}`)
}

// ── 幂等重放：同一 idempotencyKey 重放完成步，提案数不变 ──────────────────
const beforeReplay = memoryStore.list(mainUser, true).proposed.length
engine.advance(mainUser, broInstance, { inputMode: 'choice', choiceId: 'c1e2_choice_finish', idempotencyKey: broFinishKey })
const afterReplay = memoryStore.list(mainUser, true).proposed.length
assert.equal(afterReplay, beforeReplay, '重放完成步不应产生新提案')

// ── 重启持久化：再 new 引擎读同一 DB，提案与日记仍在 ──────────────────────
const engine2 = new SqliteFixedEventEngine({ memoryStore, journalStore })
assert.equal(engine2.current(mainUser), null)
listed = memoryStore.list(mainUser, true)
assert.ok(listed.proposed.map((m) => m.content).includes('你和墨洛完成了第一次共同观察。'), '重启后 E01-02 relationship 提案丢失')
journals = journalStore.list(mainUser)
assert.equal(journals.length, 2, '重启后日记数量变化')

// ── 暂停路径用户：稍后继续后保持 paused，不完成、不产生 relationship 提案 ──────────
const pauseUser = 'user-pause'
view = engine.start(pauseUser, { eventId: 'birth_first_voice_v1', idempotencyKey: key('pz-start') })
const pauseInstance = view.instanceId
view = engine.pause(pauseUser, pauseInstance, key('pz-pause'))
assert.equal(view.status, 'paused')
assert.equal(engine.catalog(pauseUser).find((item) => item.eventId === 'birth_first_voice_v1')?.status, 'available')
const pauseListed = memoryStore.list(pauseUser, true)
assert.equal(
  pauseListed.proposed.filter((m) => m.kind === 'relationship').length,
  0,
  '暂停路径不应产生 relationship 提案',
)

// ── clearUser 级联后 list 为空 ────────────────────────────────────────────
memoryStore.clearUser(mainUser)
journalStore.clearUser(mainUser)
engine.clearUser(mainUser)
assert.equal(memoryStore.list(mainUser, true).proposed.length, 0)
assert.equal(journalStore.list(mainUser).length, 0)

// 清理临时 DB（含 WAL/SHM）。先关闭句柄，避免 Windows EBUSY。
openDatabase().close()
for (const suffix of ['', '-wal', '-shm']) {
  const p = dbPath + suffix
  if (existsSync(p)) rmSync(p, { force: true })
}

console.log(JSON.stringify({
  ok: true,
  checks: [
    'bfv-relationship-proposal',
    'bro-relationship-proposal-with-lamp',
    'bro-no-duplicate-language-long-term-memory',
    'journals-two-entries-with-version-1.0.0',
    'idempotent-replay-no-duplicate-proposal',
    'restart-persistence',
    'pause-path-no-relationship-proposal',
    'clearUser-empties-memories-and-journals',
  ],
}, null, 2))
