import { useEffect, useRef, useState } from 'react'
import Dialogue from './Dialogue'
import RepeatGate from './RepeatGate'
import { usePlayback } from './usePlayback'
import { readEvidence, recordEvidence } from './teachingEvidence'
import type { SupportMode, TeachingCourse, TeachingUnit } from './teachingContent'

type Step = { id: string; kind: 'context' | 'teach' | 'location' | 'output'; english: string; chinese: string; explanation: string; unit?: TeachingUnit; practice?: boolean }
interface Progress { signature: string; steps: Step[]; cursor: number; done: string[]; preview: boolean }
const progressKey = (id: string) => `morrow:teaching-progress:v1:${id}`
const recordingTipKey = 'morrow:recording-tip:v1'
function createProgress(course: TeachingCourse, mode: SupportMode): Progress {
  const signature = JSON.stringify(['compact-v3-word-repeat', course, mode])
  const evidence = readEvidence()
  const units = course.units.filter(unit => mode === 'beginner' || !unit.covers.every(key => evidence[key]?.level === 'prompted'))
  const steps: Step[] = course.locationCheck ? [] : [{ id: 'context', kind: 'context', english: '', chinese: '', explanation: course.context }]
  steps.push(...units.map(unit => ({ id: unit.id, kind: 'teach' as const, english: unit.english, chinese: unit.chinese, explanation: unit.explanation, unit, practice: unit.id !== 'bell-position' })))
  if (course.locationCheck) steps.push({ id: 'location', kind: 'location', english: 'Where is the bell?', chinese: '铃铛在哪里？', explanation: '' })
  steps.push({ id: 'output', kind: 'output', english: course.target, chinese: course.chinese, explanation: '' })
  try {
    const stored = JSON.parse(localStorage.getItem(progressKey(course.id)) || 'null') as Progress | null
    if (stored?.signature === signature && Array.isArray(stored.steps) && Array.isArray(stored.done) && Number.isInteger(stored.cursor) && stored.cursor >= 0 && stored.cursor < stored.steps.length) {
      // 预览不变成学习完成；再次进入时自然回到尚未完成处，不新增补齐按钮。
      return stored.preview ? { ...stored, preview: false, cursor: Math.max(0, stored.steps.findIndex(step => !stored.done.includes(step.id))) } : stored
    }
  } catch { /* 旧版步骤不兼容时只重启当前教学，不清除其他进度 */ }
  return { signature, steps, cursor: 0, done: [], preview: false }
}
export default function TeachingGate({ course, mode, muted, onUnmute, onFinish, onPostpone, notify }: {
  course: TeachingCourse; mode: SupportMode; muted: boolean; onUnmute: () => void; onFinish: (real: boolean) => void; onPostpone: () => void; notify: (text: string) => void
}) {
  const [progress, setProgress] = useState(() => createProgress(course, mode))
  const step = progress.steps[progress.cursor]
  const [translationOverride, setTranslationOverride] = useState<boolean | null>(null)
  const [ready, setReady] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [speechText, setSpeechText] = useState('')
  const [failed, setFailed] = useState(false)
  const [helpUnit, setHelpUnit] = useState<TeachingUnit | null>(null)
  const heardExplanations = useRef(new Set<string>())
  const introducedRecording = useRef(false)
  const readyRef = useRef<string | null>(null)
  const playback = usePlayback(notify)
  const { playSegments, stop } = playback
  const recordingStep = step.kind === 'output' || step.practice
  const showChinese = translationOverride ?? (step.kind === 'teach' && mode === 'beginner')
  const chunksKey = course.chunks.join('\n')
  useEffect(() => {
    const timer = window.setTimeout(() => {
      readyRef.current = null; setReady(null)
      const segments: string[] = []
      if (step.kind === 'context') segments.push(step.explanation)
      else if (step.kind === 'output') segments.push(...chunksKey.split('\n'), course.target)
      else segments.push(step.english)
      // 正式教学只在开始页播一次中文情境；后续解释只显示文字，不自动朗读。
      let needsTip = false
      try { needsTip = Boolean(recordingStep) && !introducedRecording.current && !sessionStorage.getItem(recordingTipKey) } catch { needsTip = Boolean(recordingStep) && !introducedRecording.current }
      if (needsTip) segments.push('按住麦克风说，说完松开。')
      playSegments(segments, muted, text => {
        setSpeechText(text)
        if (text === '按住麦克风说，说完松开。') {
          introducedRecording.current = true
          try { sessionStorage.setItem(recordingTipKey, 'shown') } catch { /* 当前组件仍只提醒一次 */ }
        }
      }, () => {
        heardExplanations.current.add(step.id)
        setSpeechText('')
      }, text => {
        // 英文目标完整播完即可操作，后续中文可以被点击或录音打断。
        if (text === step.english) {
          heardExplanations.current.add(step.id)
          readyRef.current = step.id; setReady(step.id)
        }
      })
    }, 180)
    return () => { window.clearTimeout(timer); stop() }
  }, [step, chunksKey, course.target, recordingStep, muted, playSegments, stop])
  function persist(next: Progress) {
    setProgress(next)
    try { localStorage.setItem(progressKey(course.id), JSON.stringify(next)) } catch { notify('浏览器未能保存进度，请暂时不要关闭页面。') }
  }
  function advance(preview = false) {
    stop(); setSpeechText(''); readyRef.current = null; setReady(null); setFailed(false); setHelpUnit(null); setTranslationOverride(null)
    persist({ ...progress, cursor: Math.min(progress.cursor + 1, progress.steps.length - 1), preview: progress.preview || preview, done: preview ? progress.done : [...new Set([...progress.done, step.id])] })
  }
  function replay() {
    if (busy) return
    readyRef.current = null; setReady(null); setSpeechText('')
    // 首次整句仍须完成分块及完整示范；重听不重复中文。
    const segments = step.kind === 'output' && !heardExplanations.current.has(step.id) ? [...course.chunks, course.target] : [step.english]
    playSegments(segments, muted, text => setSpeechText(text), () => { setSpeechText('') }, text => {
      if (text === step.english) { heardExplanations.current.add(step.id); readyRef.current = step.id; setReady(step.id) }
    })
  }
  function finish(real: boolean) {
    stop()
    if (real && readyRef.current !== step.id) return
    const verified = real && !progress.preview && progress.steps.slice(0, -1).every(item => progress.done.includes(item.id))
    // 整句跟读只证明这次提示下输出，不推断逐词理解或稳定掌握。
    if (verified) { recordEvidence([`sentence:${course.target}`], 'prompted'); try { localStorage.removeItem(progressKey(course.id)) } catch { /* 本次结果仍有效 */ } }
    onFinish(verified)
  }
  function playHelp(unit: TeachingUnit) {
    setHelpUnit(unit); readyRef.current = null; setReady(null)
    playSegments([unit.english], muted, text => setSpeechText(text), () => { setSpeechText(''); setHelpUnit(null) }, text => {
      if (text === unit.english) { readyRef.current = step.id; setReady(step.id) }
    })
  }
  const english = helpUnit?.english || (speechText && !/[\u4e00-\u9fff]/.test(speechText) ? speechText : step.english)
  const chinese = helpUnit?.chinese || course.units.find(unit => unit.english === english)?.chinese || step.chinese
  const chineseCaption = /[\u4e00-\u9fff]/.test(speechText) ? speechText : ''
  return <>
    {step.kind !== 'context' && <Dialogue english={english} chinese={chinese} showChinese={showChinese} onTranslation={() => setTranslationOverride(!showChinese)} onReplay={replay} rate={playback.rate} onRate={value => { readyRef.current = null; setReady(null); playback.changeRate(value) }} busy={busy} scene={course.locationCheck}/>}
    <div className={course.locationCheck ? 'scene-actions' : 'bottom-stack encounter-actions'}>
      {step.kind === 'context' ? <p className="voice-guide">{step.explanation}</p> : step.kind === 'teach' ? <p className="voice-guide">{step.explanation}</p> : chineseCaption && chineseCaption !== chinese && <p className="voice-guide">{chineseCaption}</p>}
      {muted && <button className="secondary" onClick={onUnmute}>开启声音</button>}
      {step.kind === 'location' ? <div className="location-choices"><button disabled={ready !== step.id} onClick={() => notify('再听听声音，看看窗边。')}>选择房间中央</button><button disabled={ready !== step.id} onClick={() => advance()}>选择窗边</button></div>
        : recordingStep ? <RepeatGate key={step.id} id={`${course.id}-${step.id}`} target={step.english} disabled={muted || ready !== step.id}
          onBusyChange={value => { if (value) { stop(); setSpeechText(''); setHelpUnit(null) } setBusy(value) }} onFailed={() => setFailed(true)}
          onPassed={() => { if (step.kind === 'output') finish(true); else { if (step.unit) recordEvidence(step.unit.covers, 'prompted'); advance() } }}
          onPreviewSkip={() => step.kind === 'output' ? finish(false) : advance(true)} onPostpone={() => { stop(); persist(progress); onPostpone() }}/>
        : <button className="primary" disabled={step.kind !== 'context' && (muted || ready !== step.id)} onClick={() => advance()}>{step.kind === 'context' ? '一起听听' : '继续听'}</button>}
      {!recordingStep && <button className="text-button" onClick={() => { stop(); persist(progress); onPostpone() }}>稍后继续</button>}
      {failed && !busy && <div className="speech-help"><span>哪一小段想再听听？</span>{(step.unit ? [step.unit] : course.units.filter(unit => course.chunks.includes(unit.english))).map(unit => <button key={unit.id} className="text-button" onClick={() => playHelp(unit)}>{unit.chinese}</button>)}</div>}
    </div>
  </>
}
