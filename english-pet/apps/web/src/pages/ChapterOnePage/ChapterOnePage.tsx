import { useEffect, useRef, useState } from 'react'
import { BookOpenText, ChevronLeft, CircleUserRound, MapPin, Settings, Sparkles, Volume2, VolumeX } from 'lucide-react'
import { command, request, teachingCommand, type FixedEventCatalogItem, type FixedEventInstanceView, type FixedEventRecommendationView, type FixedEventTeachingView, type TranscribeAudioResponse } from './backend'
import SpeechInput from './SpeechInput'
import StoryDialogue from './StoryDialogue'
import Dialogue, { SpeedControl } from './Dialogue'
import { useAuth } from '@/auth/auth-context'
import { Link, useSearchParams } from 'react-router-dom'
import './chapter.css'
import './s09.css'



const BASE = `${(import.meta.env.MIAODA_CLIENT_BASE_PATH || '').replace(/\/$/, '')}/`
type Page = 'welcome' | 'opening' | 'room' | 'event' | 'growth' | 'echoes' | 'settings'
const chapterId = 'chapter_01_birth'
const scenes = { room: '墨洛的房间', window: '窗边观察区', activity: '房间功能角落', door: '门口与外面的小路' }
const eventUrl = (instance: FixedEventInstanceView, action: string) => `/v1/fixed-content/events/${instance.instanceId}/${action}`

function MeaningPicture({ identity }: { identity: boolean }) {
  return <svg viewBox="0 0 140 80" role="img" aria-label={identity ? '两个人第一次见面，一方想知道对方是谁' : '一个人回应另一方，表示自己在这里'}>
    <circle cx="34" cy="28" r="12"/><path d="M14 68Q14 44 34 44Q54 44 54 68"/>
    <circle cx="106" cy="28" r="12"/><path d="M86 68Q86 44 106 44Q126 44 126 68"/>
    <path d={identity ? 'M53 22H86M80 16L86 22L80 28' : 'M87 25H54M60 19L54 25L60 31'} fill="none" stroke="currentColor" strokeWidth="2"/>
    <text x="70" y="50" textAnchor="middle" fontSize="23" fill="currentColor">{identity ? '?' : '✓'}</text>
  </svg>
}

function ChapterExperience({ token }: { token: string }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState<Page>('welcome')
  const { session, updateSettings } = useAuth()
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [quiet, setQuiet] = useState(false)
  const [catalog, setCatalog] = useState<FixedEventCatalogItem[]>([])
  const [recommendation, setRecommendation] = useState<FixedEventRecommendationView | null>(null)
  const [instance, setInstance] = useState<FixedEventInstanceView | null>(null)
  const [teaching, setTeaching] = useState<FixedEventTeachingView | null>(null)
  const [teachingError, setTeachingError] = useState('')
  const [teachingRetry, setTeachingRetry] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [help, setHelp] = useState(0)
  const [audioStop, setAudioStop] = useState(0)
  const [speechEpoch, setSpeechEpoch] = useState(0)
  const [muted, setMuted] = useState(() => !session.settings.voiceOutputEnabled)
  const [rate, setRate] = useState(() => Number(session.settings.speechRate))
  const lock = useRef(false)
  const mounted = useRef(true)
  const cooldown = useRef(0)
  const scroll = useRef<HTMLDivElement>(null)

  function stopPlayback() {
    window.dispatchEvent(new Event('morrow:s09:stop-playback'))
    setAudioStop(value => value + 1)
  }
  async function withLock<T,>(work: () => Promise<T>): Promise<T> {
    if (lock.current) throw new Error('正在处理上一步，请稍等。')
    lock.current = true; setBusy(true); setError('')
    try { return await work() }
    finally { lock.current = false; if (mounted.current) setBusy(false) }
  }
  function act(work: () => Promise<unknown>) {
    void withLock(work).catch(err => { if (mounted.current) setError(err instanceof Error ? err.message : '没有处理成功，请再试一次。') })
  }
  function changeRate(value: number) {
    const speechRate = value === 1 ? '1.0' : value === 0.8 ? '0.8' : '0.6'
    act(() => updateSettings({ speechRate }))
  }
  async function loadRoom(currentToken: string) {
    const results = await Promise.allSettled([
      request<{ events: FixedEventCatalogItem[] }>('/v1/fixed-content/events', currentToken),
      request<FixedEventRecommendationView>('/v1/fixed-content/recommendation', currentToken),
    ])
    const [events, next] = results
    if (events.status === 'rejected') throw events.reason
    if (next.status === 'rejected') throw next.reason
    if (!mounted.current) return
    setCatalog(events.value.events.filter(event => event.chapterId === chapterId))
    setRecommendation(next.value); setInstance(next.value.activeInstance)
    return { events: events.value.events, next: next.value }
  }
  async function connect() {
    const currentToken = token
    if (!mounted.current) return

    const room = await loadRoom(currentToken)
    if (!room || !mounted.current) return
    setReady(true)
    const savedPage = searchParams.get('view')
    setPage(savedPage === 'settings' || savedPage === 'growth' || savedPage === 'echoes' ? savedPage
      : room.next.activeInstance || room.events.some(event => event.chapterId === chapterId && event.status === 'completed') ? 'room' : 'welcome')
  }
  useEffect(() => {
    mounted.current = true
    // StrictMode 第二次挂载复用连接；账号由正式 AuthProvider 提供。
    if (!lock.current) act(connect)
    return () => { mounted.current = false; window.dispatchEvent(new Event('morrow:s09:stop-playback')) }
  }, [])
  useEffect(() => { setMuted(!session.settings.voiceOutputEnabled) }, [session.settings.voiceOutputEnabled])
  useEffect(() => { setRate(Number(session.settings.speechRate)) }, [session.settings.speechRate])
  const state = instance?.currentState
  const inputContext = page === 'event' && instance?.status === 'active' && state?.phase === 'input' ? `${instance.instanceId}:${state.id}` : ''
  useEffect(() => {
    let cancelled = false
    setTeaching(null); setTeachingError(''); setAnswers([]); setHelp(0)
    if (inputContext && instance) teachingCommand(token, instance, { action: 'begin' }).then(value => {
      if (!cancelled) setTeaching(value)
    }).catch(err => { if (!cancelled) setTeachingError(err instanceof Error ? err.message : '没有读到教学进度。') })
    return () => { cancelled = true }
  }, [inputContext, teachingRetry, token])
  useEffect(() => {
    setAnswers([]); setHelp(0); setNotice('')
    scroll.current?.scrollTo({ top: 0 }); stopPlayback()
  }, [page, instance?.instanceId, state?.id, teaching?.step.id])

  const completed = catalog.filter(event => event.eventType !== 'recall' && event.status === 'completed')
  const chapterDone = catalog.some(event => event.eventId === 'b1_ready_for_outside_v1' && event.status === 'completed')
  const recommended = recommendation?.event?.chapterId === chapterId ? recommendation.event : null
  const active = instance && instance.status !== 'completed' ? instance : null
  const scene = instance?.sequence === 12 ? 'door' : [5, 7].includes(instance?.sequence ?? 0) ? 'window' : [2, 6, 9, 10].includes(instance?.sequence ?? 0) ? 'activity' : 'room'
  const step = teaching?.step

  async function startRecommended() {
    if (active) {
      const { instance: current } = await request<{ instance: FixedEventInstanceView | null }>('/v1/fixed-content/events/current', token)
      if (!current || current.status === 'completed') {
        setInstance(current); setPage('room')
        await loadRoom(token)
        setNotice('已经重新读取当前进度，可以按房间里的安排继续。')
        return
      }
      const next = current.status === 'paused' ? await command<FixedEventInstanceView>(eventUrl(current, 'resume'), token) : current
      setInstance(next); setPage('event'); return
    }
    if (!recommended || recommended.eventType === 'recall') {
      const room = await loadRoom(token)
      setPage('room')
      if (room?.next.activeInstance) setNotice('墨洛想起了一句话，准备好时可以接着聊。')
      return
    }
    const next = await command<FixedEventInstanceView>(`/v1/fixed-content/events/${recommended.eventId}/start`, token, { eventId: recommended.eventId })
    setInstance(next); setPage('event')
  }
  async function goTo(nextPage: Page) {
    setLeaving(true)
    stopPlayback(); setSpeechEpoch(value => value + 1)
    try {
      if (instance?.status === 'active' && page === 'event') {
        const paused = await command<FixedEventInstanceView>(eventUrl(instance, 'pause'), token)
        setInstance(paused)
      }
      setPage(nextPage)
      setQuiet(false)
      setSearchParams(nextPage === 'settings' || nextPage === 'growth' || nextPage === 'echoes' ? { view: nextPage } : {}, { replace: true })
      if (nextPage !== 'event') await loadRoom(token)
    } finally {
      if (mounted.current) setLeaving(false)
    }
  }
  async function advance(body: Record<string, unknown>, allowRerecord = false) {
    if (!instance) throw new Error('请先读取当前事件。')
    stopPlayback()
    const next = await command<FixedEventInstanceView>(eventUrl(instance, 'advance'), token, body)
    setInstance(next); setNotice(next.messageZh || '')
    if (!allowRerecord && !next.advanced && next.status !== 'completed') throw new Error(next.messageZh || '这一步还没完成，可以再试一次。')
    return next
  }
  async function confirmSpeech(result: TranscribeAudioResponse) {
    return withLock(async () => {
      if (!instance || !teaching) throw new Error('请先读取当前教学进度。')
      if (teaching.step.kind === 'repeat') {
        const next = await teachingCommand(token, instance, { action: 'confirm', stepId: teaching.step.id, text: result.text, asrProof: result.fixedEventAsrProof })
        setTeaching(next)
        return { accepted: next.stepIndex > teaching.stepIndex, messageZh: next.messageZh }
      }
      const next = await advance({ inputMode: 'confirmed_asr_text', text: result.text, asrProof: result.fixedEventAsrProof }, true)
      return { accepted: next.advanced || next.status === 'completed', messageZh: next.messageZh }
    })
  }
  async function confirmExercise(answerIds = answers) {
    if (!instance || !teaching) return
    const next = await teachingCommand(token, instance, { action: 'confirm', stepId: teaching.step.id, answerIds })
    setTeaching(next); setNotice(next.messageZh || '')
    if (next.step.id !== teaching.step.id) setAnswers([])
  }

  const storyLines = state?.phase === 'input'
    ? teaching?.stateId === state.id
      ? [...state.lines.filter(line => line.id !== teaching.target.id), ...(step?.storyLine ? [step.storyLine] : [])]
      : []
    : state?.lines ?? []
  const showHeader = page === 'room' || page === 'event'

  return <main className="chapter-shell"><section className={`phone s09-phone scene-${scene} chapter-page-${page}`} aria-label="Morrow 第一章">
    <img className="room-image" src={`${BASE}chapter-one/morrow-room.png`} alt="墨洛生活的房间"/><div className="scene-treatment"/><div className="shade"/>
    {showHeader && <>
      <div className="s09-header"><span className="status-pill">{page === 'event' && instance ? instance.titleZh : '幼年期 · 第一章'}</span>
        {page === 'room' ? <button className="icon-button" aria-label="设置" disabled={busy} onClick={() => act(() => goTo('settings'))}><Settings/></button>
          : <button className="icon-button" aria-label={muted ? '打开声音' : '关闭声音'} disabled={busy} onClick={() => { stopPlayback(); act(() => updateSettings({ voiceOutputEnabled: muted })) }}>{muted ? <VolumeX/> : <Volume2/>}</button>}
      </div>
      <div className="scene-label"><MapPin/><span>{scenes[scene]}</span></div>
    </>}
    {error && <div className="s09-error" role="alert"><p>{error}</p><button className="text-button" disabled={busy} onClick={() => act(ready ? () => goTo('room') : connect)}>{ready ? '回房间重新读取' : '重新连接'}</button></div>}
    {page === 'welcome' && <div className="panel-page welcome">
      <button className="welcome-sound" aria-label={muted ? '打开声音' : '关闭声音'} disabled={busy} onClick={() => { stopPlayback(); act(() => updateSettings({ voiceOutputEnabled: muted })) }}>{muted ? <VolumeX/> : <Volume2/>}</button>
      <div className="breath-light"/>
      <div className="welcome-content"><p>欢迎来到 Morrow 的成长世界</p><h1>幼年期 · 第一章「出生与苏醒」</h1><button className="welcome-start" disabled={!ready || busy} onClick={() => setPage('opening')}>{busy || !ready ? '正在连接…' : '去看看是谁'}</button></div>
    </div>}
    {page === 'opening' && <div className="chapter-opening panel-page" aria-label="第一章开场演绎">
      <div className="opening-vignette"/><div className="opening-glow"/>
      <div className="opening-copy"><span>第一章</span><h1>出生与苏醒</h1><p>房间里有一个微弱的声音，刚刚醒来。</p></div>
      <div className="bottom-stack encounter-actions"><button className="primary" disabled={busy} onClick={() => act(startRecommended)}>走近这个声音</button></div>
      <button className="opening-skip" disabled={busy} onClick={() => act(startRecommended)}>跳过开场</button>
    </div>}
    {page === 'room' && <>
      <button className="morrow-hotspot" aria-label="摸摸 Morrow" onClick={() => { if (Date.now() < cooldown.current) return; cooldown.current = Date.now() + 4000; setNotice('墨洛轻轻看向你。准备好时，我们再继续。') }}><span className="sr-only">墨洛</span></button>
      {!quiet && <>
        <Dialogue key={`${active?.instanceId ?? recommended?.eventId ?? 'rest'}`} rate={rate} onRate={changeRate}
          english={active ? '我们可以接着刚才的地方。' : recommended ? recommended.titleZh : chapterDone ? '这一段开始，我们一起经历了。' : '先在这里待一会儿。'}
          chinese={active ? '已经记住上次确认的位置，准备好时再继续。' : recommended ? '准备好时，再和墨洛一起经历这件小事。' : recommendation?.reason === 'budget_reached' ? '今天认识的新内容已经够了，不用着急。' : '没有催着你完成的事情。'}/>
        <div className="home-actions">
          {(active || recommended) && <button className="primary" disabled={busy} onClick={() => act(startRecommended)}>{active ? '继续刚才' : '和墨洛聊聊'}</button>}
          <button className="secondary" onClick={() => setQuiet(true)}>安静待一会</button>
          {recommendation?.canRequestExtraEvent && !chapterDone && <button className="secondary" disabled={busy} onClick={() => act(async () => { await command('/v1/fixed-content/events/extra', token); await loadRoom(token) })}>今天再经历一件事</button>}
          {recommendation?.recallPrompt && <p className="voice-guide">墨洛似乎想起了你们说过的一句话。等手头这件事告一段落再聊。</p>}
          <button className="text-button chapter-refresh" disabled={busy} onClick={() => act(() => loadRoom(token))}>更新当前安排</button>
        </div>
      </>}
      {quiet && <div className="quiet-card"><p>We can stay quiet.</p><span>我们可以安静待着。这里没有要完成的任务。</span><button className="secondary" onClick={() => setQuiet(false)}>想继续时再回来</button></div>}
    </>}
    {page === 'event' && instance && <div className="s09-event">
      <button className="text-button chapter-postpone" disabled={busy} onClick={() => act(() => goTo('room'))}><ChevronLeft size={15}/>稍后继续</button>
      {instance.status === 'active' && <StoryDialogue key={`${instance.instanceId}:${state?.id}:${step?.id ?? ''}`} lines={storyLines} token={token} muted={muted} rate={rate} onRate={changeRate} stopSignal={audioStop} stopPlayback={stopPlayback}/>}
      <div className="s09-scroll chapter-event-bottom" ref={scroll}>
        {instance.status === 'paused' ? <div className="s09-glass"><h2>已经停在这里</h2><p>准备好时，我们接着来。</p><button className="primary" disabled={busy} onClick={() => act(startRecommended)}>继续刚才</button></div>
          : instance.status === 'completed' ? <div className="s09-glass"><small>这件小事已经完成</small><h2>{instance.titleZh}</h2><p>你们又一起经历了一件小事。</p><button className="primary" disabled={busy} onClick={() => act(() => goTo('room'))}>回到房间</button></div>
          : state?.phase !== 'input' ? <div className="s09-choice-layer" aria-label="当前选项"><p>{state?.phase === 'choice' ? state.uiTitleZh : '看完后，可以继续。'}</p>{state?.choices.map(choice => <button className="secondary" disabled={busy} key={choice.id} onClick={() => act(() => advance({ inputMode: 'choice', choiceId: choice.id }))}>{choice.labelZh}</button>)}</div>
          : !teaching || teaching.stateId !== state.id ? <div className="s09-glass"><p>{teachingError || '正在接回教学进度…'}</p>{teachingError && <button className="secondary" disabled={busy} onClick={() => setTeachingRetry(value => value + 1)}>重试</button>}</div>
          : <div className="s09-teaching">
            <div className="s09-glass learning-content-card"><small className="content-label">{step?.kind === 'output' ? '现在，把想说的话告诉墨洛' : `学当前这一步 · ${teaching.stepIndex + 1} / ${teaching.stepCount}`}</small><h2>{step?.kind === 'intro' ? step.storyLine ? '听见彼此的观察' : '先看看要表达的意思' : step?.kind === 'repeat' ? '先认识这一小段' : step?.kind === 'order' ? '把话连起来' : step?.kind === 'gap' ? '补上你想表达的意思' : step?.kind === 'meaning' ? '看看这句话的意思' : '轮到你说了'}</h2>
              {step?.kind !== 'output' && step?.english && <p className="s09-target" lang="en">{step.english}</p>}<p>{step?.chinese}</p>
              {step?.kind === 'repeat' && <p className="s09-caption">先看意思，再试着读出来。示范语音之后补齐。</p>}
              {step?.kind === 'output' && <>
                {instance.eventId === 'b1_return_first_words_v1' && help >= 1 && <p>{teaching.target.learningContent.translation.textZh}</p>}
                {help >= (instance.eventId === 'b1_return_first_words_v1' ? 2 : 1) && <p className="s09-target" lang="en">{help >= (instance.eventId === 'b1_return_first_words_v1' ? 4 : 3) ? teaching.target.learningContent.english : teaching.helpChunks.join(' / ')}</p>}
                {help === (instance.eventId === 'b1_return_first_words_v1' ? 3 : 2) && <p className="s09-caption">慢速示范语音还未准备好，可以继续看完整参考句。</p>}
                <button className="text-button" disabled={busy} onClick={() => setHelp(value => Math.min(instance.eventId === 'b1_return_first_words_v1' ? 4 : 3, value + 1))}>{help === 0 ? '给我一点提示' : '再给我一点帮助'}</button>
                {help > 0 && <button className="text-button" disabled={busy} onClick={() => setHelp(0)}>收起提示，再试一次</button>}
              </>}
            </div>
            {step?.kind === 'intro' && <div className="s09-choice-layer"><button className="primary" disabled={busy} onClick={() => act(() => confirmExercise([]))}>{step.storyLine ? '继续' : '开始认识这句话'}</button></div>}
            {(step?.kind === 'repeat' || step?.kind === 'output') && (leaving ? <p className="s09-message" role="status">正在保存暂停位置…</p> : <SpeechInput key={`${inputContext}:${step.id}:${speechEpoch}`} token={token} instanceId={instance.instanceId} stateId={state.id} teachingStepId={step.kind === 'repeat' ? step.id : undefined} onConfirm={confirmSpeech} stopPlayback={stopPlayback} disabled={busy}/>)}
            {step?.kind === 'order' && <div className="s09-choice-layer"><div className="s09-answer" aria-label="已排好的语块">{answers.length ? answers.map((id, index) => <button key={id} onClick={() => setAnswers(value => value.filter((_, i) => i !== index))} disabled={busy}>{step.options.find(option => option.id === id)?.label} ↶</button>) : <p>先点第一段，再点第二段。</p>}</div><div className="s09-chunks">{step.options.map(option => <button key={option.id} disabled={busy || answers.includes(option.id)} onClick={() => setAnswers(value => [...value, option.id])}>{option.label}</button>)}</div><button className="primary" disabled={busy || answers.length !== step.options.length} onClick={() => act(() => confirmExercise())}>这样说</button></div>}
            {(step?.kind === 'meaning' || step?.kind === 'gap') && <div className="s09-choice-layer s09-picture-options">{step.options.map(option => <button key={option.id} className="secondary" disabled={busy} onClick={() => act(() => confirmExercise([option.id]))}>{step.kind === 'meaning' && <MeaningPicture identity={option.id === 'identity'}/>}<span>{option.label}</span></button>)}</div>}
          </div>}
        {notice && <p className="s09-message" role="status">{notice}</p>}
      </div>
    </div>}
    {(page === 'growth' || page === 'echoes' || page === 'settings') && <div className={`list-page s09-secondary s09-scroll ${page === 'settings' ? 'settings-page' : page === 'growth' ? 'growth-page' : ''}`}>
      <div className="chapter-secondary-tools"><button className="back-button" aria-label="回房间" disabled={busy} onClick={() => act(() => goTo('room'))}><ChevronLeft/></button>{page !== 'settings' && <button className="icon-button" aria-label="设置" disabled={busy} onClick={() => act(() => goTo('settings'))}><Settings/></button>}</div>
      {page === 'settings' ? <>
        <h1>设置与隐私</h1><h2>学习支持</h2><p className="privacy-copy">教学会根据你实际完成过的内容调整，不需要自己选难度。</p>
        <h2>体验设置</h2><div className="setting-group experience-group">
          <button className="setting-row" disabled={busy} onClick={() => { stopPlayback(); act(() => updateSettings({ voiceOutputEnabled: muted })) }}><span>{muted ? <VolumeX size={18}/> : <Volume2 size={18}/>}声音</span><b>{muted ? '已关闭' : '已开启'}</b></button>
          <div className="setting-row"><span>播放倍速</span><SpeedControl rate={rate} onRate={changeRate} disabled={busy}/></div>
        </div><p className="privacy-copy">示范语音之后补齐，现在可以先阅读内容。</p>
        <h2>记忆与数据</h2><p className="privacy-copy">学习进度保存在当前账号中，可以从上次确认的位置继续。</p><div className="setting-group data-group"><Link className="setting-row chapter-account-link" to="/account/settings"><span>账号与隐私设置</span><ChevronLeft className="chapter-forward" size={16}/></Link></div>
      </> : <>
        {page === 'growth' ? <><div className="stage-summary"><small>当前人生阶段</small><h1>幼年期</h1><p>第一章 · 出生与苏醒</p></div><h2>已经发生的成长</h2><p className="privacy-copy">{chapterDone ? '慢慢认识了彼此。' : '一点点，熟悉起来。'}{completed.length ? `已经一起经历 ${completed.length} 件小事。` : '开始聊聊以后，这里会慢慢留下记录。'}</p></>
          : <><h1>共同经历</h1><p>这里只留下你和墨洛已经一起经历的事。</p></>}
        {page === 'echoes' && !completed.length && <p className="empty-state">还没有完成的经历。先回房间陪陪墨洛吧。</p>}
        {catalog.filter(event => event.eventType !== 'recall' && (page === 'growth' || event.status === 'completed')).map(event => <article key={event.eventId}><Sparkles size={20}/><div><b>{event.titleZh}</b><span>{event.status === 'completed' ? '一起经历过' : active?.eventId === event.eventId ? '正在经历' : '还在前面'}</span></div></article>)}
      </>}
    </div>}
    {!['welcome', 'opening', 'event', 'settings'].includes(page) && <nav className="bottom-nav" aria-label="主导航">{([{ id: 'room', label: '陪伴', icon: CircleUserRound }, { id: 'growth', label: '成长', icon: Sparkles }, { id: 'echoes', label: '共同经历', icon: BookOpenText }] as const).map(item => <button key={item.id} className={page === item.id ? 'active' : ''} aria-current={page === item.id ? 'page' : undefined} disabled={busy} onClick={() => act(() => goTo(item.id))}><item.icon/><span>{item.label}</span></button>)}</nav>}
    {notice && page !== 'event' && <div className="toast" role="status" aria-live="polite">{notice}</div>}
  </section></main>
}

export default function ChapterOnePage() {
  const { token, session } = useAuth()
  return token && session ? <ChapterExperience key={token} token={token}/> : null
}
