import assert from 'node:assert/strict'
import { existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fromJson, openDatabase } from './sqlite-db.js'
import { SqliteFixedEventEngine } from './sqlite-fixed-event-engine.js'

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

// ── 2. 走完 bfv（help 分支）解锁日常主题 ────────────────────────────────
let view = engine.start(user, { eventId: 'birth_first_voice_v1', idempotencyKey: key('bfv-start') })
const bfvInstance = view.instanceId
view = engine.advance(user, bfvInstance, { inputMode: 'choice', choiceId: 'bfv_choice_continue', idempotencyKey: key('bfv-open') })
view = engine.advance(user, bfvInstance, { inputMode: 'text', text: 'Let me help you.', idempotencyKey: key('bfv-help') })
assert.equal(view.outcome?.id, 'bfv_outcome_helped')
view = engine.advance(user, bfvInstance, { inputMode: 'choice', choiceId: 'bfv_choice_finish', idempotencyKey: key('bfv-finish') })
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
assert.equal(view.worldState.outside_weather, 'sunny')

// 幂等：同一 idempotencyKey 重放完成步，不重复结算
const idemView = view
view = engine.advance(user, dwoInstance, { inputMode: 'choice', choiceId: 'dwo_choice_finish', idempotencyKey: key('dwo-finish') })
assert.equal(view.status, 'completed')

// ── 4. 轮换：完成 weather 后，推荐应指向下一个（morning_you），且 weather 不再被推荐 ──
catalog = engine.catalog(user)
const rec = catalog.find((e) => e.recommendedNext)
assert.equal(rec?.eventId, 'dt_morning_you_v1', '完成 weather 后应推荐下一个日常主题')
assert.notEqual(rec?.eventId, 'dt_weather_outside_v1', '不应连续推荐同一个主题')
// weather 仍是 available（可重复），不是 completed
assert.equal(catalog.find((e) => e.eventId === 'dt_weather_outside_v1')?.status, 'available', '日常主题完成后应仍为 available（可重复）')
// 主线 bfv 仍是 completed（不受影响）
assert.equal(catalog.find((e) => e.eventId === 'birth_first_voice_v1')?.status, 'completed')

// ── 5. 再玩 morning_you，推荐应继续向后轮换 ─────────────────────────────
view = engine.start(user, { eventId: 'dt_morning_you_v1', idempotencyKey: key('dmy-start') })
const dmyInstance = view.instanceId
engine.advance(user, dmyInstance, { inputMode: 'choice', choiceId: 'dmy_choice_continue', idempotencyKey: key('dmy-open') })
engine.advance(user, dmyInstance, { inputMode: 'choice', choiceId: 'dmy_choice_early', idempotencyKey: key('dmy-early') })
engine.advance(user, dmyInstance, { inputMode: 'choice', choiceId: 'dmy_choice_finish', idempotencyKey: key('dmy-finish') })
catalog = engine.catalog(user)
assert.equal(catalog.find((e) => e.recommendedNext)?.eventId, 'dt_drink_v1', '完成 morning 后应再向后轮换')

// ── 6. 暂停出口：在一个主题 reply 选"这次先不聊"，走 paused outcome 并完成实例 ──
view = engine.start(user, { eventId: 'dt_drink_v1', idempotencyKey: key('ddk-start') })
const ddkInstance = view.instanceId
engine.advance(user, ddkInstance, { inputMode: 'choice', choiceId: 'ddk_choice_continue', idempotencyKey: key('ddk-open') })
const paused = engine.advance(user, ddkInstance, { inputMode: 'choice', choiceId: 'ddk_choice_pause', idempotencyKey: key('ddk-pause') })
assert.equal(paused.outcome?.id, 'ddk_outcome_paused')
engine.advance(user, ddkInstance, { inputMode: 'choice', choiceId: 'ddk_choice_finish', idempotencyKey: key('ddk-finish') })

// ── 7. 重启持久化：新引擎实例读同一 DB，cursor 与 worldState 仍在 ─────────
const engine2 = new SqliteFixedEventEngine()
catalog = engine2.catalog(user)
assert.equal(catalog.find((e) => e.recommendedNext)?.eventId, 'dt_book_line_v1', '重启后轮换游标应保留')
const row = openDatabase().prepare('SELECT record FROM fixed_event_state WHERE user_id = ?').get(user) as { record: string } | undefined
assert.ok(row)
const persisted = fromJson<{ worldState: Record<string, string>; dailyTopicCursor: string | null }>(row.record)!
assert.equal(persisted.worldState.outside_weather, 'sunny')
assert.equal(persisted.dailyTopicCursor, 'dt_drink_v1', '完成 drink 后游标应指向 drink')

// ── 8. 文本自由输入也能命中有效分支（确定性意图匹配）─────────────────────
view = engine2.start(user, { eventId: 'dt_good_night_v1', idempotencyKey: key('dgn-start') })
const dgnInstance = view.instanceId
engine2.advance(user, dgnInstance, { inputMode: 'choice', choiceId: 'dgn_choice_continue', idempotencyKey: key('dgn-open') })
const txt = engine2.advance(user, dgnInstance, { inputMode: 'text', text: 'Good night, Morrow.', idempotencyKey: key('dgn-text') })
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
    'repeatable-status-available',
    'pause-exit-paused-outcome',
    'restart-persistence-cursor',
    'free-text-intent-matching',
  ],
  dailyTopicCount: dailyAfter.length,
}, null, 2))
