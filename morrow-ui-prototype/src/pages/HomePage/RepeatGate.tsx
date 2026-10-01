import { useCallback, useEffect, useRef, useState, type PointerEvent, type KeyboardEvent } from 'react'
import { Mic, CheckCircle2, LoaderCircle } from 'lucide-react'
import type { ISpeechRecognition, ISpeechRecognitionResultEvent } from './HomePage'

type Status = 'idle' | 'starting' | 'recording' | 'processing' | 'passed' | 'failed'
type Session = {
  engine: ISpeechRecognition; pointer: number; startY: number; released: boolean;
  cancel: boolean; ready: boolean; ended: boolean; transcripts: string[]; timer: number | null;
}
const normalize = (value: string) => value.toLowerCase().replace(/[’]/g, "'").replace(/[^a-z\s']/g, ' ').replace(/\s+/g, ' ').trim()
const tokens = (value: string) => normalize(value).split(' ').filter(Boolean)
function acceptable(transcript: string, target: string) {
  const heard = tokens(transcript); const expected = tokens(target)
  if (heard.join(' ') === expected.join(' ')) return true
  if (expected.length < 5 || heard.length < Math.ceil(expected.length * .75) || heard.length > expected.length + 2) return false
  const rows = Array.from({ length: expected.length + 1 }, () => Array(heard.length + 1).fill(0))
  for (let i = 1; i <= expected.length; i += 1) for (let j = 1; j <= heard.length; j += 1) {
    rows[i][j] = expected[i - 1] === heard[j - 1] ? rows[i - 1][j - 1] + 1 : Math.max(rows[i - 1][j], rows[i][j - 1])
  }
  return rows[expected.length][heard.length] >= Math.ceil(expected.length * .8)
}

export default function RepeatGate({ id, target, onPassed, onPreviewSkip, onPostpone, onBusyChange, onFailed, disabled = false }: {
  id: string; target: string; onPassed: () => void; onPreviewSkip: () => void; onPostpone: () => void; onBusyChange: (value: boolean) => void; onFailed?: () => void; disabled?: boolean
}) {
  const [status, setStatus] = useState<Status>('idle')
  const [cancelHint, setCancelHint] = useState(false)
  const [message, setMessage] = useState('松开后识别 · 上滑取消')
  const session = useRef<Session | null>(null)
  const latest = useRef({ onPassed, onBusyChange })
  useEffect(() => { latest.current = { onPassed, onBusyChange } }, [onPassed, onBusyChange])
  const clear = useCallback((s: Session) => { if (s.timer !== null) window.clearTimeout(s.timer); s.timer = null }, [])
  const dispose = useCallback((s: Session) => {
    clear(s); s.engine.onstart = null; s.engine.onresult = null; s.engine.onerror = null; s.engine.onend = null
    try { s.engine.abort() } catch { /* Already stopped */ }
    if (session.current === s) session.current = null
    latest.current.onBusyChange(false)
  }, [clear])
  function cancel(message = '已取消，没有提交本次录音。') {
    const s = session.current
    if (s) { s.cancel = true; dispose(s) }
    setStatus('idle'); setCancelHint(false); setMessage(message)
  }
  function fail(s: Session, text: string) {
    if (session.current !== s) return
    dispose(s); setStatus('failed'); setCancelHint(false); setMessage(text)
  }
  function evaluate(s: Session) {
    if (session.current !== s || !s.released || s.cancel) return
    // Whole utterance must match; isolated keywords never count as a complete sentence.
    const passed = s.transcripts.some(t => acceptable(t, target))
    const heard = s.transcripts[0]
    dispose(s)
    if (passed) { setStatus('passed'); setMessage('已经听清楚了'); latest.current.onPassed() }
    else { setStatus('failed'); onFailed?.(); setMessage(heard ? `听到的是“${heard}”。重听后，再试一次。` : '没有听清，重听后再试一次。') }
  }
  function start(pointer: number, startY: number) {
    if (disabled || session.current || status === 'passed') return
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Recognition) { setStatus('failed'); setMessage('当前浏览器不支持语音识别，可暂时离开并保留待完成。'); return }
    let engine: ISpeechRecognition
    try { engine = new Recognition() } catch { setStatus('failed'); setMessage('语音服务未能启动，请稍后再试。'); return }
    const s: Session = { engine, pointer, startY, released: false, cancel: false, ready: false, ended: false, transcripts: [], timer: null }
    session.current = s
    setStatus('starting'); setCancelHint(false); setMessage('正在准备麦克风，请保持按住…')
    latest.current.onBusyChange(true)
    engine.lang = 'en-US'; engine.continuous = true; engine.interimResults = false; engine.maxAlternatives = 3
    s.timer = window.setTimeout(() => fail(s, '麦克风准备超时。请检查权限后重新按住。'), 8000)
    engine.onstart = () => {
      if (session.current !== s) return
      if (s.released || s.cancel) { cancel(); return }
      s.ready = true
      clear(s); setStatus('recording'); setMessage('松开后识别 · 上滑取消')
      s.timer = window.setTimeout(() => {
        if (session.current !== s) return
        try { engine.stop() } catch { fail(s, '收音结束失败，请重新按住。'); return }
        setMessage('已到本次时长上限，请松开后识别。')
      }, 15000)
    }
    engine.onresult = (e: ISpeechRecognitionResultEvent) => {
      if (session.current !== s || s.cancel) return
      // Join recognition segments so a natural pause doesn't lose the start of the sentence.
      let candidates = ['']
      for (const result of Array.from(e.results)) {
        candidates = candidates.flatMap(prefix => Array.from(result).map(item => `${prefix} ${item.transcript}`.trim())).slice(0, 9)
      }
      s.transcripts = candidates
      // Wait for onend after release; early results must not truncate the utterance.
    }
    engine.onerror = e => {
      const errors: Record<string, string> = {
        'not-allowed': '麦克风权限未开启，请允许后重新按住。',
        'service-not-allowed': '浏览器语音服务不可用，可暂时离开并保留待完成。',
        'network': '语音服务连接失败，请稍后重试。',
        'audio-capture': '没有检测到可用麦克风，请检查设备。',
        'no-speech': '没有听到声音，准备好后再按住说话。',
      }
      fail(s, errors[e.error] || '本次识别未完成，请重新按住。')
    }
    engine.onend = () => {
      if (session.current !== s) return
      clear(s); s.ended = true
      if (s.released) evaluate(s)
      else setMessage('本次收音已结束，请松开后识别。')
    }
    try { engine.start() } catch { fail(s, '麦克风未能启动，请重新按住。') }
  }
  function release(pointer: number) {
    const s = session.current
    if (!s || s.pointer !== pointer) return
    if (s.cancel) { cancel(); return }
    if (!s.ready) { cancel('尚未开始收音，请授权后重新按住。'); return }
    s.released = true; clear(s); setStatus('processing'); setMessage('正在识别…')
    if (s.ended) { evaluate(s); return }
    s.timer = window.setTimeout(() => fail(s, '识别等待超时，请重新按住。'), 8000)
    try { s.engine.stop() } catch { fail(s, '收音结束失败，请重新按住。') }
  }
  function down(e: PointerEvent<HTMLButtonElement>) {
    if (!e.isPrimary || e.button !== 0 || session.current) return
    e.preventDefault(); e.stopPropagation()
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { setMessage('没有接住这次按压，请再试一次。'); return }
    start(e.pointerId, e.clientY)
  }
  function move(e: PointerEvent<HTMLButtonElement>) {
    const s = session.current
    if (!s || s.pointer !== e.pointerId || s.released) return
    if (e.clientY < s.startY - 48) { s.cancel = true; setCancelHint(true); setMessage('松开取消') }
  }
  function up(e: PointerEvent<HTMLButtonElement>) {
    e.preventDefault(); e.stopPropagation(); release(e.pointerId)
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
  }
  function keyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); start(-1, 0) }
    if (e.key === 'Escape') { e.preventDefault(); cancel() }
  }
  useEffect(() => {
    const interrupt = () => {
      const s = session.current
      if (s) { s.cancel = true; dispose(s); setStatus('idle'); setCancelHint(false); setMessage('录音已取消，请重新按住。') }
    }
    const visibility = () => { if (document.hidden) interrupt() }
    window.addEventListener('blur', interrupt); document.addEventListener('visibilitychange', visibility)
    return () => {
      window.removeEventListener('blur', interrupt); document.removeEventListener('visibilitychange', visibility)
      const s = session.current; if (s) dispose(s)
    }
  }, [dispose])
  const holding = status === 'starting' || status === 'recording'
  return <div className="repeat-gate" data-speech-id={id}>
    <div className="record-caption">{cancelHint ? '松开取消' : status === 'recording' ? '正在听你说…' : status === 'starting' ? '正在准备麦克风…' : status === 'processing' ? '正在识别…' : '开口跟读'}</div>
    <button type="button" data-voice-control="true" className={`voice-orb ${holding ? 'is-recording' : ''} ${cancelHint ? 'is-cancelling' : ''}`} aria-label="按住说话" aria-describedby={`voice-help-${id}`} disabled={disabled || status === 'processing' || status === 'passed'}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => cancel()}
      onLostPointerCapture={() => { if (session.current && !session.current.released) cancel() }}
      onContextMenu={e => e.preventDefault()} onClick={e => { e.preventDefault(); e.stopPropagation() }}
      onKeyDown={keyDown} onKeyUp={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); release(-1) } }}>
      {status === 'processing' ? <LoaderCircle/> : status === 'passed' ? <CheckCircle2/> : <Mic/>}
    </button>
    <span className="record-label">{cancelHint ? '松开取消' : holding ? '松开结束' : status === 'processing' ? '请稍等' : '按住说话'}</span>
    <p id={`voice-help-${id}`} className="record-hint" role="status">{message}</p>
    <button className="prototype-skip-speech" onClick={onPreviewSkip} disabled={holding || status === 'processing' || status === 'passed'}>仅原型测试：跳过跟读</button>
    <button className="text-button postpone-speech" onClick={onPostpone} disabled={holding || status === 'processing'}>稍后继续</button>
  </div>
}
