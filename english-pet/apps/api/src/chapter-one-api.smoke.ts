import assert from 'node:assert/strict'
import { existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const dbPath = join(tmpdir(), `chapter-one-api-smoke-${Date.now()}.db`)
process.env.SQLITE_PATH = dbPath
process.env.API_NO_LISTEN = '1'
process.env.STORE_DRIVER = 'sqlite'
process.env.AI_ASR_PROVIDER = 'mock'

const { app } = await import('./index.js')
const { openDatabase } = await import('./sqlite-db.js')
const api = app.request.bind(app)
const audioBase64 = (text: string) => Buffer.from(`mock:${text}`, 'utf8').toString('base64')

async function createGuest() {
  const guest = await api('/v1/auth/guest', { method: 'POST' })
  assert.equal(guest.status, 201)
  const session = await guest.json() as { token: string }
  return { token: session.token, headers: { Authorization: `Bearer ${session.token}`, 'Content-Type': 'application/json' } }
}
async function post(headers: Record<string, string>, path: string, body: unknown) {
  return api(path, { method: 'POST', headers, body: JSON.stringify(body) })
}
async function transcribe(headers: Record<string, string>, instanceId: string, stateId: string, text: string) {
  const response = await post(headers, '/v1/audio/transcriptions', { audioBase64: audioBase64(text), mimeType: 'audio/wav', languageHint: 'en', fixedEventInstanceId: instanceId, fixedEventStateId: stateId })
  const body = await response.json() as { text?: string; fixedEventAsrProof?: string; fixedEventNormalizedText?: string }
  return { response, body }
}

const first = await createGuest()
const headers = first.headers
const rulesetResponse = await api('/v1/fixed-content/ruleset', { headers })
assert.equal(rulesetResponse.status, 200)
const ruleset = await rulesetResponse.json() as { events: Array<{ id: string; chapterId: string; sequence: number; eventType: string }> }
const chapterOne = ruleset.events.filter((event) => event.chapterId === 'chapter_01_birth')
assert.equal(chapterOne.length, 13)
assert.deepEqual(chapterOne.map((event) => event.id), [
  'birth_first_voice_v1', 'b1_first_room_object_v1', 'b1_remember_name_v1', 'b1_first_feeling_v1',
  'b1_window_light_v1', 'b1_first_letter_v1', 'b1_bell_sound_v1', 'b1_ask_about_you_v1',
  'b1_what_i_like_v1', 'b1_next_small_plan_v1', 'b1_return_first_words_v1',
  'b1_ready_for_outside_v1', 'b1_first_thank_you_v1',
])
assert.equal(ruleset.events.some((event) => event.id === 'birth_restore_object_v1'), false)

const catalogResponse = await api('/v1/fixed-content/events', { headers })
assert.equal(catalogResponse.status, 200)
const catalog = await catalogResponse.json() as { events: Array<{ eventId: string; eventType: string; status: string }> }
assert.equal(catalog.events.some((event) => event.eventId === 'b1_return_first_words_v1'), false)
assert.equal(catalog.events.find((event) => event.eventId === 'birth_first_voice_v1')?.status, 'available')
assert.equal(catalog.events.find((event) => event.eventId === 'b1_first_room_object_v1')?.status, 'locked')

const start = await post(headers, '/v1/fixed-content/events/birth_first_voice_v1/start', { eventId: 'birth_first_voice_v1', idempotencyKey: 'chapter-one-api-start' })
assert.equal(start.status, 201)
const instance = await start.json() as { instanceId: string; eventId: string; currentState: { id: string } }
assert.equal(instance.currentState.id, 'c1e1_open')
const open = await post(headers, `/v1/fixed-content/events/${instance.instanceId}/advance`, { inputMode: 'choice', choiceId: 'c1e1_choice_open', idempotencyKey: 'chapter-one-api-open' })
assert.equal(open.status, 200)
assert.equal((await open.json() as { currentState: { id: string } }).currentState.id, 'c1e1_route')
const bypass = await post(headers, `/v1/fixed-content/events/${instance.instanceId}/advance`, { inputMode: 'choice', choiceId: 'c1e1_choice_finish', idempotencyKey: 'chapter-one-api-choice-bypass' })
const bypassBody = await bypass.json() as { advanced: boolean; currentState: { id: string } }
assert.equal(bypassBody.advanced, false)
assert.equal(bypassBody.currentState.id, 'c1e1_route')
const select = await post(headers, `/v1/fixed-content/events/${instance.instanceId}/advance`, { inputMode: 'choice', choiceId: 'c1e1_choice_presence', idempotencyKey: 'chapter-one-api-select-presence' })
assert.equal((await select.json() as { currentState: { id: string } }).currentState.id, 'c1e1_input_presence')

const noProof = await post(headers, `/v1/fixed-content/events/${instance.instanceId}/advance`, { inputMode: 'confirmed_asr_text', text: "Yes, I'm here.", idempotencyKey: 'chapter-one-api-no-proof' })
assert.equal((await noProof.json() as { advanced: boolean }).advanced, false)
const fakeProof = await post(headers, `/v1/fixed-content/events/${instance.instanceId}/advance`, { inputMode: 'confirmed_asr_text', text: "Yes, I'm here.", asrProof: '00000000-0000-0000-0000-000000000000', idempotencyKey: 'chapter-one-api-fake-proof' })
assert.equal((await fakeProof.json() as { advanced: boolean }).advanced, false)
// Mock ASR 仍返回识别展示，但绝不能签发正式课程凭证。
const mock = await transcribe(headers, instance.instanceId, 'c1e1_input_presence', "Yes, I'm here.")
assert.equal(mock.response.status, 200)
assert.equal(mock.body.fixedEventAsrProof, undefined)
const mockAdvance = await post(headers, `/v1/fixed-content/events/${instance.instanceId}/advance`, { inputMode: 'confirmed_asr_text', text: mock.body.text, idempotencyKey: 'mock-cannot-advance' })
assert.equal((await mockAdvance.json() as { advanced: boolean }).advanced, false)
const begin = await post(headers, `/v1/fixed-content/events/${instance.instanceId}/teaching`, { action: 'begin', stateId: 'c1e1_input_presence', idempotencyKey: 'api-teaching-begin' })
assert.equal(begin.status, 200)
assert.equal((await begin.json() as { step: { kind: string } }).step.kind, 'repeat')
const invalidState = await post(headers, `/v1/fixed-content/events/${instance.instanceId}/teaching`, { action: 'begin', stateId: 'c1e1_route', idempotencyKey: 'api-wrong-teaching-state' })
assert.equal(invalidState.status, 409)
const paused = await post(headers, `/v1/fixed-content/events/${instance.instanceId}/pause`, { idempotencyKey: 'chapter-one-api-pause' })
assert.equal((await paused.json() as { status: string }).status, 'paused')
const resumed = await post(headers, `/v1/fixed-content/events/${instance.instanceId}/resume`, { idempotencyKey: 'chapter-one-api-resume' })
assert.equal((await resumed.json() as { currentState: { id: string } }).currentState.id, 'c1e1_input_presence')
const discard = await post(headers, `/v1/fixed-content/events/${instance.instanceId}/asr-proof/discard`, { stateId: 'c1e1_input_presence', asrProof: '00000000-0000-0000-0000-000000000000' })
assert.equal(discard.status, 200)
openDatabase().close()
for (const suffix of ['', '-wal', '-shm']) { const path = dbPath + suffix; if (existsSync(path)) rmSync(path, { force: true }) }
console.log(JSON.stringify({ ok: true, checks: [
  'api-ruleset-hidden-recall-and-route-selection', 'api-choice-bypass-rejected',
  'api-mock-asr-never-issues-course-proof', 'api-teaching-begin-and-state-conflict',
  'api-pause-resume-and-idempotent-discard',
] }, null, 2))