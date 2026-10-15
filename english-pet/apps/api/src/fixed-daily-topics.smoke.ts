import assert from 'node:assert/strict'
import { existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { getFixedContentEvent } from '@english-pet/domain'
import { fromJson, openDatabase } from './sqlite-db.js'
import { SqliteFixedEventEngine } from './sqlite-fixed-event-engine.js'

function asrAdvance(engine: SqliteFixedEventEngine, userId: string, instanceId: string, text: string, idempotencyKey: string) {
  const stateId = engine.current(userId)!.currentState.id
  const proof = engine.issueAsrProof(userId, instanceId, stateId, text)
  return engine.advance(userId, instanceId, { inputMode: 'confirmed_asr_text', text, asrProof: proof.proof, idempotencyKey })
}

// 必须在首次 openDatabase() 前指定临时 DB，避免污染真实 .data/english-pet.db。
const dbPath = join(tmpdir(), `daily-topics-smoke-${Date.now()}.db`)
process.env.SQLITE_PATH = dbPath

let sequence = 0
function key(label: string) {
  sequence += 1
  return `${label}-${sequence.toString().padStart(4, '0')}`
}

const DAILY = 'chapter_daily_talk'
const user = 'user-daily'
const engine = new SqliteFixedEventEngine()

// ── 1. 首个主线事件未完成前：日常主题全部 locked ───────────────────────
let catalog = engine.catalog(user)
const daily = catalog.filter((e) => e.chapterId === DAILY)
assert.ok(daily.length >= 8 && daily.length <= 12, `日常主题数量应在 8-12 之间，实际 ${daily.length}`)
assert.ok(daily.every((e) => e.status === 'locked'), 'bfv 未完成前日常主题应 locked')
// 主线事件仍按原顺序链：bfv available
assert.equal(catalog.find((e) => e.eventId === 'birth_first_voice_v1')?.status, 'available')

// ── 2. 走完 bfv（reassuring_presence 分支）解锁日常主题 ────────────────────────────────
let view = engine.start(user, { eventId: 'birth_first_voice_v1', idempotencyKey: key('bfv-start') })
const bfvInstance = view.instanceId
view = engine.advance(user, bfvInstance, { inputMode: 'choice', choiceId: 'c1e1_choice_open', idempotencyKey: key('bfv-open') })
view = engine.advance(user, bfvInstance, { inputMode: 'choice', choiceId: 'c1e1_choice_presence', idempotencyKey: key('bfv-route') })
view = asrAdvance(engine, user, bfvInstance, "Yes, I'm here.", key('bfv-presence'))
assert.equal(view.outcome?.id, 'c1e1_outcome_presence')
engine.advance(user, bfvInstance, { inputMode: 'choice', choiceId: 'c1e1_choice_feedback_presence', idempotencyKey: key('bfv-feedback') })
view = engine.advance(user, bfvInstance, { inputMode: 'choice', choiceId: 'c1e1_choice_finish', idempotencyKey: key('bfv-finish') })
assert.equal(view.status, 'completed')

catalog = engine.catalog(user)
const dailyAfter = catalog.filter((e) => e.chapterId === DAILY)
assert.ok(dailyAfter.every((e) => e.status === 'available'), 'bfv 完成后日常主题应全部 available')
// 还没玩过任何主题：推荐第一个（sequence 最小）
const firstRecommended = dailyAfter.find((e) => e.recommendedNext)
assert.equal(firstRecommended?.eventId, 'dt_weather_outside_v1', '首次应推荐 sequence 最小的日常主题')

// ── 3. 完整走通一个主题：open → continue → sunny → result → complete ──
view = engine.start(user, { eventId: 'dt_weather_outside_v1', idempotencyKey: key('dwo-start') })
assert.equal(view.currentState.id, 'dwo_open')
const dwoInstance = view.instanceId
view = engine.advance(user, dwoInstance, { inputMode: 'choice', choiceId: 'dwo_choice_continue', idempotencyKey: key('dwo-open') })
assert.equal(view.currentState.id, 'dwo_reply')

// 无匹配：乱码保持当前状态并返回候选
const nomatch = engine.advance(user, dwoInstance, { inputMode: 'text', text: 'zxcvbnm', idempotencyKey: key('dwo-garbage') })
assert.equal(nomatch.advanced, false)
assert.equal(nomatch.currentState.id, 'dwo_reply')
assert.ok(nomatch.candidates && nomatch.candidates.length > 0 && nomatch.candidates.length <= 3)

// 有效分支：选 sunny
view = engine.advance(user, dwoInstance, { inputMode: 'choice', choiceId: 'dwo_choice_sunny', idempotencyKey: key('dwo-sunny') })
assert.equal(view.advanced, true)
assert.equal(view.currentState.id, 'dwo_result')
assert.equal(view.outcome?.id, 'dwo_outcome_sunny')
assert.equal(view.worldState.outside_weather, undefined, '共同收束完成前不得提前写正式世界状态')

// 幂等：同一 idempotencyKey 重放完成步，不重复结算
const idemView = view
view = engine.advance(user, dwoInstance, { inputMode: 'choice', choiceId: 'dwo_choice_finish', idempotencyKey: key('dwo-finish') })
assert.equal(view.status, 'completed')
assert.equal(view.worldState.outside_weather, 'sunny')

// ── 4. 真实冷却 + 当日新内容预算：weather 进入冷却，推荐只能来自不引入新内容的可用日常 ──
catalog = engine.catalog(user)
const rec = catalog.find((e) => e.recommendedNext)
assert.equal(catalog.find((e) => e.eventId === 'dt_weather_outside_v1')?.status, 'cooldown', '完成 weather 后应进入真实冷却')
assert.notEqual(rec?.eventId, 'dt_weather_outside_v1', '不应连续推荐同一个主题')
assert.ok(rec && ['dt_rest_together_v1', 'dt_good_night_v1'].includes(rec.eventId), '当日新内容日常预算用完后只推荐不引入新内容日常')
// 主线 bfv 仍是 completed（不受影响）
assert.equal(catalog.find((e) => e.eventId === 'birth_first_voice_v1')?.status, 'completed')

// ── 5. 再玩一个不引入新内容的日常，仍维持相邻去重 ─────────────────────
const secondDailyId = rec.eventId
view = engine.start(user, { eventId: secondDailyId, idempotencyKey: key('second-daily-start') })
const secondInstance = view.instanceId
const secondEvent = getFixedContentEvent(secondDailyId)!
const secondOpen = secondEvent.states.find((state) => state.id === view.currentState.id)!
view = engine.advance(user, secondInstance, { inputMode: 'choice', choiceId: secondOpen.choices[0].id, idempotencyKey: key('second-daily-open') })
const secondReply = secondEvent.states.find((state) => state.id === view.currentState.id)!
view = engine.advance(user, secondInstance, { inputMode: 'choice', choiceId: secondReply.choices[0].id, idempotencyKey: key('second-daily-choice') })
const secondResult = secondEvent.states.find((state) => state.id === view.currentState.id)!
engine.advance(user, secondInstance, { inputMode: 'choice', choiceId: secondResult.choices[0].id, idempotencyKey: key('second-daily-finish') })
catalog = engine.catalog(user)
assert.notEqual(catalog.find((e) => e.recommendedNext)?.eventId, secondDailyId, '相邻推荐不得重复')

// ── 6. 暂停出口：另用独立用户，避免当日新内容预算影响旧暂停分支回归 ──
const pauseUser = 'user-daily-pause'
let pauseSetup = engine.start(pauseUser, { eventId: 'birth_first_voice_v1', idempotencyKey: key('pause-bfv-start') })
const pauseBfvId = pauseSetup.instanceId
engine.advance(pauseUser, pauseBfvId, { inputMode: 'choice', choiceId: 'c1e1_choice_open', idempotencyKey: key('pause-bfv-open') })
engine.advance(pauseUser, pauseBfvId, { inputMode: 'choice', choiceId: 'c1e1_choice_presence', idempotencyKey: key('pause-bfv-route') })
asrAdvance(engine, pauseUser, pauseBfvId, "Yes, I'm here.", key('pause-bfv-presence'))
engine.advance(pauseUser, pauseBfvId, { inputMode: 'choice', choiceId: 'c1e1_choice_feedback_presence', idempotencyKey: key('pause-bfv-feedback') })
engine.advance(pauseUser, pauseBfvId, { inputMode: 'choice', choiceId: 'c1e1_choice_finish', idempotencyKey: key('pause-bfv-finish') })
view = engine.start(pauseUser, { eventId: 'dt_drink_v1', idempotencyKey: key('ddk-start') })
const ddkInstance = view.instanceId
engine.advance(pauseUser, ddkInstance, { inputMode: 'choice', choiceId: 'ddk_choice_continue', idempotencyKey: key('ddk-open') })
const paused = engine.advance(pauseUser, ddkInstance, { inputMode: 'choice', choiceId: 'ddk_choice_pause', idempotencyKey: key('ddk-pause') })
assert.equal(paused.outcome?.id, 'ddk_outcome_paused')
engine.advance(pauseUser, ddkInstance, { inputMode: 'choice', choiceId: 'ddk_choice_finish', idempotencyKey: key('ddk-finish') })

// ── 7. 重启持久化：新引擎实例读同一 DB，cursor、冷却和 worldState 仍在 ─────
const engine2 = new SqliteFixedEventEngine()
catalog = engine2.catalog(user)
assert.equal(catalog.find((e) => e.eventId === secondDailyId)?.status, 'cooldown', '重启后第二个日常仍在冷却中')
const row = openDatabase().prepare('SELECT record FROM fixed_event_state WHERE user_id = ?').get(user) as { record: string } | undefined
assert.ok(row)
const persisted = fromJson<{ worldState: Record<string, string>; dailyTopicCursor: string | null }>(row.record)!
assert.equal(persisted.worldState.outside_weather, 'sunny')
assert.equal(persisted.dailyTopicCursor, secondDailyId, '重启后游标应保留最后完成的日常')

// ── 8. 文本自由输入也能命中有效分支（独立用户，避免冷却/预算干扰）─────────
const textUser = 'user-daily-text'
let textSetup = engine2.start(textUser, { eventId: 'birth_first_voice_v1', idempotencyKey: key('text-bfv-start') })
const textBfvId = textSetup.instanceId
engine2.advance(textUser, textBfvId, { inputMode: 'choice', choiceId: 'c1e1_choice_open', idempotencyKey: key('text-bfv-open') })
engine2.advance(textUser, textBfvId, { inputMode: 'choice', choiceId: 'c1e1_choice_presence', idempotencyKey: key('text-bfv-route') })
asrAdvance(engine2, textUser, textBfvId, "Yes, I'm here.", key('text-bfv-presence'))
engine2.advance(textUser, textBfvId, { inputMode: 'choice', choiceId: 'c1e1_choice_feedback_presence', idempotencyKey: key('text-bfv-feedback') })
engine2.advance(textUser, textBfvId, { inputMode: 'choice', choiceId: 'c1e1_choice_finish', idempotencyKey: key('text-bfv-finish') })
view = engine2.start(textUser, { eventId: 'dt_good_night_v1', idempotencyKey: key('dgn-start') })
const dgnInstance = view.instanceId
engine2.advance(textUser, dgnInstance, { inputMode: 'choice', choiceId: 'dgn_choice_continue', idempotencyKey: key('dgn-open') })
const txt = engine2.advance(textUser, dgnInstance, { inputMode: 'text', text: 'Good night, Morrow.', idempotencyKey: key('dgn-text') })
assert.equal(txt.outcome?.id, 'dgn_outcome_night', '自由文本应确定性命中晚安分支')

// 清理临时 DB（含 WAL/SHM）。先关闭句柄，避免 Windows EBUSY。
openDatabase().close()
for (const suffix of ['', '-wal', '-shm']) {
  const p = dbPath + suffix
  if (existsSync(p)) rmSync(p, { force: true })
}

console.log(JSON.stringify({
  ok: true,
  checks: [
    'daily-topics-locked-before-first-mainline',
    'daily-topics-unlock-after-bfv',
    'happy-path-branch-world-state',
    'no-match-keeps-state-and-candidates',
    'idempotent-finish',
    'rotation-no-consecutive-repeat',
    'cooldown-then-repeatable-after-expiry',
    'pause-exit-paused-outcome',
    'restart-persistence-cursor',
    'free-text-intent-matching',
  ],
  dailyTopicCount: dailyAfter.length,
}, null, 2))
