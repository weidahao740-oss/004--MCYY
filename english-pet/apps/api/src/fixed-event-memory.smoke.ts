import assert from 'node:assert/strict'
import { existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { openDatabase } from './sqlite-db.js'
import { SqliteFixedEventEngine } from './sqlite-fixed-event-engine.js'
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

// ── 主用户：文本输入走完 bfv(help) 与 bro(lamp) ─────────────────────────
const mainUser = 'user-main'

// bfv：start → 继续 → 文本帮助 → 完成
let view = engine.start(mainUser, { eventId: 'birth_first_voice_v1', idempotencyKey: key('bfv-start') })
const bfvInstance = view.instanceId
view = engine.advance(mainUser, bfvInstance, { inputMode: 'choice', choiceId: 'bfv_choice_continue', idempotencyKey: key('bfv-open') })
view = engine.advance(mainUser, bfvInstance, { inputMode: 'text', text: 'Let me help you.', idempotencyKey: key('bfv-help') })
assert.equal(view.outcome?.id, 'bfv_outcome_helped')
view = engine.advance(mainUser, bfvInstance, { inputMode: 'choice', choiceId: 'bfv_choice_finish', idempotencyKey: key('bfv-finish') })
assert.equal(view.status, 'completed')

// bro：start → 继续 → 文本选灯 → 完成
view = engine.start(mainUser, { eventId: 'birth_restore_object_v1', idempotencyKey: key('bro-start') })
const broInstance = view.instanceId
view = engine.advance(mainUser, broInstance, { inputMode: 'choice', choiceId: 'bro_choice_continue', idempotencyKey: key('bro-open') })
view = engine.advance(mainUser, broInstance, { inputMode: 'text', text: "Let's bring back the lamp.", idempotencyKey: key('bro-lamp') })
assert.equal(view.outcome?.id, 'bro_outcome_lamp')
assert.equal(view.worldState.first_restored_object, 'lamp')
const broFinishKey = key('bro-finish')
view = engine.advance(mainUser, broInstance, { inputMode: 'choice', choiceId: 'bro_choice_finish', idempotencyKey: broFinishKey })
assert.equal(view.status, 'completed')

// 记忆提案断言
let listed = memoryStore.list(mainUser, true)
const proposedTexts = listed.proposed.map((m) => m.content)
assert.ok(
  proposedTexts.includes('你和 Morrow 完成了第一次相互理解。'),
  `缺少 bfv relationship 提案，实际: ${JSON.stringify(proposedTexts)}`,
)
assert.ok(
  proposedTexts.includes('你和 Morrow 一起让 lamp 回到了房间。'),
  `缺少 bro relationship 提案，实际: ${JSON.stringify(proposedTexts)}`,
)
const broLanguage = listed.proposed.find((m) => m.kind === 'language')
assert.ok(broLanguage, '缺少 bro language 提案')
assert.equal(broLanguage!.content, "Let's bring back the lamp.")
assert.equal(broLanguage!.expression, "Let's bring back the lamp.")

// 日记断言：2 条，版本字段为 1.0.0
let journals = journalStore.list(mainUser)
assert.equal(journals.length, 2, `日记应为 2 条，实际 ${journals.length}`)
for (const entry of journals) {
  assert.equal(entry.textVersion, '1.0.0', `textVersion 应为 1.0.0，实际 ${entry.textVersion}`)
  assert.equal(entry.translationVersion, '1.0.0', `translationVersion 应为 1.0.0，实际 ${entry.translationVersion}`)
}

// ── 幂等重放：同一 idempotencyKey 重放完成步，提案数不变 ──────────────────
const beforeReplay = memoryStore.list(mainUser, true).proposed.length
engine.advance(mainUser, broInstance, { inputMode: 'choice', choiceId: 'bro_choice_finish', idempotencyKey: broFinishKey })
const afterReplay = memoryStore.list(mainUser, true).proposed.length
assert.equal(afterReplay, beforeReplay, '重放完成步不应产生新提案')

// ── 重启持久化：再 new 引擎读同一 DB，提案与日记仍在 ──────────────────────
const engine2 = new SqliteFixedEventEngine({ memoryStore, journalStore })
assert.equal(engine2.current(mainUser), null)
listed = memoryStore.list(mainUser, true)
assert.ok(listed.proposed.map((m) => m.content).includes('你和 Morrow 一起让 lamp 回到了房间。'), '重启后 bro relationship 提案丢失')
journals = journalStore.list(mainUser)
assert.equal(journals.length, 2, '重启后日记数量变化')

// ── 暂停路径用户：走 bfv_intent_pause 完成，无 relationship 提案 ──────────
const pauseUser = 'user-pause'
view = engine.start(pauseUser, { eventId: 'birth_first_voice_v1', idempotencyKey: key('pz-start') })
const pauseInstance = view.instanceId
view = engine.advance(pauseUser, pauseInstance, { inputMode: 'choice', choiceId: 'bfv_choice_later', idempotencyKey: key('pz-pause') })
assert.equal(view.outcome?.id, 'bfv_outcome_paused')
view = engine.advance(pauseUser, pauseInstance, { inputMode: 'choice', choiceId: 'bfv_choice_finish', idempotencyKey: key('pz-finish') })
assert.equal(view.status, 'completed')
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
    'bro-language-proposal-matches-confirmed-sentence',
    'journals-two-entries-with-version-1.0.0',
    'idempotent-replay-no-duplicate-proposal',
    'restart-persistence',
    'pause-path-no-relationship-proposal',
    'clearUser-empties-memories-and-journals',
  ],
}, null, 2))
