import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react'
import {
  BookOpenText,
  CheckCircle2,
  ChevronLeft,
  CircleUserRound,
  Home,
  MapPin,
  Pause,
  RotateCcw,
  Settings,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { Image } from '@/components/ui/image'
import Dialogue, { SpeedControl } from './Dialogue'
import RepeatGate from './RepeatGate'
import { usePlayback } from './usePlayback'

const BASE = `${(import.meta.env.MIAODA_CLIENT_BASE_PATH || '').replace(/\/$/, '')}/`
const STORAGE_KEY = 'morrow-ch1-fixed-course:v1'

type Page = 'welcome' | 'encounter' | 'home' | 'lesson' | 'growth' | 'echoes' | 'settings' | 'chapterComplete'
type EncounterStep = 'wake' | 'intro' | 'observe' | 'chooseIntent' | 'restore' | 'restoreSentence' | 'complete'
type HomeMode = 'explore' | 'invite' | 'free' | 'quiet' | 'resume'
type LessonStep = 'context' | 'wordWindow' | 'phraseWindow' | 'wordBell' | 'sentence' | 'listenCheck' | 'speak' | 'result' | 'finished'
type SupportMode = 'beginner' | 'basic' | 'independent'
type EchoTab = 'recent' | 'review' | 'familiar'
type RestoredObject = 'lamp' | 'plant' | 'bell' | null
type SceneKey = 'room' | 'window' | 'activity' | 'door'

interface ISavedState {
  onboarded: boolean
  pausedLesson: boolean
  restoredObject: RestoredObject
  explored: boolean
  pendingSpeech: string | null
  completedSpeech: string[]
}

export interface ISpeechRecognitionResultEvent extends Event {
  results: ArrayLike<ArrayLike<{ transcript: string; confidence: number }>>
}

interface ISpeechRecognitionErrorEvent extends Event {
  error: string
}

export interface ISpeechRecognition {
  lang: string
  interimResults: boolean
  continuous: boolean
  maxAlternatives: number
  onstart: (() => void) | null
  onresult: ((event: ISpeechRecognitionResultEvent) => void) | null
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type SpeechRecognitionConstructor = new () => ISpeechRecognition

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

const initialSaved: ISavedState = {
  onboarded: false,
  pausedLesson: false,
  restoredObject: null,
  explored: false,
  pendingSpeech: null,
  completedSpeech: [],
}

const sceneMeta: Record<SceneKey, { name: string; detail: string }> = {
  room: { name: 'Morrow 的房间', detail: '相遇、感受与共同记忆' },
  window: { name: '窗边观察区', detail: '光线、声音与方位' },
  activity: { name: '房间功能角落', detail: '物品、信件与共同任务' },
  door: { name: '门口与外面的小路', detail: '方向、计划与阶段过渡' },
}

const encounterCopy: Record<EncounterStep, [string, string]> = {
  wake: ['Hello? I can hear someone beyond the room.', '你好？我能听见房间外有人。'],
  intro: ["I'm Morrow. What should we do first?", '我是 Morrow。我们先做什么？'],
  observe: ['I hear a soft sound by the window.', '我听见窗边有一个轻轻的声音。'],
  chooseIntent: ['You want to help me understand this room.', '你想帮我弄清这个房间。'],
  restore: ['The room remembers three things.', '房间记得三样东西。'],
  restoreSentence: ['Which one should we bring back first?', '我们应该先让哪一件回来？'],
  complete: ['The room is a little clearer now.', '房间现在清楚了一点。'],
}

const objectMeta = {
  lamp: { name: '窗边的灯', sentence: "Let's bring back the lamp.", chinese: '让我们把灯带回来。', keywords: ['bring', 'lamp'], result: 'The lamp is steady now.' },
  plant: { name: '门边的植物', sentence: 'I choose the plant.', chinese: '我选择植物。', keywords: ['choose', 'plant'], result: 'The plant looks less lost now.' },
  bell: { name: '小铃铛', sentence: "Let's bring back the small bell.", chinese: '让我们把小铃铛带回来。', keywords: ['bring', 'bell'], result: 'The bell makes one low note.' },
}

function readSaved(): ISavedState {
  try {
    return { ...initialSaved, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } as ISavedState
  } catch {
    return initialSaved
  }
}

function saveState(value: ISavedState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)) } catch { /* 原型仍可继续 */ }
}


export default function HomePage() {
  const [saved, setSaved] = useState<ISavedState>(readSaved)
  const [page, setPage] = useState<Page>(saved.pendingSpeech || saved.onboarded ? 'home' : 'welcome')
  const [encounterStep, setEncounterStep] = useState<EncounterStep>('wake')
  const [homeMode, setHomeMode] = useState<HomeMode>(saved.pausedLesson || saved.pendingSpeech ? 'resume' : 'invite')
  const [lessonStep, setLessonStep] = useState<LessonStep>('context')
  const [supportMode, setSupportMode] = useState<SupportMode>('beginner')
  const [echoTab, setEchoTab] = useState<EchoTab>('recent')
  const [selectedObject, setSelectedObject] = useState<RestoredObject>(null)
  const [translation, setTranslation] = useState(false)
  const [muted, setMuted] = useState(false)
  const [notice, setNotice] = useState('')
  const [voiceBusy, setVoiceBusy] = useState(false)
  const playback = usePlayback(setNotice)
  const stopPlayback = playback.stop
  useEffect(() => { stopPlayback() }, [page, encounterStep, lessonStep, muted, stopPlayback])
  function handleVoiceBusy(value: boolean) {
    if (value) playback.stop()
    setVoiceBusy(value)
  }
  const suppressNativeClickUntilRef = useRef(0)
  const activeButtonPressRef = useRef<{
    button: HTMLButtonElement
    pointerId: number
    cancelled: boolean
  } | null>(null)

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 2600)
    return () => window.clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    if (page !== 'home' || homeMode !== 'explore') return
    const timer = window.setTimeout(() => {
      persist({ explored: true })
      setHomeMode('free')
    }, 2600)
    return () => window.clearTimeout(timer)
  }, [page, homeMode])

  function persist(patch: Partial<ISavedState>) {
    setSaved(current => {
      const next = { ...current, ...patch }
      saveState(next)
      return next
    })
  }

  function goHome(mode: HomeMode = 'free') {
    setPage('home')
    setHomeMode(mode)
    setTranslation(false)
  }

  function startLesson() {
    setPage('lesson')
    const pendingSteps: Record<string, LessonStep> = {
      'word-window': 'wordWindow', 'phrase-window': 'phraseWindow',
      'word-bell': 'wordBell', 'lesson-sentence': 'speak',
    }
    setLessonStep(saved.pendingSpeech && pendingSteps[saved.pendingSpeech]
      ? pendingSteps[saved.pendingSpeech] : saved.pausedLesson ? lessonStep : 'context')
    setTranslation(false)
  }

  function resumePending() {
    if (saved.pendingSpeech?.startsWith('restore-')) {
      const object = saved.pendingSpeech.replace('restore-', '') as Exclude<RestoredObject, null>
      setSelectedObject(object)
      setEncounterStep('restoreSentence')
      setPage('encounter')
      setTranslation(false)
      return
    }
    startLesson()
  }

  function chooseObject(object: Exclude<RestoredObject, null>) {
    setSelectedObject(object)
    setEncounterStep('restoreSentence')
  }

  function completeSpeech(id: string) {
    persist({
      pendingSpeech: null,
      completedSpeech: saved.completedSpeech.includes(id) ? saved.completedSpeech : [...saved.completedSpeech, id],
    })
  }

  function postponeSpeech(id: string) {
    persist({ pendingSpeech: id, pausedLesson: page === 'lesson' })
    goHome('resume')
  }

  function replay(text: string) {
    playback.replay(text, muted, voiceBusy)
  }

  function openEncounter() {
    setEncounterStep('wake')
    setPage('encounter')
  }

  function resetPrototype() {
    saveState(initialSaved)
    setSaved(initialSaved)
    setPage('welcome')
    setEncounterStep('wake')
    setHomeMode('invite')
    setLessonStep('context')
    setSelectedObject(null)
    setEchoTab('recent')
  }

  function finishButtonPress(pointerId: number, shouldActivate: boolean) {
    const press = activeButtonPressRef.current
    if (!press || press.pointerId !== pointerId) return
    activeButtonPressRef.current = null
    press.button.classList.remove('is-pressing')
    try {
      if (press.button.hasPointerCapture(pointerId)) press.button.releasePointerCapture(pointerId)
    } catch { /* 元素被页面切换移除时无需处理 */ }
    suppressNativeClickUntilRef.current = performance.now() + 500
    if (shouldActivate && !press.cancelled && press.button.isConnected && !press.button.disabled) {
      press.button.click()
    }
  }

  function handleButtonPointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (event.button !== 0 || activeButtonPressRef.current) return
    const target = event.target as Element
    const button = target.closest('button') as HTMLButtonElement | null
    if (!button || button.disabled || button.dataset.voiceControl === 'true') return
    event.preventDefault()
    activeButtonPressRef.current = { button, pointerId: event.pointerId, cancelled: false }
    button.classList.add('is-pressing')
    try { button.setPointerCapture(event.pointerId) } catch { /* 不支持捕获时仍由上层接收事件 */ }
  }

  function handleButtonPointerMove(event: ReactPointerEvent<HTMLElement>) {
    const press = activeButtonPressRef.current
    if (!press || press.pointerId !== event.pointerId || press.cancelled) return
    const rect = press.button.getBoundingClientRect()
    const isInside = event.clientX >= rect.left && event.clientX <= rect.right
      && event.clientY >= rect.top && event.clientY <= rect.bottom
    if (!isInside) {
      press.cancelled = true
      press.button.classList.remove('is-pressing')
    }
  }

  function handleButtonPointerUp(event: ReactPointerEvent<HTMLElement>) {
    const press = activeButtonPressRef.current
    if (!press || press.pointerId !== event.pointerId) return
    const rect = press.button.getBoundingClientRect()
    const isInside = event.clientX >= rect.left && event.clientX <= rect.right
      && event.clientY >= rect.top && event.clientY <= rect.bottom
    finishButtonPress(event.pointerId, isInside)
  }

  function handleButtonPointerCancel(event: ReactPointerEvent<HTMLElement>) {
    finishButtonPress(event.pointerId, false)
  }

  function handleButtonClickCapture(event: ReactMouseEvent<HTMLElement>) {
    if ((event.target as Element).closest('[data-voice-control]')) return
    if (event.detail === 0 || performance.now() > suppressNativeClickUntilRef.current) return
    event.preventDefault()
    event.stopPropagation()
  }

  const encounterDialogue: [string, string] = encounterStep === 'restoreSentence' && selectedObject
    ? [objectMeta[selectedObject].sentence, objectMeta[selectedObject].chinese]
    : encounterCopy[encounterStep]
  const room = `${BASE}assets/morrow-room.png`
  const scene = page === 'lesson'
    ? 'window'
    : page === 'encounter' && (encounterStep === 'restore' || encounterStep === 'restoreSentence')
      ? 'activity'
      : page === 'chapterComplete'
        ? 'door'
        : 'room'
  const lessonCopy: [string, string] = lessonStep === 'context'
    ? ['The curtain moved a little.', '窗帘轻轻动了一下。']
    : lessonStep === 'wordWindow'
      ? ['Window.', '窗户。']
      : lessonStep === 'phraseWindow'
        ? ['By the window.', '在窗边。']
        : lessonStep === 'wordBell'
          ? ['Bell.', '铃铛。']
          : lessonStep === 'sentence'
            ? ['I hear a bell by the window.', '我听见窗边有铃铛声。']
            : lessonStep === 'listenCheck'
              ? ['Where is the bell?', '铃铛在哪里？']
              : lessonStep === 'speak'
                ? ['I hear a bell by the window.', '我听见窗边有铃铛声。']
                : ['The sound is clear now.', '声音现在清楚了。']

  return <main
    className="prototype-shell"
    onPointerDownCapture={handleButtonPointerDown}
    onPointerMoveCapture={handleButtonPointerMove}
    onPointerUpCapture={handleButtonPointerUp}
    onPointerCancelCapture={handleButtonPointerCancel}
    onClickCapture={handleButtonClickCapture}
  ><section className={`phone scene-${scene}`} aria-label="Morrow 全产品可点击原型（第一章样板内容）">
    <Image src={room} loading="eager" decoding="sync" alt="Morrow 当前所在的生活场景" className="room-image"/>
    <div className="scene-treatment"/>
    <div className="shade"/>
    {(page === 'encounter' || page === 'home' || page === 'lesson') && <div className="scene-label"><MapPin/><span>{sceneMeta[scene].name}</span></div>}

    {page === 'welcome' && <div className="welcome panel-page">
      <button className="welcome-sound" aria-label={muted ? '打开声音' : '关闭声音'} onClick={() => setMuted(value => !value)}>{muted ? <VolumeX/> : <Volume2/>}</button>
      <button className="prototype-demo-trigger" onClick={() => setPage('chapterComplete')}>原型演示：第一章完成</button>
      <div className="breath-light"/>
      <div className="welcome-content"><p>欢迎来到 Morrow 的成长世界</p><h1>幼年期 · 第一章「出生与苏醒」</h1><button className="welcome-start" onClick={openEncounter}>去看看是谁</button></div>
    </div>}

    {page === 'encounter' && <div className="panel-page encounter-page">
      <div className="top-status">幼年期 · 第一次相遇</div>
      <Dialogue rate={playback.rate} onRate={playback.changeRate} busy={voiceBusy} english={encounterDialogue[0]} chinese={encounterDialogue[1]} showChinese={translation} onTranslation={() => setTranslation(value => !value)} onReplay={() => replay(encounterDialogue[0])}/>
      <div className="bottom-stack encounter-actions">
        {encounterStep === 'wake' && <button className="primary" onClick={() => setEncounterStep('intro')}>继续听</button>}
        {encounterStep === 'intro' && <button className="primary" onClick={() => setEncounterStep('observe')}>看看 Morrow 在听哪里</button>}
        {encounterStep === 'observe' && <><p className="hint">选一个动作回应</p><div className="touch-choices"><button onClick={() => { setNotice('Morrow 的耳朵转向窗边。'); setEncounterStep('chooseIntent') }}>摸摸耳朵</button><button onClick={() => { setNotice('窗帘轻轻动了一下。'); setEncounterStep('chooseIntent') }}>看看窗边</button><button onClick={() => { setNotice('铃铛只响了半声。'); setEncounterStep('chooseIntent') }}>轻碰铃铛</button></div></>}
        {encounterStep === 'chooseIntent' && <><p className="hint">选择你现在想做的事。按钮只负责操作，英文会在下一步单独学习。</p><div className="intent-list"><div className="intent-option"><div className="intent-english"><small>英文学习内容</small><b>Let me help you.</b><span>让我帮你。</span></div><button onClick={() => setEncounterStep('restore')}>主动帮助 Morrow</button></div><div className="intent-option"><div className="intent-english"><small>英文学习内容</small><b>Are you all right?</b><span>你还好吗？</span></div><button onClick={() => setEncounterStep('restore')}>先关心 Morrow</button></div></div></>}
        {encounterStep === 'restore' && <><p className="hint">选择一件先恢复的物品。</p><div className="object-choices"><button onClick={() => chooseObject('lamp')}>选择灯</button><button onClick={() => chooseObject('plant')}>选择植物</button><button onClick={() => chooseObject('bell')}>选择小铃铛</button></div></>}
        {encounterStep === 'restoreSentence' && selectedObject && <RepeatGate key={`restore-${selectedObject}`} onBusyChange={handleVoiceBusy} id={`restore-${selectedObject}`} target={objectMeta[selectedObject].sentence} onPassed={() => { completeSpeech(`restore-${selectedObject}`); setEncounterStep('complete') }} onPostpone={() => postponeSpeech(`restore-${selectedObject}`)}/>}
        {encounterStep === 'complete' && selectedObject && <div className="confirm-card"><b>{objectMeta[selectedObject].result}</b><span>你的英语让房间发生了变化。</span><button className="primary" onClick={() => { persist({ onboarded: true, restoredObject: selectedObject }); goHome(saved.explored ? 'free' : 'explore') }}>回到房间</button></div>}
      </div>
    </div>}

    {page === 'home' && <div className="panel-page home-page">
      <div className="header-row"><span className="status-pill">幼年期 · 第一章</span><button className="icon-button" aria-label="设置" onClick={() => setPage('settings')}><Settings/></button></div>
      <button className="morrow-hotspot" aria-label="摸摸 Morrow" onClick={() => { persist({ explored: true }); setHomeMode('free'); setNotice('Morrow 闭了闭眼，尾巴的光暖了一点。') }}/>
      {homeMode === 'invite' && <><Dialogue english="I hear something near the window." chinese="我听见窗边有一点声音。" showChinese={translation} onTranslation={() => setTranslation(v => !v)} onReplay={() => replay('I hear something near the window.')} rate={playback.rate} onRate={playback.changeRate} busy={voiceBusy}/><div className="home-actions"><button className="primary" onClick={startLesson}>和 Morrow 去窗边</button><button className="secondary" onClick={() => setHomeMode('free')}>稍后再说</button></div></>}
      {homeMode === 'explore' && <div className="explore-tip" role="status">可以点点 Morrow 或房间里的东西试试看。</div>}
      {homeMode === 'free' && <div className="home-actions"><button className="primary" onClick={resumePending}>{saved.pendingSpeech ? '继续待完成的跟读' : '进入下一段生活事件'}</button><button className="text-button" onClick={() => setHomeMode('quiet')}>安静待一会</button></div>}
      {homeMode === 'quiet' && <div className="quiet-card"><p>We can stay quiet.</p><span>我们可以安静待着。这里没有要完成的任务。</span><button className="secondary" onClick={() => setHomeMode('free')}>想继续时再回来</button></div>}
      {homeMode === 'resume' && <div className="resume-card"><b>{saved.pendingSpeech ? '有一段跟读还没完成' : '上次停在窗边'}</b><span>{saved.pendingSpeech ? '不会算失败，也不会假装已经学会。准备好时再继续。' : 'Morrow 会从上次确认的步骤继续。'}</span><button className="primary" onClick={resumePending}>继续刚才</button><button className="secondary" onClick={() => setHomeMode('free')}>暂时留在房间</button></div>}
      <BottomNav page={page} onChange={setPage}/>
    </div>}

    {page === 'lesson' && <div className="panel-page scene-page">
      <div className="header-row"><span className="status-pill">窗边声音 · 生活事件</span><button className="pause-button" onClick={() => { persist({ pausedLesson: true }); goHome('resume') }}><Pause/>暂停</button></div>
      <div className="learning-stage">{supportMode === 'beginner' ? '启蒙支持' : supportMode === 'basic' ? '基础支持' : '自主练习'}</div>
      <Dialogue rate={playback.rate} onRate={playback.changeRate} busy={voiceBusy} english={lessonCopy[0]} chinese={lessonCopy[1]} showChinese={translation} onTranslation={() => setTranslation(value => !value)} onReplay={() => replay(lessonCopy[0])} scene/>
      {lessonStep === 'context' && <div className="scene-actions"><p className="hint">先看画面，不需要说英语：窗帘动了，Morrow 的耳朵转向窗边。</p><button className="primary" onClick={() => setLessonStep('wordWindow')}>点一下窗户</button><button className="text-button" onClick={() => goHome('quiet')}>先安静待一会</button></div>}
      {lessonStep === 'wordWindow' && <div className="scene-actions"><RepeatGate key="word-window" onBusyChange={handleVoiceBusy} id="word-window" target="window" onPassed={() => { completeSpeech('word-window'); setLessonStep('phraseWindow') }} onPostpone={() => postponeSpeech('word-window')}/></div>}
      {lessonStep === 'phraseWindow' && <div className="scene-actions"><RepeatGate key="phrase-window" onBusyChange={handleVoiceBusy} id="phrase-window" target="by the window" onPassed={() => { completeSpeech('phrase-window'); setLessonStep('wordBell') }} onPostpone={() => postponeSpeech('phrase-window')}/></div>}
      {lessonStep === 'wordBell' && <div className="scene-actions"><RepeatGate key="word-bell" onBusyChange={handleVoiceBusy} id="word-bell" target="bell" onPassed={() => { completeSpeech('word-bell'); setLessonStep('sentence') }} onPostpone={() => postponeSpeech('word-bell')}/></div>}
      {lessonStep === 'sentence' && <div className="scene-actions"><div className="sentence-builder learning-content-card"><span>I hear a</span><b>bell</b><span>by the window.</span><small>我听见窗边有铃铛声。</small></div><button className="primary" onClick={() => setLessonStep('listenCheck')}>进入听力确认</button></div>}
      {lessonStep === 'listenCheck' && <div className="scene-actions"><p className="hint">根据刚才的画面，铃铛在哪里？</p><div className="location-choices"><button onClick={() => setNotice('再看一眼 Morrow 耳朵的方向。')}>选择房间中央</button><button className="correct" onClick={() => setLessonStep('speak')}>选择窗边</button></div></div>}
      {lessonStep === 'speak' && <div className="scene-actions"><RepeatGate key="lesson-sentence" onBusyChange={handleVoiceBusy} id="lesson-sentence" target="I hear a bell by the window." onPassed={() => { completeSpeech('lesson-sentence'); persist({ pausedLesson: false }); setLessonStep('result') }} onPostpone={() => postponeSpeech('lesson-sentence')}/></div>}
      {lessonStep === 'result' && <div className="result-card"><Sparkles/><b>铃铛发出一声清楚的低鸣。</b><span>系统听清了你的表达，Morrow 走近了窗边。</span><button className="primary" onClick={() => setLessonStep('finished')}>看看这次经历</button></div>}
      {lessonStep === 'finished' && <div className="finish-sheet"><b>本次生活事件完成</b><span>你在窗边真正说出了这句话。</span><blockquote>I hear a bell by the window.</blockquote><small>本次记录：场景理解、window、by the window、bell 和完整句跟读。</small><button className="primary" onClick={() => goHome('free')}>回到房间</button><button className="secondary" onClick={() => setPage('chapterComplete')}>预览章节完成界面</button><button className="text-button" onClick={() => setPage('echoes')}>查看刚遇见的表达</button></div>}
    </div>}

    {page === 'chapterComplete' && <div className="list-page chapter-complete-page"><div className="prototype-demo-banner"><b>仅原型演示</b><span>用于预览章节完成后的界面，不会修改当前章节进度。</span></div><div className="chapter-hero"><span>第一章完成界面</span><h1>第一章 · 出生与苏醒</h1><p>完成章节后，Morrow 仍处于幼年期，不会错误播放跨阶段短片。</p></div><article><CheckCircle2/><div><b>本章发生的成长</b><span>会辨认声音、记住称呼，房间恢复了第一件物品。</span></div></article><article><Sparkles/><div><b>当前人生阶段：幼年期</b><span>完成第二章“童年探索”后，才会播放进入学龄期的阶段揭幕短片。</span></div></article><article><MapPin/><div><b>下一章：童年探索</b><span>新的事件将继续发生在房间、窗边、功能角落和门外小路。</span></div></article><button className="primary chapter-continue" onClick={() => setPage('growth')}>返回成长页</button></div>}

    {page === 'growth' && <div className="list-page growth-page"><div className="stage-summary"><small>当前人生阶段</small><h1>幼年期</h1><p>第一章 · 出生与苏醒</p><div className="stage-track"><span className="done">出生与苏醒</span><span>童年探索</span><span>进入学龄期</span></div></div><h2>已经发生的成长</h2>{saved.restoredObject ? <><article><Sparkles/><div><b>Morrow 第一次走近了窗边</b><span>现在会朝声音的方向转动耳朵。</span></div></article><article><Home/><div><b>{objectMeta[saved.restoredObject].name}回到了房间</b><span>这是你们共同留下的第一处变化。</span></div></article></> : <p className="empty-state">还没有成长变化。先回到房间陪陪 Morrow。</p>}<div className="next-stage-note"><b>下一方向</b><span>门外的声音正在变得清楚，但不会提前展示尚未经历的事件。</span></div><div className="prototype-preview-entry"><span>原型演示入口，不改变当前进度</span><button className="secondary growth-settlement" onClick={() => setPage('chapterComplete')}>预览第一章完成界面</button></div><BottomNav page={page} onChange={setPage}/></div>}

    {page === 'echoes' && <div className="list-page"><h1>词语回声</h1><p>这里只出现 Morrow 已经带你遇见的表达。</p><div className="tabs"><button className={echoTab === 'recent' ? 'active' : ''} onClick={() => setEchoTab('recent')}>最近遇见</button><button className={echoTab === 'review' ? 'active' : ''} onClick={() => setEchoTab('review')}>还想再用</button><button className={echoTab === 'familiar' ? 'active' : ''} onClick={() => setEchoTab('familiar')}>已经很熟</button></div>{!saved.onboarded ? <p className="empty-state">还没有遇见可以回看的词语。</p> : echoTab === 'recent' ? <><article><Volume2/><div><b>window</b><span>窗户 · 已在窗边事件中跟读</span></div></article><article><Volume2/><div><b>by the window</b><span>在窗边 · 已在地点表达中跟读</span></div></article></> : <p className="empty-state">这里还没有表达。以后遇见更多内容时会自动归入。</p>}<BottomNav page={page} onChange={setPage}/></div>}

    {page === 'settings' && <div className="list-page settings-page"><button className="back-button" onClick={() => goHome('free')} aria-label="返回"><ChevronLeft/></button><h1>设置与隐私</h1><h2>学习支持</h2><div className="mode-picker"><button className={supportMode === 'beginner' ? 'active' : ''} onClick={() => setSupportMode('beginner')}><b>启蒙支持</b><span>中文解释更多，从画面和单词开始</span></button><button className={supportMode === 'basic' ? 'active' : ''} onClick={() => setSupportMode('basic')}><b>基础支持</b><span>从短语和完整句开始</span></button><button className={supportMode === 'independent' ? 'active' : ''} onClick={() => setSupportMode('independent')}><b>自主练习</b><span>更少提示，但必修跟读不跳过</span></button></div><p className="privacy-copy">Morrow 按人生阶段、章节与学习证据安排内容。难度只改变提示量，不改变必须完成的跟读。</p><h2>体验设置</h2><button className="setting-row" onClick={() => setMuted(value => !value)}><span>{muted ? <VolumeX/> : <Volume2/>}声音</span><b>{muted ? '已关闭' : '已开启'}</b></button><div className="setting-row"><span>播放倍速</span><SpeedControl rate={playback.rate} onRate={playback.changeRate} disabled={voiceBusy}/></div><h2>记忆与数据</h2><p className="privacy-copy">只记录课程步骤、用户确认的选择、跟读完成状态和已发生的世界变化；原始录音不长期保存。</p><button className="setting-row" onClick={resetPrototype}><span><RotateCcw/>重新体验产品原型</span><b>清空本地进度</b></button></div>}

    {notice && <div className="toast" role="status" aria-live="polite">{notice}</div>}
  </section></main>
}

function BottomNav({ page, onChange }: { page: Page; onChange: (page: Page) => void }) {
  return <nav className="bottom-nav" aria-label="主导航"><button className={page === 'home' ? 'active' : ''} onClick={() => onChange('home')}><CircleUserRound/>陪伴</button><button className={page === 'growth' ? 'active' : ''} onClick={() => onChange('growth')}><Sparkles/>成长</button><button className={page === 'echoes' ? 'active' : ''} onClick={() => onChange('echoes')}><BookOpenText/>词语回声</button></nav>
}
