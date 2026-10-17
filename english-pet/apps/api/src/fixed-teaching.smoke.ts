import assert from 'node:assert/strict'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rmSync } from 'node:fs'
import { SqliteFixedEventEngine } from './sqlite-fixed-event-engine.js'
import { openDatabase } from './sqlite-db.js'
import { completeTeaching } from './fixed-teaching-test-helper.js'
import { normalizeSpeech } from './fixed-event-teaching.js'

const dbPath = join(tmpdir(), `fixed-teaching-${Date.now()}.db`)
process.env.SQLITE_PATH = dbPath
let sequence = 0
let now = new Date('2026-10-17T01:00:00Z')
const key = () => `teaching-smoke-${++sequence}`
const engine = new SqliteFixedEventEngine({ now: () => now })
const user = 'teaching-user'
const instance = engine.start(user, { eventId: 'birth_first_voice_v1', idempotencyKey: key() }).instanceId
for (const choiceId of ['c1e1_choice_open', 'c1e1_choice_presence']) engine.advance(user, instance, { inputMode: 'choice', choiceId, idempotencyKey: key() })
const stateId = 'c1e1_input_presence'
const begin = () => engine.teaching(user, instance, { action: 'begin', stateId, idempotencyKey: key() })
const confirm = (text: string, proof: string, stepId = begin().step.id, idempotencyKey = key()) => engine.teaching(user, instance, { action: 'confirm', stateId, stepId, text, asrProof: proof, idempotencyKey })
const issue = (text = 'Yes') => engine.issueAsrProof(user, instance, stateId, text, begin().step.id)
try {
  // 不先调用 begin，也不能直接签完整句凭证或绕过教学。
  assert.throws(() => engine.issueAsrProof(user, instance, stateId, "Yes, I'm here."), /fixed_asr_state_mismatch/)
  assert.equal(engine.advance(user, instance, { inputMode: 'confirmed_asr_text', text: "Yes, I'm here.", idempotencyKey: key() }).advanced, false)
  assert.equal(begin().step.kind, 'repeat')
  assert.throws(() => engine.issueAsrProof(user, instance, stateId, "Yes, I'm here."), /fixed_asr_state_mismatch/)
  let proof = issue()
  assert.equal(engine.advance(user, instance, { inputMode: 'confirmed_asr_text', text: 'Yes', asrProof: proof.proof, idempotencyKey: key() }).advanced, false)
  // 修改转写会消费凭证，不能改回后复用。
  assert.equal(confirm('No', proof.proof).stepIndex, 0)
  assert.equal(confirm('Yes', proof.proof).stepIndex, 0)
  proof = issue(); engine.discardAsrProof(user, instance, stateId, proof.proof)
  assert.equal(confirm('Yes', proof.proof).stepIndex, 0)
  proof = issue(); engine.pause(user, instance, key()); engine.resume(user, instance, key())
  assert.equal(confirm('Yes', proof.proof).stepIndex, 0)
  proof = issue(); now = new Date(now.getTime() + 301_000)
  assert.equal(confirm('Yes', proof.proof).stepIndex, 0)
  const replaced = issue(); proof = issue()
  assert.equal(confirm('Yes', replaced.proof).stepIndex, 0)
  const operation = key()
  const accepted = confirm('Yes', proof.proof, 'repeat_0', operation)
  assert.equal(accepted.stepIndex, 1)
  assert.deepEqual(confirm('Yes', proof.proof, 'repeat_0', operation), accepted)
  const restarted = new SqliteFixedEventEngine({ now: () => now })
  assert.equal(restarted.teaching(user, instance, { action: 'begin', stateId, idempotencyKey: key() }).stepIndex, 1)
  completeTeaching(engine, user, instance)
  assert.equal(begin().step.kind, 'output')
  const final = engine.issueAsrProof(user, instance, stateId, 'Yes, I am here.')
  const input = { inputMode: 'confirmed_asr_text' as const, text: 'Yes, I am here.', asrProof: final.proof, idempotencyKey: key() }
  const advanced = engine.advance(user, instance, input)
  assert.equal(advanced.currentState.id, 'c1e1_feedback_presence')
  assert.deepEqual(engine.advance(user, instance, input), advanced)
  assert.equal(advanced.worldState.first_response_style, undefined)
  const record = JSON.parse((openDatabase().prepare('SELECT record FROM fixed_event_state WHERE user_id = ?').get(user) as { record: string }).record)
  assert.ok(Object.values(record.teachingEvidence).every((value: any) => value.level === 'prompted'))
  assert.notEqual(normalizeSpeech('I am here'), normalizeSpeech('I am not here'))
  console.log(JSON.stringify({ ok: true, checks: ['server-enforces-teaching-before-begin', 'teaching-and-final-proof-separated', 'tamper-discard-pause-expiry-replacement', 'idempotent-confirm-and-advance', 'restart-checkpoint', 'prompted-only-no-early-world-write'] }))
} finally {
  openDatabase().close()
  for (const suffix of ['', '-wal', '-shm']) rmSync(dbPath + suffix, { force: true })
}
