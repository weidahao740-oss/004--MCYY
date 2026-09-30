import assert from 'node:assert/strict'
import { existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fromJson, openDatabase } from './sqlite-db.js'
import { SqliteFixedEventEngine } from './sqlite-fixed-event-engine.js'

// 必须在首次 openDatabase() 前指定临时 DB，避免污染真实 .data/english-pet.db。
const dbPath = join(tmpdir(), `fixed-event-smoke-${Date.now()}.db`)
process.env.SQLITE_PATH = dbPath

let sequence = 0
function key(label: string) {
  sequence += 1
  return `${label}-${sequence.toString().padStart(4, '0')}`
}

// ── 主用户：走完 bfv(help) 与 bro(lamp) ──────────────────────────────────
const mainUser = 'user-main'
const engine = new SqliteFixedEventEngine()

// 初始目录：bfv available，bro locked。
let catalog = engine.catalog(mainUser)
assert.equal(catalog.find((e) => e.eventId === 'birth_first_voice_v1')?.status, 'available')
assert.equal(catalog.find((e) => e.eventId === 'birth_restore_object_v1')?.status, 'locked')

// bfv：start → 继续 → "Let me help you." → 完成
let view = engine.start(mainUser, { eventId: 'birth_first_voice_v1', idempotencyKey: key('bfv-start') })
assert.equal(view.currentState.id, 'bfv_open')
const bfvInstance = view.instanceId

view = engine.advance(mainUser, bfvInstance, { inputMode: 'choice', choiceId: 'bfv_choice_continue', idempotencyKey: key('bfv-open') })
assert.equal(view.advanced, true)
assert.equal(view.currentState.id, 'bfv_reply')

view = engine.advance(mainUser, bfvInstance, { inputMode: 'text', text: 'Let me help you.', idempotencyKey: key('bfv-help') })
assert.equal(view.advanced, true)
assert.equal(view.currentState.id, 'bfv_result')
assert.equal(view.outcome?.id, 'bfv_outcome_helped')
assert.equal(view.resultLines[0].learningContent.english, 'You want to help me understand this room. I can start with that.')

view = engine.advance(mainUser, bfvInstance, { inputMode: 'choice', choiceId: 'bfv_choice_finish', idempotencyKey: key('bfv-finish') })
assert.equal(view.advanced, true)
assert.equal(view.status, 'completed')
assert.equal(engine.current(mainUser), null)
assert.equal(view.worldState.first_response_style, 'help')

// bfv 完成后 bro 解锁。
catalog = engine.catalog(mainUser)
assert.equal(catalog.find((e) => e.eventId === 'birth_first_voice_v1')?.status, 'completed')
assert.equal(catalog.find((e) => e.eventId === 'birth_restore_object_v1')?.status, 'available')

// bro：start → 继续 → 选灯 → 完成
view = engine.start(mainUser, { eventId: 'birth_restore_object_v1', idempotencyKey: key('bro-start') })
assert.equal(view.currentState.id, 'bro_open')
const broInstance = view.instanceId

view = engine.advance(mainUser, broInstance, { inputMode: 'choice', choiceId: 'bro_choice_continue', idempotencyKey: key('bro-open') })
assert.equal(view.currentState.id, 'bro_choose')

view = engine.advance(mainUser, broInstance, { inputMode: 'choice', choiceId: 'bro_choice_lamp', idempotencyKey: key('bro-lamp') })
assert.equal(view.advanced, true)
assert.equal(view.currentState.id, 'bro_result')
assert.equal(view.outcome?.id, 'bro_outcome_lamp')

view = engine.advance(mainUser, broInstance, { inputMode: 'choice', choiceId: 'bro_choice_finish', idempotencyKey: key('bro-finish') })
assert.equal(view.advanced, true)
assert.equal(view.status, 'completed')
assert.equal(view.worldState.first_restored_object, 'lamp')

// ── 无匹配：在 bfv_reply 发乱码，保持状态、返回候选 ────────────────────────
const nomatchUser = 'user-nomatch'
view = engine.start(nomatchUser, { eventId: 'birth_first_voice_v1', idempotencyKey: key('nm-start') })
const nmInstance = view.instanceId
engine.advance(nomatchUser, nmInstance, { inputMode: 'choice', choiceId: 'bfv_choice_continue', idempotencyKey: key('nm-open') })
const nomatch = engine.advance(nomatchUser, nmInstance, { inputMode: 'text', text: 'asdf qwer', idempotencyKey: key('nm-garbage') })
assert.equal(nomatch.advanced, false)
assert.equal(nomatch.currentState.id, 'bfv_reply')
assert.ok(nomatch.candidates && nomatch.candidates.length > 0 && nomatch.candidates.length <= 3)
assert.equal(typeof nomatch.messageZh, 'string')
// 状态仍在 bfv_reply（未被乱码推进）。
const still = engine.current(nomatchUser)
assert.equal(still?.currentState.id, 'bfv_reply')

// ── 幂等：同一 idempotencyKey 重复 advance 返回相同视图，不重复推进 ─────────
const idemUser = 'user-idem'
view = engine.start(idemUser, { eventId: 'birth_first_voice_v1', idempotencyKey: key('idm-start') })
const idemInstance = view.instanceId
const first = engine.advance(idemUser, idemInstance, { inputMode: 'choice', choiceId: 'bfv_choice_continue', idempotencyKey: 'idem-fixed-key' })
const second = engine.advance(idemUser, idemInstance, { inputMode: 'choice', choiceId: 'bfv_choice_continue', idempotencyKey: 'idem-fixed-key' })
assert.equal(first.advanced, true)
assert.equal(first.currentState.id, 'bfv_reply')
assert.deepEqual(second, first)
assert.equal(engine.current(idemUser)?.currentState.id, 'bfv_reply')

// ── 重启持久化：新实例（进程内再 new）读同一 DB 文件，状态与 worldState 仍在 ──
const engine2 = new SqliteFixedEventEngine()
catalog = engine2.catalog(mainUser)
assert.equal(catalog.find((e) => e.eventId === 'birth_first_voice_v1')?.status, 'completed')
assert.equal(catalog.find((e) => e.eventId === 'birth_restore_object_v1')?.status, 'completed')
assert.equal(engine2.current(mainUser), null)

// 直接读行验证 worldState 落库。
const row = openDatabase().prepare('SELECT record FROM fixed_event_state WHERE user_id = ?').get(mainUser) as { record: string } | undefined
assert.ok(row)
const persisted = fromJson<{ worldState: Record<string, string> }>(row.record)!
assert.equal(persisted.worldState.first_response_style, 'help')
assert.equal(persisted.worldState.first_restored_object, 'lamp')

// 清理临时 DB（含 WAL/SHM）。先关闭句柄，避免 Windows EBUSY。
openDatabase().close()
for (const suffix of ['', '-wal', '-shm']) {
  const p = dbPath + suffix
  if (existsSync(p)) rmSync(p, { force: true })
}

console.log(JSON.stringify({
  ok: true,
  checks: [
    'bfv-help-world-state',
    'bro-lamp-world-state',
    'catalog-unlock-chain',
    'no-match-keeps-state-and-candidates',
    'idempotent-advance',
    'restart-persistence-and-world-state',
  ],
}, null, 2))
