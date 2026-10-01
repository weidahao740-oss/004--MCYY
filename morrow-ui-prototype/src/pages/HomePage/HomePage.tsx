import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react'
import {
  BookOpenText,
  CheckCircle2,
  ChevronLeft,
  CircleUserRound,
  Home,
  MapPin,
  RotateCcw,
  Settings,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { Image } from '@/components/ui/image'
import Dialogue, { SpeedControl } from './Dialogue'
import TeachingGate from './TeachingGate'
import { clearTeachingProgress, getTeachingEchoes } from './teachingEvidence'
import { restoreCourse, windowCourse, type SupportMode } from './teachingContent'
import { usePlayback } from './usePlayback'

const BASE = `${(import.meta.env.MIAODA_CLIENT_BASE_PATH || '').replace(/\/$/, '')}/`
const STORAGE_KEY = 'morrow-ch1-fixed-course:v1'

type Page = 'welcome' | 'chapterOpening' | 'encounter' | 'home' | 'lesson' | 'growth' | 'echoes' | 'settings' | 'chapterComplete'
type EncounterStep = 'wake' | 'intro' | 'observe' | 'restore' | 'restoreSentence' | 'complete'
type HomeMode = 'explore' | 'invite' | 'free' | 'quiet' | 'resume'
type LessonStep = 'context' | 'teaching' | 'result' | 'finished'
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
  wake: ['Hello? Is someone there?', '你好？那里有人吗？'],
  intro: ["I'm Morrow. This room still feels a little strange.", '我叫 Morrow。这个房间对我来说还有点陌生。'],
  observe: ['I hear something near the window.', '窗边好像有一点声音。'],
  restore: ['I can make one thing clear again.', '我好像能先让一样东西重新变清楚。'],
  restoreSentence: ['Which one should we choose?', '我们选哪一个？'],
  complete: ['The bell is clear now. I can hear it.', '小铃铛变清楚了，我听见它了。'],
}

const encounterGuide: Record<EncounterStep, string> = {
  wake: '我刚刚醒来，还看不清房间。你可以先陪我听听这里的声音。',
  intro: '我还看不太清这里。你愿意陪我看看吗？可以先点点我，或者看看窗边。',
  observe: '嗯，就是那边。你也听听看。',
  restore: '看看灯、植物和小铃铛，选一个你想先找回来的。',
  restoreSentence: '按住麦克风，跟我说出这句话。说完松开，我会认真听。',
  complete: '我听见了。小铃铛真的回到房间了，我们回去看看吧。',
}

const lessonDialogue: Record<LessonStep, [string, string]> = {
  context: ['The curtain moved a little.', '窗帘轻轻动了一下。'],
  teaching: ['I hear a bell by the window.', '我听见窗边有铃铛声。'],
  result: ['The sound is clear now.', '声音现在清楚了。'],
  finished: ['We found the sound together.', '我们一起找到了这个声音。'],
}

const lessonGuide: Record<LessonStep, string> = {
  context: '我听见窗边有一点声音。你先点一下窗户，我们从那里开始。',
  teaching: '先理解意思，再一小段一小段听读。',
  result: '我听见了。小铃铛的声音现在很清楚，我们一起走近了一点。',
  finished: '这件小事完成了。我们回房间吧。',
}

const objectMeta = {
  lamp: { name: '窗边的灯', word: 'lamp', wordChinese: '灯', phrase: 'the lamp', phraseChinese: '这盏灯', sentence: "Let's bring back the lamp.", chinese: '我们先把灯找回来。', result: 'The lamp is steady now.', resultChinese: '灯变清楚了，现在稳稳地亮着。', resultGuide: '我听见了。它真的回到房间了，我们回去看看吧。' },
  plant: { name: '门边的植物', word: 'plant', wordChinese: '植物', phrase: 'the plant', phraseChinese: '这株植物', sentence: "Let's bring back the plant.", chinese: '我们先把植物找回来。', result: 'The plant is clear now.', resultChinese: '植物变清楚了，它真的回来了。', resultGuide: '我听见了。它真的回到房间了，我们回去看看吧。' },
  bell: { name: '小铃铛', word: 'bell', wordChinese: '铃铛', phrase: 'small bell', phraseChinese: '小铃铛', sentence: "Let's bring back the small bell.", chinese: '我们先把小铃铛找回来。', result: 'The bell is clear now. I can hear it.', resultChinese: '小铃铛变清楚了，我听见它了。', resultGuide: '我听见了。小铃铛真的回到房间了，我们回去看看吧。' },
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
  const [supportMode, updateSupportMode] = useState<SupportMode>(() => {
    try { const value = localStorage.getItem('morrow:teaching-support'); return value === 'basic' || value === 'independent' ? value : 'beginner' } catch { return 'beginner' }
  })
  function setSupportMode(mode: SupportMode) {
    updateSupportMode(mode)
    try { localStorage.setItem('morrow:teaching-support', mode) } catch { /* 当前会话继续使用所选档位 */ }
  }
  const [echoTab, setEchoTab] = useState<EchoTab>('recent')
  const [selectedObject, setSelectedObject] = useState<RestoredObject>(null)
  const [speechPreview, setSpeechPreview] = useState(false)
  const [openingProgress, setOpeningProgress] = useState(0)
  const [translation, setTranslation] = useState(false)
  const [muted, setMuted] = useState(false)
  const [notice, setNotice] = useState('')
  const [introCaption, setIntroCaption] = useState('')
  const [explorationPromptDismissed, setExplorationPromptDismissed] = useState(false)
  const voiceBusy = false
  const playback = usePlayback(setNotice)
  const stopPlayback = playback.stop
  const playSequence = playback.playSequence
  const playIntroduction = playback.playIntroduction
  const autoPlayedRef = useRef(new Set<string>())
  const lessonAutoPlayedRef = useRef(new Set<string>())
  const hasUserActivatedAudioRef = useRef(false)
  const preserveStartedPlaybackRef = useRef(false)
  useEffect(() => {
    if (preserveStartedPlaybackRef.current) {
      preserveStartedPlaybackRef.current = false
      return
    }
    stopPlayback()
  }, [page, encounterStep, lessonStep, muted, stopPlayback])
  useEffect(() => {
    if (page !== 'encounter' || muted || voiceBusy || !hasUserActivatedAudioRef.current) return
    if (encounterStep === 'restoreSentence' || encounterStep === 'complete') return
    const playbackKey = `${encounterStep}:${selectedObject || 'none'}`
    if (autoPlayedRef.current.has(playbackKey)) return
    autoPlayedRef.current.add(playbackKey)
    const timer = window.setTimeout(() => {
      playSequence(encounterCopy[encounterStep][0], encounterGuide[encounterStep], muted, voiceBusy)
    }, 180)
    return () => window.clearTimeout(timer)
  }, [page, encounterStep, selectedObject, muted, voiceBusy, playSequence])
  useEffect(() => {
    if (page !== 'encounter' || encounterStep !== 'complete' || !selectedObject || muted || voiceBusy || !hasUserActivatedAudioRef.current) return
    const playbackKey = `complete:${selectedObject}`
    if (autoPlayedRef.current.has(playbackKey)) return
    const target = objectMeta[selectedObject]
    const timer = window.setTimeout(() => {
      // 真正开始播放时才标记，避免 effect 清理定时器后误判已经播过。
      autoPlayedRef.current.add(playbackKey)
      playSequence(target.result, target.resultGuide, muted, voiceBusy)
    }, 180)
    return () => window.clearTimeout(timer)
  }, [page, encounterStep, selectedObject, muted, voiceBusy, playSequence])

  useEffect(() => {
    if (page !== 'lesson' || muted || voiceBusy || !hasUserActivatedAudioRef.current) return
    if (lessonStep === 'teaching') return
    if (lessonAutoPlayedRef.current.has(lessonStep)) return
    lessonAutoPlayedRef.current.add(lessonStep)
    const timer = window.setTimeout(() => playSequence(lessonDialogue[lessonStep][0], lessonStep === 'context' ? lessonGuide.context : null, muted, voiceBusy), 180)
    return () => window.clearTimeout(timer)
  }, [page, lessonStep, muted, voiceBusy, playSequence])
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
    if (page !== 'home' || homeMode !== 'explore' || explorationPromptDismissed) return
    playSequence(null, '房间已经清楚一些了。你可以点点我，或者看看周围有什么变化。', muted, false)
    const timer = window.setTimeout(() => setExplorationPromptDismissed(true), 5200)
    return () => window.clearTimeout(timer)
  }, [page, homeMode, muted, playSequence, explorationPromptDismissed])

  function persist(patch: Partial<ISavedState>) {
    setSaved(current => {
      const next = { ...current, ...patch }
      saveState(next)
      return next
    })
  }

  function goHome(mode: HomeMode = 'free') {
    if (mode === 'explore') setExplorationPromptDismissed(false)
    setPage('home')
    setHomeMode(mode)
    setTranslation(false)
  }

  function startLesson() {
    hasUserActivatedAudioRef.current = true
    lessonAutoPlayedRef.current.clear()
    setPage('lesson')
    const targetStep: LessonStep = saved.pendingSpeech ? 'teaching' : saved.pausedLesson ? lessonStep : 'context'
    setSpeechPreview(false)
    setLessonStep(targetStep)
    if (targetStep !== 'teaching') window.setTimeout(() => playSequence(lessonDialogue[targetStep][0], lessonGuide[targetStep], muted, false), 180)
    lessonAutoPlayedRef.current.add(targetStep)
    setTranslation(false)
  }

  function enterLessonStep(step: LessonStep) {
    if (step === 'teaching') persist({ pendingSpeech: 'window-teaching', pausedLesson: true })
    setLessonStep(step)
    setTranslation(false)
    if (step !== 'teaching') {
      window.setTimeout(() => playSequence(lessonDialogue[step][0], lessonGuide[step], muted, false), 180)
      lessonAutoPlayedRef.current.add(step)
    }
  }

  function resumePending() {
    hasUserActivatedAudioRef.current = true
    if (saved.pendingSpeech?.startsWith('restore-')) {
      const candidate = saved.pendingSpeech.split('-')[1]
      const object = candidate === 'lamp' || candidate === 'plant' ? candidate : 'bell'
      setSelectedObject(object)
      autoPlayedRef.current.delete(`complete:${object}`)
      setEncounterStep('restoreSentence')
      setPage('encounter')
      setTranslation(false)
      return
    }
    startLesson()
  }

  function beginExploration(source: 'morrow' | 'window') {
    setNotice(source === 'morrow' ? 'Morrow 轻轻抬起耳朵，朝窗边看去。' : '窗帘动了一下，那里传来很轻的声音。')
    setEncounterStep('observe')
  }

  function respondToObservation(target: 'ear' | 'window' | 'bell') {
    const messages = {
      ear: 'Morrow 的耳朵转向窗边。',
      window: '窗帘轻轻动了一下。',
      bell: '铃铛只响了半声。',
    }
    setNotice(messages[target])
    setEncounterStep('restore')
  }

  function chooseObject(object: Exclude<RestoredObject, null>) {
    hasUserActivatedAudioRef.current = true
    autoPlayedRef.current.delete(`complete:${object}`)
    stopPlayback()
    setSelectedObject(object)
    setSpeechPreview(false)
    setEncounterStep('restoreSentence')
    persist({ pendingSpeech: `restore-${object}` })
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
    hasUserActivatedAudioRef.current = true
    stopPlayback()
    setPage('chapterOpening')
  }

  const beginEncounter = useCallback(() => {
    preserveStartedPlaybackRef.current = true
    autoPlayedRef.current.clear()
    autoPlayedRef.current.add('wake:none')
    setIntroCaption('我好像听见你了。先听听我想说什么吧。')
    playIntroduction(
      '我好像听见你了。先听听我想说什么吧。',
      encounterCopy.wake[0],
      encounterGuide.wake,
      muted,
      () => setIntroCaption(''),
      () => setIntroCaption(encounterGuide.wake),
      () => setIntroCaption(''),
    )
    setEncounterStep('wake')
    setPage('encounter')
  }, [muted, playIntroduction])

  useEffect(() => {
    if (page !== 'chapterOpening') return
    const startedAt = performance.now()
    const tick = window.setInterval(() => {
      setOpeningProgress(Math.min(100, ((performance.now() - startedAt) / 8000) * 100))
    }, 80)
    const finish = window.setTimeout(beginEncounter, 8000)
    return () => {
      window.clearInterval(tick)
      window.clearTimeout(finish)
    }
  }, [page, beginEncounter])

  function resetPrototype() {
    hasUserActivatedAudioRef.current = false
    autoPlayedRef.current.clear()
    saveState(initialSaved)
    setSaved(initialSaved)
    setPage('welcome')
    setEncounterStep('wake')
    setHomeMode('invite')
    setIntroCaption('')
    setExplorationPromptDismissed(false)
    setLessonStep('context')
    setSelectedObject(null)
    clearTeachingProgress()
    setSpeechPreview(false)
    setOpeningProgress(0)
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

  const encounterDialogue = encounterCopy[encounterStep]
  const room = `${BASE}assets/morrow-room.png`
  const scene = page === 'lesson'
    ? 'window'
    : page === 'encounter' && (encounterStep === 'restore' || encounterStep === 'restoreSentence')
      ? 'activity'
      : page === 'chapterComplete'
        ? 'door'
        : 'room'
  const lessonCopy = lessonDialogue[lessonStep]

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

    {page === 'chapterOpening' && <div className="chapter-opening panel-page" aria-label="第一章开场演绎">
      <div className="opening-vignette"/>
      <div className="opening-glow"/>
      <div className="opening-copy"><span>第一章</span><h1>出生与苏醒</h1><p>房间里有一个微弱的声音，刚刚醒来。</p></div>
      <div className="opening-progress" aria-hidden="true"><i style={{ width: `${openingProgress}%` }}/></div>
      <button className="opening-skip" onClick={beginEncounter}>跳过开场</button>
    </div>}

    {page === 'encounter' && <div className="panel-page encounter-page">
      <div className="top-status">幼年期 · 第一次相遇</div>
      {introCaption && <div className="morrow-lead-caption" role="status">{introCaption}</div>}
      {encounterStep !== 'complete' && encounterStep !== 'restoreSentence' && <Dialogue rate={playback.rate} onRate={playback.changeRate} busy={voiceBusy} english={encounterDialogue[0]} chinese={encounterDialogue[1]} showChinese={translation || supportMode === 'beginner'} onTranslation={() => setTranslation(value => !value)} onReplay={() => replay(encounterDialogue[0])}/>}
      {(encounterStep === 'intro' || encounterStep === 'observe') && <>
        <button className="encounter-morrow-hotspot ripple-hotspot" aria-label={encounterStep === 'observe' ? '摸摸耳朵' : '点点 Morrow'} onClick={() => encounterStep === 'observe' ? respondToObservation('ear') : beginExploration('morrow')}/>
        <button className="encounter-window-hotspot ripple-hotspot" aria-label="看看窗边" onClick={() => encounterStep === 'observe' ? respondToObservation('window') : beginExploration('window')}/>
        {encounterStep === 'observe' && <button className="encounter-bell-hotspot ripple-hotspot" aria-label="轻碰铃铛" onClick={() => respondToObservation('bell')}/>} 
      </>}
      {encounterStep === 'restoreSentence' && selectedObject && <TeachingGate key={`restore-${selectedObject}-${supportMode}`} course={restoreCourse(selectedObject)} mode={supportMode} muted={muted} onUnmute={() => setMuted(false)} notify={setNotice} onPostpone={() => postponeSpeech(`restore-${selectedObject}`)} onFinish={real => { setSpeechPreview(!real); if (real) completeSpeech(`teaching-v1:restore-${selectedObject}`); setEncounterStep('complete') }}/>}
      <div className="bottom-stack encounter-actions">
        {encounterStep === 'wake' && <button className="primary" onClick={() => { setIntroCaption(''); setEncounterStep('intro') }}>继续听</button>}
        {encounterStep === 'intro' && <p className="voice-guide">{encounterGuide.intro}</p>}
        {encounterStep === 'observe' && <p className="voice-guide">{encounterGuide.observe}</p>}
        {encounterStep === 'restore' && <><p className="voice-guide">{encounterGuide.restore}</p><div className="object-choices"><button onClick={() => chooseObject('lamp')}>选择灯</button><button onClick={() => chooseObject('plant')}>选择植物</button><button onClick={() => chooseObject('bell')}>选择小铃铛</button></div></>}
        {encounterStep === 'complete' && selectedObject && <div className="confirm-card bilingual-result">{speechPreview && <p className="voice-guide">仅原型结果预览，不结算物品恢复或学习完成。</p>}<p className="result-english">{objectMeta[selectedObject].result}</p><p className="result-translation">{objectMeta[selectedObject].resultChinese}</p><div className="result-divider"/><p className="morrow-guide">{objectMeta[selectedObject].resultGuide}</p><button className="primary" onClick={() => { if (speechPreview) { persist({ pendingSpeech: `restore-${selectedObject}` }); goHome('free') } else { persist({ onboarded: true, restoredObject: selectedObject }); goHome(saved.explored ? 'free' : 'explore') } }}>回到房间</button></div>}
      </div>
    </div>}

    {page === 'home' && <div className="panel-page home-page">
      <div className="header-row"><span className="status-pill">幼年期 · 第一章</span><button className="icon-button" aria-label="设置" onClick={() => setPage('settings')}><Settings/></button></div>
      {(page === 'home' && homeMode !== 'explore') && <button className="morrow-hotspot" aria-label="摸摸 Morrow" onClick={() => { persist({ explored: true }); setHomeMode('free'); setNotice('Morrow 闭了闭眼，尾巴的光暖了一点。') }}/>}
      {homeMode === 'invite' && <><Dialogue english="I hear something near the window." chinese="我听见窗边有一点声音。" showChinese={translation || supportMode === 'beginner'} onTranslation={() => setTranslation(v => !v)} onReplay={() => replay('I hear something near the window.')} rate={playback.rate} onRate={playback.changeRate} busy={voiceBusy}/><div className="home-actions"><button className="primary" onClick={startLesson}>和 Morrow 去窗边</button><button className="secondary" onClick={() => setHomeMode('free')}>稍后再说</button></div></>}
      {homeMode === 'explore' && <>
        {!explorationPromptDismissed && <div className="explore-tip" role="status">房间已经清楚一些了。你可以点点我，或者看看周围有什么变化。</div>}
        <button className="home-morrow-ripple ripple-hotspot" aria-label="点点 Morrow" onClick={() => { persist({ explored: true }); setHomeMode('free'); setNotice('Morrow 闭了闭眼，尾巴的光暖了一点。') }}/>
        <button className="home-room-ripple ripple-hotspot" aria-label="看看房间里的变化" onClick={() => { persist({ explored: true }); setHomeMode('free'); setNotice('小铃铛的轮廓比刚才清楚了。') }}/>
      </>}
      {homeMode === 'free' && <div className="home-actions"><button className="primary" onClick={resumePending}>{saved.pendingSpeech ? '继续待完成的跟读' : '进入下一段生活事件'}</button><button className="text-button" onClick={() => setHomeMode('quiet')}>安静待一会</button></div>}
      {homeMode === 'quiet' && <div className="quiet-card"><p>We can stay quiet.</p><span>我们可以安静待着。这里没有要完成的任务。</span><button className="secondary" onClick={() => setHomeMode('free')}>想继续时再回来</button></div>}
      {homeMode === 'resume' && <div className="resume-card"><b>{saved.pendingSpeech ? '有一段跟读还没完成' : '上次停在窗边'}</b><span>{saved.pendingSpeech ? '不会算失败，也不会假装已经学会。准备好时再继续。' : 'Morrow 会从上次确认的步骤继续。'}</span><button className="primary" onClick={resumePending}>继续刚才</button><button className="secondary" onClick={() => setHomeMode('free')}>暂时留在房间</button></div>}
      <BottomNav page={page} onChange={setPage}/>
    </div>}

    {page === 'lesson' && <div className="panel-page scene-page">
      <div className="header-row"><span className="status-pill">窗边声音 · 生活事件</span></div>
      <div className="learning-stage">{supportMode === 'beginner' ? '启蒙支持' : supportMode === 'basic' ? '基础支持' : '自主练习'}</div>
      {lessonStep === 'context' && <Dialogue rate={playback.rate} onRate={playback.changeRate} busy={voiceBusy} english={lessonCopy[0]} chinese={lessonCopy[1]} showChinese={translation || supportMode === 'beginner'} onTranslation={() => setTranslation(value => !value)} onReplay={() => replay(lessonCopy[0])} scene/>}
      {lessonStep === 'teaching' && <TeachingGate key={`window-${supportMode}`} course={windowCourse} mode={supportMode} muted={muted} onUnmute={() => setMuted(false)} notify={setNotice} onPostpone={() => postponeSpeech('window-teaching')} onFinish={real => { setSpeechPreview(!real); if (real) completeSpeech('teaching-v1:window-sentence'); persist({ pausedLesson: !real, pendingSpeech: real ? null : 'window-teaching' }); setLessonStep('result') }}/>}
      {lessonStep === 'context' && <button className="lesson-window-ripple ripple-hotspot" aria-label="点一下窗户" onClick={() => enterLessonStep('teaching')}/>} 
      {lessonStep === 'context' && <div className="scene-actions"><p className="voice-guide">我听见窗边有一点声音。你先点一下窗户，我们从那里开始。</p><button className="text-button" onClick={() => goHome('quiet')}>先安静待一会</button></div>}
      {lessonStep === 'result' && <div className="result-card bilingual-result">{speechPreview && <p className="voice-guide">仅原型预览：声音变化不作为真实完成。</p>}<p className="result-english">The sound is clear now.</p><p className="result-translation">声音现在清楚了。</p><div className="result-divider"/><p className="morrow-guide">{lessonGuide.result}</p><button className="primary" onClick={() => setLessonStep('finished')}>看看这次经历</button></div>}
      {lessonStep === 'finished' && <div className="finish-sheet"><b>{speechPreview ? '仅原型结果预览' : '本次生活事件完成'}</b><span>{speechPreview ? '仍有跟读待完成，不记录真实学习完成。' : '你在窗边真正说出了这句话。'}</span><blockquote>I hear a bell by the window.</blockquote><small>{speechPreview ? '预览不替代听读与录音证据。' : '已完成本次新成分教学、分块、完整听读与整句跟读；不等于稳定掌握。'}</small><button className="primary" onClick={() => goHome('free')}>回到房间</button><button className="secondary" onClick={() => setPage('chapterComplete')}>预览章节完成界面</button><button className="text-button" onClick={() => setPage('echoes')}>查看刚遇见的表达</button></div>}
    </div>}

    {page === 'chapterComplete' && <div className="list-page chapter-complete-page"><div className="prototype-demo-banner"><b>仅原型演示</b><span>用于预览章节完成后的界面，不会修改当前章节进度。</span></div><div className="chapter-hero"><span>第一章完成界面</span><h1>第一章 · 出生与苏醒</h1><p>完成章节后，Morrow 仍处于幼年期，不会错误播放跨阶段短片。</p></div><article><CheckCircle2/><div><b>本章发生的成长</b><span>会辨认声音、记住称呼，房间恢复了第一件物品。</span></div></article><article><Sparkles/><div><b>当前人生阶段：幼年期</b><span>完成第二章“童年探索”后，才会播放进入学龄期的阶段揭幕短片。</span></div></article><article><MapPin/><div><b>下一章：童年探索</b><span>新的事件将继续发生在房间、窗边、功能角落和门外小路。</span></div></article><button className="primary chapter-continue" onClick={() => setPage('growth')}>返回成长页</button></div>}

    {page === 'growth' && <div className="list-page growth-page"><div className="stage-summary"><small>当前人生阶段</small><h1>幼年期</h1><p>第一章 · 出生与苏醒</p><div className="stage-track"><span className="done">出生与苏醒</span><span>童年探索</span><span>进入学龄期</span></div></div><h2>已经发生的成长</h2>{saved.restoredObject ? <><article><Sparkles/><div><b>Morrow 第一次走近了窗边</b><span>现在会朝声音的方向转动耳朵。</span></div></article><article><Home/><div><b>{objectMeta[saved.restoredObject].name}回到了房间</b><span>这是你们共同留下的第一处变化。</span></div></article></> : <p className="empty-state">还没有成长变化。先回到房间陪陪 Morrow。</p>}<div className="next-stage-note"><b>下一方向</b><span>门外的声音正在变得清楚，但不会提前展示尚未经历的事件。</span></div><div className="prototype-preview-entry"><span>原型演示入口，不改变当前进度</span><button className="secondary growth-settlement" onClick={() => setPage('chapterComplete')}>预览第一章完成界面</button></div><BottomNav page={page} onChange={setPage}/></div>}

    {page === 'echoes' && <div className="list-page"><h1>词语回声</h1><p>这里只出现 Morrow 已经带你遇见的表达。</p><div className="tabs"><button className={echoTab === 'recent' ? 'active' : ''} onClick={() => setEchoTab('recent')}>最近遇见</button><button className={echoTab === 'review' ? 'active' : ''} onClick={() => setEchoTab('review')}>还想再用</button><button className={echoTab === 'familiar' ? 'active' : ''} onClick={() => setEchoTab('familiar')}>已经很熟</button></div>{getTeachingEchoes().length === 0 ? <p className="empty-state">还没有完成真实跟读的词语。</p> : echoTab === 'recent' ? <>{getTeachingEchoes().map(text => <article key={text}><Volume2/><div><b>{text}</b><span>已完成提示下跟读，不等于稳定掌握</span></div></article>)}</> : <p className="empty-state">这里还没有表达。以后遇见更多内容时会自动归入。</p>}<BottomNav page={page} onChange={setPage}/></div>}

    {page === 'settings' && <div className="list-page settings-page"><button className="back-button" onClick={() => goHome('free')} aria-label="返回"><ChevronLeft/></button><h1>设置与隐私</h1><h2>学习支持</h2><div className="mode-picker"><button className={supportMode === 'beginner' ? 'active' : ''} onClick={() => setSupportMode('beginner')}><b>启蒙支持</b><span>中文解释更多，从画面和单词开始</span></button><button className={supportMode === 'basic' ? 'active' : ''} onClick={() => setSupportMode('basic')}><b>基础支持</b><span>熟悉的快速复现，新语块先教再说</span></button><button className={supportMode === 'independent' ? 'active' : ''} onClick={() => setSupportMode('independent')}><b>自主练习</b><span>更少提示，但必修跟读不跳过</span></button></div><p className="privacy-copy">Morrow 按人生阶段、章节与学习证据安排内容。难度只改变提示量，不改变必须完成的跟读。</p><h2>体验设置</h2><div className="setting-group experience-group"><button className="setting-row" onClick={() => setMuted(value => !value)}><span>{muted ? <VolumeX/> : <Volume2/>}声音</span><b>{muted ? '已关闭' : '已开启'}</b></button><div className="setting-row"><span>播放倍速</span><SpeedControl rate={playback.rate} onRate={playback.changeRate} disabled={voiceBusy}/></div></div><h2>记忆与数据</h2><p className="privacy-copy">只记录课程步骤、用户确认的选择、跟读完成状态和已发生的世界变化；原始录音不长期保存。</p><div className="setting-group data-group"><button className="setting-row" onClick={resetPrototype}><span><RotateCcw/>重新体验产品原型</span><b>清空本地进度</b></button></div></div>}

    {notice && <div className="toast" role="status" aria-live="polite">{notice}</div>}
  </section></main>
}

function BottomNav({ page, onChange }: { page: Page; onChange: (page: Page) => void }) {
  return <nav className="bottom-nav" aria-label="主导航"><button className={page === 'home' ? 'active' : ''} onClick={() => onChange('home')}><CircleUserRound/>陪伴</button><button className={page === 'growth' ? 'active' : ''} onClick={() => onChange('growth')}><Sparkles/>成长</button><button className={page === 'echoes' ? 'active' : ''} onClick={() => onChange('echoes')}><BookOpenText/>词语回声</button></nav>
}
