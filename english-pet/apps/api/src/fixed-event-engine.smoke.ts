import { completeTeaching } from './fixed-teaching-test-helper.js'
import assert from 'node:assert/strict'
import { existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fromJson, openDatabase } from './sqlite-db.js'
import { SqliteFixedEventEngine } from './sqlite-fixed-event-engine.js'

function asrAdvance(engine: SqliteFixedEventEngine, userId: string, instanceId: string, text: string, idempotencyKey: string) {
  const stateId = engine.current(userId)!.currentState.id
  completeTeaching(engine, userId, instanceId)
  const proof = engine.issueAsrProof(userId, instanceId, stateId, text)
  return engine.advance(userId, instanceId, { inputMode: 'confirmed_asr_text', text, asrProof: proof.proof, idempotencyKey })
}

// 必须在首次 openDatabase() 前指定临时 DB，避免污染真实 .data/english-pet.db。
const dbPath = join(tmpdir(), `fixed-event-smoke-${Date.now()}.db`)
process.env.SQLITE_PATH = dbPath

let sequence = 0
function key(label: string) {
  sequence += 1
  return `${label}-${sequence.toString().padStart(4, '0')}`
}

// ── 主用户：走完 bfv(presence) 与 bro(lamp) ──────────────────────────────────
const mainUser = 'user-main'
const engine = new SqliteFixedEventEngine()

// 初始目录：bfv available，bro locked。
let catalog = engine.catalog(mainUser)
assert.equal(catalog.find((e) => e.eventId === 'birth_first_voice_v1')?.status, 'available')
assert.equal(catalog.find((e) => e.eventId === 'b1_first_room_object_v1')?.status, 'locked')

// bfv：start → 继续 → "Yes, I'm here." → 完成
let view = engine.start(mainUser, { eventId: 'birth_first_voice_v1', idempotencyKey: key('bfv-start') })
assert.equal(view.currentState.id, 'c1e1_open')
const bfvInstance = view.instanceId

view = engine.advance(mainUser, bfvInstance, { inputMode: 'choice', choiceId: 'c1e1_choice_open', idempotencyKey: key('bfv-open') })
assert.equal(view.advanced, true)
assert.equal(view.currentState.id, 'c1e1_route')
view = engine.advance(mainUser, bfvInstance, { inputMode: 'choice', choiceId: 'c1e1_choice_presence', idempotencyKey: key('bfv-route') })
assert.equal(view.currentState.id, 'c1e1_input_presence')

view = asrAdvance(engine, mainUser, bfvInstance, "Yes, I'm here.", key('bfv-presence'))
assert.equal(view.advanced, true)
assert.equal(view.currentState.id, 'c1e1_feedback_presence')
assert.equal(view.outcome?.id, 'c1e1_outcome_presence')
assert.equal(view.resultLines[0].learningContent.english, "Oh, good. I'm Morrow. I wasn't sure anyone was there.")

view = engine.advance(mainUser, bfvInstance, { inputMode: 'choice', choiceId: 'c1e1_choice_feedback_presence', idempotencyKey: key('bfv-feedback') })
assert.equal(view.currentState.id, 'c1e1_result')
view = engine.advance(mainUser, bfvInstance, { inputMode: 'choice', choiceId: 'c1e1_choice_finish', idempotencyKey: key('bfv-finish') })
assert.equal(view.advanced, true)
assert.equal(view.status, 'completed')
assert.equal(engine.current(mainUser), null)
assert.equal(view.worldState.first_response_style, 'reassuring_presence')

// bfv 完成后 bro 解锁。
catalog = engine.catalog(mainUser)
assert.equal(catalog.find((e) => e.eventId === 'birth_first_voice_v1')?.status, 'completed')
assert.equal(catalog.find((e) => e.eventId === 'b1_first_room_object_v1')?.status, 'available')

// bro：start → 继续 → 选灯 → 完成
view = engine.start(mainUser, { eventId: 'b1_first_room_object_v1', idempotencyKey: key('bro-start') })
assert.equal(view.currentState.id, 'c1e2_open')
const broInstance = view.instanceId

view = engine.advance(mainUser, broInstance, { inputMode: 'choice', choiceId: 'c1e2_choice_open', idempotencyKey: key('bro-open') })
assert.equal(view.currentState.id, 'c1e2_route')
view = engine.advance(mainUser, broInstance, { inputMode: 'choice', choiceId: 'c1e2_choice_lamp', idempotencyKey: key('bro-route') })
assert.equal(view.currentState.id, 'c1e2_input_lamp')

view = asrAdvance(engine, mainUser, broInstance, 'I noticed the lamp first.', key('bro-lamp'))
assert.equal(view.advanced, true)
assert.equal(view.currentState.id, 'c1e2_morrow_lamp')
view = engine.advance(mainUser, broInstance, { inputMode: 'choice', choiceId: 'c1e2_choice_morrow_lamp', idempotencyKey: key('bro-morrow') })
assert.equal(view.currentState.id, 'c1e2_second_lamp')
view = asrAdvance(engine, mainUser, broInstance, 'What about you?', key('bro-second'))
assert.equal(view.currentState.id, 'c1e2_answer_lamp')
view = engine.advance(mainUser, broInstance, { inputMode: 'choice', choiceId: 'c1e2_choice_answer_lamp', idempotencyKey: key('bro-answer') })
assert.equal(view.currentState.id, 'c1e2_attitude')
view = engine.advance(mainUser, broInstance, { inputMode: 'choice', choiceId: 'c1e2_choice_interesting', idempotencyKey: key('bro-attitude') })
view = engine.advance(mainUser, broInstance, { inputMode: 'choice', choiceId: 'c1e2_choice_feedback_interesting', idempotencyKey: key('bro-feedback') })
assert.equal(view.currentState.id, 'c1e2_result')
assert.equal(view.outcome?.id, 'c1e2_outcome_lamp')

view = engine.advance(mainUser, broInstance, { inputMode: 'choice', choiceId: 'c1e2_choice_finish', idempotencyKey: key('bro-finish') })
assert.equal(view.advanced, true)
assert.equal(view.status, 'completed')
assert.equal(view.worldState.first_shared_object, 'lamp')

// ── 无匹配：在 c1e1_first 发乱码，保持状态、返回候选 ────────────────────────
const nomatchUser = 'user-nomatch'
view = engine.start(nomatchUser, { eventId: 'birth_first_voice_v1', idempotencyKey: key('nm-start') })
const nmInstance = view.instanceId
engine.advance(nomatchUser, nmInstance, { inputMode: 'choice', choiceId: 'c1e1_choice_open', idempotencyKey: key('nm-open') })
engine.advance(nomatchUser, nmInstance, { inputMode: 'choice', choiceId: 'c1e1_choice_presence', idempotencyKey: key('nm-route') })
completeTeaching(engine, nomatchUser, nmInstance)
const wrongMode = engine.advance(nomatchUser, nmInstance, { inputMode: 'text', text: 'asdf qwer', idempotencyKey: key('nm-wrong-mode') })
assert.equal(wrongMode.advanced, false)
assert.equal(wrongMode.currentState.id, 'c1e1_input_presence')
assert.match(wrongMode.messageZh ?? '', /不接受这种输入方式/)
const nomatch = asrAdvance(engine, nomatchUser, nmInstance, 'asdf qwer', key('nm-garbage'))
assert.equal(nomatch.advanced, false)
assert.equal(nomatch.currentState.id, 'c1e1_input_presence')
assert.deepEqual(nomatch.candidates, [])
assert.equal(typeof nomatch.messageZh, 'string')
// 状态仍在 c1e1_first（未被乱码推进）。
const still = engine.current(nomatchUser)
assert.equal(still?.currentState.id, 'c1e1_input_presence')

// ── 幂等：同一 idempotencyKey 重复 advance 返回相同视图，不重复推进 ─────────
const idemUser = 'user-idem'
view = engine.start(idemUser, { eventId: 'birth_first_voice_v1', idempotencyKey: key('idm-start') })
const idemInstance = view.instanceId
const first = engine.advance(idemUser, idemInstance, { inputMode: 'choice', choiceId: 'c1e1_choice_open', idempotencyKey: 'idem-fixed-key' })
const second = engine.advance(idemUser, idemInstance, { inputMode: 'choice', choiceId: 'c1e1_choice_open', idempotencyKey: 'idem-fixed-key' })
assert.equal(first.advanced, true)
assert.equal(first.currentState.id, 'c1e1_route')
assert.deepEqual(second, first)
assert.equal(engine.current(idemUser)?.currentState.id, 'c1e1_route')

// ── 重启持久化：新实例（进程内再 new）读同一 DB 文件，状态与 worldState 仍在 ──
const engine2 = new SqliteFixedEventEngine()
catalog = engine2.catalog(mainUser)
assert.equal(catalog.find((e) => e.eventId === 'birth_first_voice_v1')?.status, 'completed')
assert.equal(catalog.find((e) => e.eventId === 'b1_first_room_object_v1')?.status, 'completed')
assert.equal(engine2.current(mainUser), null)

// 直接读行验证 worldState 落库。
const row = openDatabase().prepare('SELECT record FROM fixed_event_state WHERE user_id = ?').get(mainUser) as { record: string } | undefined
assert.ok(row)
const persisted = fromJson<{ worldState: Record<string, string> }>(row.record)!
assert.equal(persisted.worldState.first_response_style, 'reassuring_presence')
assert.equal(persisted.worldState.first_shared_object, 'lamp')

// 清理临时 DB（含 WAL/SHM）。先关闭句柄，避免 Windows EBUSY。
openDatabase().close()
for (const suffix of ['', '-wal', '-shm']) {
  const p = dbPath + suffix
  if (existsSync(p)) rmSync(p, { force: true })
}

console.log(JSON.stringify({
  ok: true,
  checks: [
    'bfv-presence-world-state',
    'bro-lamp-world-state',
    'catalog-unlock-chain',
    'no-match-keeps-state-and-candidates',
    'idempotent-advance',
    'restart-persistence-and-world-state',
  ],
}, null, 2))
