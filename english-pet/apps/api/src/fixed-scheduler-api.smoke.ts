import assert from 'node:assert/strict'
import { existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const dbPath = join(tmpdir(), `fixed-scheduler-api-${Date.now()}.db`)
process.env.SQLITE_PATH = dbPath
process.env.API_NO_LISTEN = '1'
process.env.STORE_DRIVER = 'sqlite'

const { app } = await import('./index.js')
const api = app.request.bind(app)

const guestResponse = await api('/v1/auth/guest', { method: 'POST' })
assert.equal(guestResponse.status, 201)
const session = await guestResponse.json() as { token: string; user: { id: string } }
const headers = { Authorization: `Bearer ${session.token}`, 'Content-Type': 'application/json' }
const { openDatabase } = await import('./sqlite-db.js')
const { SqliteMemoryStore } = await import('./sqlite-memory-store.js')

const catalogResponse = await api('/v1/fixed-content/events', { headers })
assert.equal(catalogResponse.status, 200)
const catalog = await catalogResponse.json() as { events: Array<{ eventId: string; eventType: string }> }
assert.ok(catalog.events.length > 0)
assert.ok(catalog.events.every((event) => event.eventType !== 'recall'))
assert.equal(catalog.events.some((event) => event.eventId === 'b2_recall_room_v1'), false)

const recommendationResponse = await api('/v1/fixed-content/recommendation', { headers })
assert.equal(recommendationResponse.status, 200)
const recommendation = await recommendationResponse.json() as { dispatchType: string; reason: string; event: { eventId: string } | null }
assert.equal(recommendation.dispatchType, 'mainline')
assert.equal(recommendation.reason, 'mainline')
assert.equal(recommendation.event?.eventId, 'birth_first_voice_v1')

const extraBeforeDefaultLimit = await api('/v1/fixed-content/events/extra', {
  method: 'POST', headers, body: JSON.stringify({ idempotencyKey: 'api-extra-too-early' }),
})
assert.equal(extraBeforeDefaultLimit.status, 409)

const extraUserResponse = await api('/v1/auth/guest', { method: 'POST' })
assert.equal(extraUserResponse.status, 201)
const extraSession = await extraUserResponse.json() as { token: string; user: { id: string } }
const extraHeaders = { Authorization: `Bearer ${extraSession.token}`, 'Content-Type': 'application/json' }
openDatabase().prepare('INSERT INTO fixed_event_state (user_id, record) VALUES (?, ?)').run(extraSession.user.id, JSON.stringify({
  userId: extraSession.user.id,
  worldState: {}, completedEventIds: [], startedEventIds: [], dailyCompletionByEventId: {}, dailyTopicCursor: null,
  budget: {
    localDate: new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' })
      .format(new Date()),
    timeZone: 'Asia/Shanghai', newMainlineUsed: 2, newDailyUsed: 0,
    newLearningObjectsUsed: 6, newCoreExpressionsUsed: 2, recallUsed: 0,
    extraEventUsed: 0, extraEventGranted: false,
  },
  active: null, responseByIdempotencyKey: {}, commandByIdempotencyKey: {},
}))
const extraGrant = await api('/v1/fixed-content/events/extra', {
  method: 'POST', headers: extraHeaders, body: JSON.stringify({ idempotencyKey: 'api-extra-grant-once' }),
})
assert.equal(extraGrant.status, 200)
const extraGrantBody = await extraGrant.json()
const extraReplay = await api('/v1/fixed-content/events/extra', {
  method: 'POST', headers: extraHeaders, body: JSON.stringify({ idempotencyKey: 'api-extra-grant-once' }),
})
assert.equal(extraReplay.status, 200)
assert.deepEqual(await extraReplay.json(), extraGrantBody)
const extraSecondKey = await api('/v1/fixed-content/events/extra', {
  method: 'POST', headers: extraHeaders, body: JSON.stringify({ idempotencyKey: 'api-extra-second-key' }),
})
assert.equal(extraSecondKey.status, 409)

const manualRecall = await api('/v1/fixed-content/events/b2_recall_room_v1/start', {
  method: 'POST', headers,
  body: JSON.stringify({ eventId: 'b2_recall_room_v1', idempotencyKey: 'api-manual-recall' }),
})
assert.equal(manualRecall.status, 409)

const start = await api('/v1/fixed-content/events/birth_first_voice_v1/start', {
  method: 'POST', headers,
  body: JSON.stringify({ eventId: 'birth_first_voice_v1', idempotencyKey: 'api-start-mainline' }),
})
assert.equal(start.status, 201)
const instance = await start.json() as { instanceId: string; status: string }
assert.equal(instance.status, 'active')

const pause = await api(`/v1/fixed-content/events/${instance.instanceId}/pause`, {
  method: 'POST', headers, body: JSON.stringify({ idempotencyKey: 'api-pause-mainline' }),
})
assert.equal(pause.status, 200)
assert.equal((await pause.json() as { status: string }).status, 'paused')

const current = await api('/v1/fixed-content/events/current', { headers })
assert.equal(current.status, 200)
assert.equal((await current.json() as { instance: { status: string } }).instance.status, 'paused')

const resume = await api(`/v1/fixed-content/events/${instance.instanceId}/resume`, {
  method: 'POST', headers, body: JSON.stringify({ idempotencyKey: 'api-resume-mainline' }),
})
assert.equal(resume.status, 200)
assert.equal((await resume.json() as { status: string }).status, 'active')

const blockedSecondStart = await api('/v1/fixed-content/events/b1_first_room_object_v1/start', {
  method: 'POST', headers,
  body: JSON.stringify({ eventId: 'b1_first_room_object_v1', idempotencyKey: 'api-locked-second' }),
})
assert.equal(blockedSecondStart.status, 409)

const competitionResponse = await api('/v1/auth/guest', { method: 'POST' })
assert.equal(competitionResponse.status, 201)
const competitionSession = await competitionResponse.json() as { token: string; user: { id: string } }
const competitionHeaders = { Authorization: `Bearer ${competitionSession.token}`, 'Content-Type': 'application/json' }
const completedMainline = [
  'birth_first_voice_v1', 'b1_first_room_object_v1', 'b2_room_tour_v1', 'b2_name_objects_v1',
  'b2_outside_road_v1', 'b2_my_likes_v1', 'b2_small_task_v1', 'b2_sound_comes_back_v1',
]
openDatabase().prepare('INSERT INTO fixed_event_state (user_id, record) VALUES (?, ?)').run(competitionSession.user.id, JSON.stringify({
  userId: competitionSession.user.id,
  worldState: {}, completedEventIds: completedMainline, startedEventIds: completedMainline,
  dailyCompletionByEventId: {}, dailyTopicCursor: null, budget: null, active: null,
  responseByIdempotencyKey: {}, commandByIdempotencyKey: {},
}))
const apiMemoryStore = new SqliteMemoryStore()
const competitionProposal = apiMemoryStore.proposeFromFixedEvent(competitionSession.user.id, '00000000-0000-4000-8000-000000000401', [{
  kind: 'relationship', content: 'API 竞争场景房间回忆。', confidence: 'high', semanticTags: ['b2_recall_room_v1'],
}])[0]
apiMemoryStore.act(competitionSession.user.id, competitionProposal.id, {
  action: 'confirm', expectedVersion: competitionProposal.version, content: competitionProposal.content,
  idempotencyKey: 'api-confirm-competition-recall',
})
const competitionRecommendationResponse = await api('/v1/fixed-content/recommendation', { headers: competitionHeaders })
assert.equal(competitionRecommendationResponse.status, 200)
const competitionRecommendation = await competitionRecommendationResponse.json() as {
  dispatchType: string
  event: { eventId: string } | null
  activeInstance: unknown
  recallPrompt: { eventId: string; sourceType: string } | null
}
assert.equal(competitionRecommendation.dispatchType, 'mainline')
assert.equal(competitionRecommendation.event?.eventId, 'b2_ready_for_school_v1')
assert.equal(competitionRecommendation.activeInstance, null)
assert.equal(competitionRecommendation.recallPrompt?.eventId, 'b2_recall_room_v1')
const competitionCurrent = await api('/v1/fixed-content/events/current', { headers: competitionHeaders })
assert.deepEqual(await competitionCurrent.json(), { instance: null })
const competitionStart = await api('/v1/fixed-content/events/b2_ready_for_school_v1/start', {
  method: 'POST', headers: competitionHeaders,
  body: JSON.stringify({ eventId: 'b2_ready_for_school_v1', idempotencyKey: 'api-start-mainline-with-recall' }),
})
assert.equal(competitionStart.status, 201)
assert.equal((await competitionStart.json() as { eventId: string; status: string }).eventId, 'b2_ready_for_school_v1')

openDatabase().close()
for (const suffix of ['', '-wal', '-shm']) {
  const file = dbPath + suffix
  if (existsSync(file)) rmSync(file, { force: true })
}

console.log(JSON.stringify({
  ok: true,
  checks: [
    'catalog-hides-recall', 'unified-recommendation', 'manual-recall-start-rejected',
    'server-start-revalidation', 'pause-current-resume-api',
    'extra-before-default-limit-409', 'extra-after-two-mainlines-success-idempotent-replay-second-key-409',
    'api-mainline-wins-recall-competition-non-preemptive-prompt-current-null-mainline-starts-201',
  ],
}, null, 2))
