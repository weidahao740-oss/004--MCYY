/// <reference lib="dom" />
// 正式页面集成检查：独立临时数据库 + 测试识别适配器，绝不访问真实语音服务。
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { mkdirSync, rmSync } from 'node:fs'
import { serve } from '@hono/node-server'
import { QwenASR } from '@english-pet/ai'

const dbPath = join(tmpdir(), `s10-browser-${Date.now()}.db`)
process.env.SQLITE_PATH = dbPath
process.env.API_NO_LISTEN = '1'
process.env.STORE_DRIVER = 'sqlite'
process.env.LOG_LEVEL = 'silent'
process.env.AI_ASR_PROVIDER = 'qwen'
process.env.DASHSCOPE_API_KEY = 'isolated-test-key-never-sent'
process.env.WEB_ORIGIN = 'http://127.0.0.1:15173'
let recognizedText = 'Yes'
QwenASR.prototype.transcribe = async function () {
  return { provider: 'dashscope', model: 'isolated-browser-fixture', text: recognizedText, confidence: null }
}
const { app } = await import('./index.js')
const { openDatabase } = await import('./sqlite-db.js')
const apiServer = serve({ fetch: app.fetch, hostname: '127.0.0.1', port: 0 })
await new Promise<void>(done => apiServer.listening ? done() : apiServer.once('listening', done))
const address = apiServer.address() as { port: number }
process.env.VITE_API_BASE_URL = `http://127.0.0.1:${address.port}`
const { createServer } = await import('vite')
const vite = await createServer({ root: resolve('apps/web'), configFile: resolve('apps/web/vite.config.ts'), server: { host: '127.0.0.1', port: 15173, strictPort: true } })
await vite.listen()
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/Administrator/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
const page = await context.newPage()
const errors: string[] = []
page.on('pageerror', (error: Error) => errors.push(error.message))
const evidence = resolve('../验收记录/S10-浏览器检查-20261017')
mkdirSync(evidence, { recursive: true })
const checks: string[] = []
function installFixtures() {
  const state = { deny: false, stopped: 0 }
  ;(window as any).__testMic = state
  Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { value: async () => {
    if (state.deny) throw new DOMException('test denied', 'NotAllowedError')
    const track = { stop() { state.stopped += 1 }, addEventListener() {} }
    return { getTracks: () => [track], getAudioTracks: () => [track] }
  } })
  class Recorder {
    static isTypeSupported() { return true }
    state = 'inactive'; mimeType = 'audio/webm'
    ondataavailable: any; onstop: any; onerror: any
    constructor(..._args: any[]) {}
    start() { this.state = 'recording' }
    stop() {
      if (this.state === 'inactive') return
      this.state = 'inactive'
      setTimeout(() => { this.ondataavailable?.({ data: new Blob(['isolated recording fixture']) }); this.onstop?.() }, 0)
    }
  }
  Object.defineProperty(window, 'MediaRecorder', { value: Recorder })
}
await page.addInitScript({ content: 'globalThis.__name = (fn) => fn; (' + installFixtures.toString() + ')()' })
const button = (name: string) => page.getByRole('button', { name, exact: true })
async function visible(text: string) { await page.getByText(text, { exact: true }).waitFor() }
async function record(text: string) {
  recognizedText = text
  await button('开始录音').click()
  await button('结束录音').click()
  await button('是的，确认这次识别').waitFor()
}
async function confirm(text: string) { await record(text); await button('是的，确认这次识别').click() }
try {
  await page.goto('http://127.0.0.1:15173')
  await page.getByRole('button', { name: /游客|访客/ }).click()
  await button('去看看是谁').click()
  await button('走近这个声音').click()
  await button('回应墨洛').click()
  const route = page.locator('.s09-choice-layer button').first()
  await route.click()
  await visible('先认识这一小段')
  await page.screenshot({ path: join(evidence, '01-teaching-mobile.png') })
  assert.equal(await page.locator('.room-image').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0), true)
  checks.push('mobile-entry-image-and-first-teaching')
  await page.evaluate(() => { (window as any).__testMic.deny = true })
  await button('开始录音').click()
  await page.getByText(/麦克风没有打开/).waitFor()
  await page.evaluate(() => { (window as any).__testMic.deny = false })
  await button('开始录音').click()
  await button('取消这次录音').click()
  assert.ok(await page.evaluate(() => (window as any).__testMic.stopped > 0))
  checks.push('microphone-denial-cancel-release')
  await record('No')
  await button('不是，重新录').click()
  await button('开始录音').waitFor()
  await confirm('No')
  await page.getByText(/这次还没有识别到当前这段话/).waitFor()
  await confirm('Yes')
  await page.locator('.s09-target').filter({ hasText: "I'm here" }).waitFor()
  checks.push('reject-transcript-and-wrong-speech-rerecord')
  await button('稍后继续').click()
  await button('继续刚才').waitFor()
  await page.reload()
  await button('继续刚才').click()
  await page.locator('.s09-target').filter({ hasText: "I'm here" }).waitFor()
  await confirm("I'm here")
  await visible('把话连起来')
  await page.locator('.s09-chunks button').filter({ hasText: 'Yes,' }).click()
  await page.locator('.s09-chunks button').filter({ hasText: "I'm here" }).click()
  await button('这样说').click()
  await confirm("Yes, I'm here.")
  await page.getByText("Oh, good. I'm Morrow. I wasn't sure anyone was there.", { exact: true }).waitFor()
  await button('继续').click()
  await button('陪墨洛看看房间').click()
  await button('回到房间').click()
  checks.push('pause-refresh-resume-same-step-and-complete-event-one')
  // E01-02 通过真实页面完成教学；供应商仍是当前测试进程中的替身。
  await button('和墨洛聊聊').click()
  await page.locator('.s09-choice-layer button').first().click()
  await page.locator('.s09-choice-layer button').first().click()
  const testToken = await page.evaluate(() => localStorage.getItem('english-pet:session-token'))
  async function teachingView() {
    const headers = { Authorization: `Bearer ${testToken}`, 'Content-Type': 'application/json' }
    const current = await (await app.request('/v1/fixed-content/events/current', { headers })).json() as any
    const response = await app.request(`/v1/fixed-content/events/${current.instance.instanceId}/teaching`, { method: 'POST', headers, body: JSON.stringify({ action: 'begin', stateId: current.instance.currentState.id, idempotencyKey: crypto.randomUUID() }) })
    assert.equal(response.status, 200)
    return await response.json() as any
  }
  for (let count = 0; count < 12; count += 1) {
    const view = await teachingView()
    if (view.step.kind === 'repeat') await confirm(view.step.english)
    else if (view.step.kind === 'intro') await page.locator('.s09-choice-layer .primary').click()
    else if (view.step.kind === 'gap') await button('first').click()
    else if (view.step.kind === 'output') { await confirm(view.target.learningContent.english); break }
    else throw new Error(`unexpected E02 step ${view.step.kind}`)
    await page.waitForFunction((previous: string) => document.querySelector('.s09-glass small')?.textContent !== previous, `学当前这一步 · ${view.stepIndex + 1} / ${view.stepCount}`)
  }
  await button('问问墨洛').click()
  await page.getByText('先看看要表达的意思', { exact: true }).waitFor()
  await button('开始认识这句话').click()
  await page.getByText('轮到你说了', { exact: true }).waitFor()
  assert.equal(await button('回应墨洛').count(), 0)
  await confirm('What about you?')
  await button('回应墨洛').waitFor()
  await page.screenshot({ path: join(evidence, '04-event-two-answer.png') })
  await button('回应墨洛').click()
  await page.getByText('回应彼此看到的不同', { exact: true }).waitFor()
  assert.equal(await page.locator('.s09-dialogue').count(), 0)
  await page.locator('.s09-choice-layer button').first().click()
  await button('继续').click()
  await button('完成').click()
  await button('回到房间').click()
  checks.push('event-two-teaching-first-then-question-then-morrow-answer-and-settlement')
  // 仅把本脚本独立临时库的预算切到新的一天，不改变正式每日学习上限。
  assert.ok(dbPath.startsWith(tmpdir()))
  const db = openDatabase()
  const saved = db.prepare('SELECT user_id, record FROM fixed_event_state').all() as { user_id: string; record: string }[]
  assert.equal(saved.length, 1)
  const nextDay = JSON.parse(saved[0]!.record)
  nextDay.budget = null
  db.prepare('UPDATE fixed_event_state SET record = ? WHERE user_id = ?').run(JSON.stringify(nextDay), saved[0]!.user_id)
  await button('更新当前安排').click()
  await visible('把称呼定下来')
  await button('和墨洛聊聊').click()
  await button('回应墨洛').click()
  await button('这个名字很适合你').click()
  await button('告诉墨洛以后这样称呼它').click()
  async function completeNameTeaching() {
    for (let count = 0; count < 12; count += 1) {
      await page.locator('.s09-teaching .s09-glass small').waitFor()
      const view = await teachingView()
      if (view.step.kind === 'repeat') await confirm(view.step.english)
      else if (view.step.kind === 'intro') await button('开始认识这句话').click()
      else if (view.step.kind === 'order') {
        await page.screenshot({ path: join(evidence, '05-event-three-order.png') })
        assert.deepEqual(view.step.answerIds.map((id: string) => view.step.options.find((option: any) => option.id === id).label), ["I'll", 'call you Morrow'])
        for (const id of view.step.answerIds) await button(view.step.options.find((option: any) => option.id === id).label).click()
        await button('这样说').click()
      } else if (view.step.kind === 'output') { await confirm(view.target.learningContent.english); return }
      else throw new Error(`unexpected E03 step ${view.step.kind}`)
      await page.waitForFunction((previous: string) => document.querySelector('.s09-teaching .s09-glass small')?.textContent !== previous, `学当前这一步 · ${view.stepIndex + 1} / ${view.stepCount}`)
    }
    throw new Error('E03 teaching did not reach output')
  }
  async function currentInstance() {
    return (await (await app.request('/v1/fixed-content/events/current', { headers: { Authorization: `Bearer ${testToken}` } })).json() as any).instance
  }
  await completeNameTeaching()
  await button('现在叫它一声').waitFor()
  assert.equal((await currentInstance()).worldState.morrow_self_address, undefined)
  await button('现在叫它一声').click()
  await completeNameTeaching()
  await button('说说这个称呼的感觉').waitFor()
  await page.screenshot({ path: join(evidence, '06-event-three-response.png') })
  await button('说说这个称呼的感觉').click()
  await button('这样叫你很自然').click()
  await button('继续').click()
  await button('完成').waitFor()
  assert.equal((await currentInstance()).worldState.morrow_self_address, undefined)
  await button('完成').click()
  await button('回到房间').waitFor()
  const completedRecord = JSON.parse((db.prepare('SELECT record FROM fixed_event_state WHERE user_id = ?').get(saved[0]!.user_id) as { record: string }).record)
  assert.equal(completedRecord.worldState.morrow_self_address, 'morrow')
  assert.ok(completedRecord.completedEventIds.includes('b1_remember_name_v1'))
  await page.screenshot({ path: join(evidence, '07-event-three-completed.png') })
  await button('回到房间').click()
  checks.push('event-three-chunks-order-two-speech-confirmations-and-final-only-settlement')
  await button('成长').click()
  await visible('已经一起经历 3 件小事。')
  await page.reload()
  await visible('已经一起经历 3 件小事。')
  await button('共同经历').click()
  await visible('苏醒后的第一句话')
  await button('设置').click()
  await page.locator('select').selectOption('0.8')
  await page.waitForFunction(() => (document.querySelector('select') as HTMLSelectElement)?.value === '0.8' && !document.querySelector('select')?.disabled)
  await page.screenshot({ path: join(evidence, '02-settings-mobile.png') })
  await page.reload()
  await button('设置').click()
  assert.equal(await page.locator('select').inputValue(), '0.8')
  await page.getByRole('link', { name: '账号与隐私设置' }).click()
  await page.getByText('删除账号数据', { exact: true }).waitFor()
  await page.getByRole('link', { name: '返回房间设置' }).click()
  await visible('按舒服的方式来')
  await page.goto('http://127.0.0.1:15173/settings')
  await visible('按舒服的方式来')
  assert.ok(page.url().endsWith('/room?view=settings'))
  await page.getByRole('link', { name: '账号与隐私设置' }).click()
  await page.getByText('删除账号数据', { exact: true }).waitFor()
  checks.push('growth-history-account-settings-persist')
  const sessionBefore = await page.evaluate(() => localStorage.getItem('english-pet:session-token'))
  await page.route('**/v1/me', (route: { abort(): Promise<void> }) => route.abort())
  await page.reload()
  await button('重新连接原账号').waitFor()
  assert.equal(await page.evaluate(() => localStorage.getItem('english-pet:session-token')), sessionBefore)
  await page.unroute('**/v1/me')
  await button('重新连接原账号').click()
  await page.getByText('删除账号数据', { exact: true }).waitFor()
  checks.push('network-restore-preserves-original-account')
  await page.goto('http://127.0.0.1:15173/events')
  await button('房间').waitFor()
  assert.ok(page.url().endsWith('/room'))
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 844 })
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    for (const name of ['房间', '成长', '共同经历', '设置']) {
      const box = await button(name).boundingBox()
      assert.ok(box && box.x >= 0 && box.y >= 0 && box.x + box.width <= width + 1 && box.y + box.height <= 845)
    }
  }
  await page.screenshot({ path: join(evidence, '03-room-desktop.png') })
  checks.push('legacy-event-redirect-and-three-viewport-navigation')
  assert.deepEqual(errors, [])
  rmSync(join(evidence, 'failure.png'), { force: true })
  console.log(JSON.stringify({ ok: true, checks, voice: 'TEST FIXTURES ONLY; no live ASR or TTS', screenshots: evidence }, null, 2))
} catch (error) {
  await page.screenshot({ path: join(evidence, 'failure.png'), fullPage: true })
  console.log(JSON.stringify({ url: page.url(), text: (await page.locator('body').innerText()).slice(0, 5000), errors }))
  throw error
} finally {
  await browser.close()
  await vite.close()
  await new Promise<void>((done, reject) => apiServer.close(error => error ? reject(error) : done()))
  openDatabase().close()
  for (const suffix of ['', '-wal', '-shm']) rmSync(dbPath + suffix, { force: true })
}
