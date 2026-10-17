import { useEffect, useRef, useState } from 'react'
import { Mic, Square, X } from 'lucide-react'
import { ApiError, request, type SpeechConfirmation, type TranscribeAudioResponse } from './backend'
import { acquireCapture, releaseCapture } from './mediaSession'

export default function SpeechInput({ token, instanceId, stateId, teachingStepId, onConfirm, stopPlayback, disabled = false }: {
  token: string; instanceId: string; stateId: string; teachingStepId?: string
  onConfirm: (result: TranscribeAudioResponse) => Promise<SpeechConfirmation>; stopPlayback: () => void; disabled?: boolean
}) {
  const [phase, setPhase] = useState<'idle' | 'permission' | 'recording' | 'transcribing' | 'confirming'>('idle')
  const [result, setResult] = useState<TranscribeAudioResponse | null>(null)
  const [error, setError] = useState('')
  const recorder = useRef<MediaRecorder | null>(null)
  const stream = useRef<MediaStream | null>(null)
  const controller = useRef<AbortController | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const generation = useRef(0)
  const active = useRef(false)
  const pendingTranscript = useRef<TranscribeAudioResponse | null>(null)
  const captureOwner = useRef(Symbol('speech-input'))
  const confirmationInFlight = useRef(false)

  function discardTranscript() {
    const discarded = pendingTranscript.current
    pendingTranscript.current = null
    if (discarded?.fixedEventAsrProof) {
      void request(`/v1/fixed-content/events/${instanceId}/asr-proof/discard`, token, {
        stateId, asrProof: discarded.fixedEventAsrProof,
      }).catch(() => { /* 界面立即丢弃；断网时旧凭证仍受重录替换、暂停作废和到期限制。 */ })
    }
  }

  function release() {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    stream.current?.getTracks().forEach(track => track.stop())
    stream.current = null
    releaseCapture(captureOwner.current)
  }
  function cancel() {
    // 用户已确认的请求继续由服务端处理，不能再用取消请求抢先作废。
    if (confirmationInFlight.current) return
    discardTranscript()
    generation.current += 1
    controller.current?.abort()
    const current = recorder.current
    recorder.current = null
    if (current && current.state !== 'inactive') current.stop()
    release()
    active.current = false
    setPhase('idle')
    setResult(null)
  }
  useEffect(() => {
    const hide = () => { if (document.hidden) cancel() }
    document.addEventListener('visibilitychange', hide)
    return () => {
      if (!confirmationInFlight.current) discardTranscript()
      document.removeEventListener('visibilitychange', hide)
      generation.current += 1
      controller.current?.abort()
      if (recorder.current?.state !== 'inactive') recorder.current?.stop()
      release()
    }
  }, [])

  async function start() {
    if (active.current || disabled) return
    if (!acquireCapture(captureOwner.current)) {
      setError('另一段录音还没结束，请稍等。')
      return
    }
    active.current = true
    const run = ++generation.current
    setError(''); setResult(null); setPhase('permission'); stopPlayback()
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) throw new Error('这个浏览器暂时不能录音。请使用支持录音的浏览器，或稍后继续。')
      const acquired = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (generation.current !== run) { acquired.getTracks().forEach(track => track.stop()); return }
      stream.current = acquired
      const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].find(value => MediaRecorder.isTypeSupported(value))
      const current = new MediaRecorder(acquired, mimeType ? { mimeType } : undefined)
      recorder.current = current
      for (const track of acquired.getAudioTracks()) {
        track.addEventListener('ended', () => {
          if (generation.current !== run || recorder.current !== current) return
          cancel()
          setError('麦克风中断了。请重新允许麦克风，再录一次；也可以稍后继续。')
        }, { once: true })
      }
      const chunks: Blob[] = []
      let size = 0
      let tooLarge = false
      current.ondataavailable = event => {
        if (event.data.size) { chunks.push(event.data); size += event.data.size }
        if (size > 5_000_000 && current.state === 'recording') { tooLarge = true; current.stop() }
      }
      current.onerror = () => {
        if (generation.current !== run) return
        cancel(); setError('录音中断了，可以重新录音或稍后继续。')
      }
      current.onstop = async () => {
        if (generation.current !== run) { acquired.getTracks().forEach(track => track.stop()); return }
        release()
        recorder.current = null
        try {
          const blob = new Blob(chunks, { type: current.mimeType || 'audio/webm' })
          if (tooLarge || blob.size > 5_000_000) throw new Error('这段录音太长了，请录短一点。')
          if (!blob.size) throw new Error('没有录到声音，请再试一次。')
          setPhase('transcribing')
          const audioBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
            reader.onerror = () => reject(new Error('没有读到录音，请重新录一次。'))
            reader.readAsDataURL(blob)
          })
          if (generation.current !== run) return
          controller.current = new AbortController()
          const transcript = await request<TranscribeAudioResponse>('/v1/audio/transcriptions', token, {
            audioBase64, mimeType: blob.type, languageHint: 'en', fixedEventInstanceId: instanceId,
            fixedEventStateId: stateId, ...(teachingStepId ? { fixedEventTeachingStepId: teachingStepId } : {}),
          }, controller.current.signal)
          if (generation.current !== run) return
          if (transcript.degraded || transcript.provider === 'mock' || !transcript.fixedEventAsrProof || !transcript.text.trim()) {
            throw new Error(transcript.provider === 'mock' ? '真实语音识别还没有接通。这次不会记为完成，可以稍后继续。' : '这次没有可靠地识别到声音，请重录或稍后继续。')
          }
          pendingTranscript.current = transcript
          setResult(transcript); setPhase('idle'); active.current = false
        } catch (err) {
          if (generation.current !== run) return
          setError(err instanceof Error ? err.message : '识别没成功，请重新录音。')
          setPhase('idle'); active.current = false
        }
      }
      current.start(250); setPhase('recording')
      timer.current = setTimeout(() => { if (current.state === 'recording') current.stop() }, 30_000)
    } catch (err) {
      if (generation.current !== run) return
      release(); setPhase('idle'); active.current = false
      setError(err instanceof DOMException && ['NotAllowedError', 'SecurityError'].includes(err.name)
        ? '麦克风没有打开。你可以在浏览器里允许麦克风，再重试；也可以稍后继续。'
        : err instanceof Error ? err.message : '录音没能开始，请重试或稍后继续。')
    }
  }

  async function confirm() {
    if (!result || active.current || disabled) return
    const expiresAt = Date.parse(result.fixedEventProofExpiresAt ?? '')
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      discardTranscript()
      setError('这次识别已经过期，请重新录音。'); setResult(null); return
    }
    active.current = true; confirmationInFlight.current = true; setPhase('confirming'); setError('')
    const run = generation.current
    try {
      const confirmation = await onConfirm(result)
      if (run === generation.current) {
        pendingTranscript.current = null
        setResult(null)
        if (!confirmation.accepted) setError(confirmation.messageZh || '这次还没识别到当前表达。可以重新录音，或稍后继续。')
      }
    } catch (err) {
      if (run === generation.current) {
        if (err instanceof ApiError && err.status !== null && err.status >= 400 && err.status < 500 && err.status !== 408) {
          discardTranscript(); setResult(null)
        }
        setError(err instanceof Error ? err.message : '没有提交成功，可以重试。')
      }
    } finally {
      confirmationInFlight.current = false
      if (run === generation.current) { active.current = false; setPhase('idle') }
    }
  }

  return <div className="speech-input">
    {error && <p className="s09-message" role="alert">{error}</p>}
    {result ? <div className="transcript-card">
      <span>这次识别到的是</span><p lang="en">{result.text}</p><span>这是你刚才说的吗？</span>
      <div className="s09-button-row"><button className="primary" disabled={disabled || phase !== 'idle'} onClick={confirm}>{phase === 'confirming' ? '正在确认…' : '是的，确认这次识别'}</button>
        <button className="text-button" disabled={disabled || phase !== 'idle'} onClick={cancel}>不是，重新录</button></div>
    </div> : <>
      <p className="s09-caption">{phase === 'recording' ? '正在听，最多录 30 秒。说完点结束。' : phase === 'permission' ? '正在等麦克风权限…' : phase === 'transcribing' ? '正在识别，请稍等…' : '点一下开始录音，说完再点结束。'}</p>
      <div className="s09-button-row">
        {phase === 'recording' ? <button className="primary recording" onClick={() => recorder.current?.stop()}><Square size={16}/>结束录音</button>
          : <button className="primary" disabled={disabled || phase !== 'idle'} onClick={start}><Mic size={18}/>开始录音</button>}
        {phase !== 'idle' && <button className="text-button" onClick={cancel}><X size={16}/>取消这次录音</button>}
      </div>
    </>}
  </div>
}
