import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Play } from 'lucide-react'
import type { FixedContentLine } from '@english-pet/contracts'
import { API_BASE, request } from './backend'
import { isCapturing, subscribeCapture } from './mediaSession'

interface Binding {
  audioId: string; lineId: string; contentId: string; textVersion: string; translationVersion: string
  status: string; fileRef: string
}

export default function StoryLine({ line, token, muted, rate, stopSignal }: {
  line: FixedContentLine; token: string; muted: boolean; rate: number; stopSignal: number
}) {
  const [chinese, setChinese] = useState(false)
  const [binding, setBinding] = useState<Binding | null>(null)
  const [notice, setNotice] = useState('')
  const [playing, setPlaying] = useState(false)
  const capturing = useSyncExternalStore(subscribeCapture, isCapturing)
  const audio = useRef<HTMLAudioElement | null>(null)
  function stop() { audio.current?.pause(); audio.current = null; setPlaying(false) }
  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    setBinding(null); setChinese(false); setNotice(''); stop()
    const id = line.audioIds[0]
    if (id) request<Binding>(`/v1/audio/bindings/${encodeURIComponent(id)}`, token, undefined, controller.signal).then(value => {
      const content = line.learningContent
      if (!cancelled && value.status === 'ready' && value.audioId === id && value.lineId === line.id && value.contentId === content.contentId && value.textVersion === content.textVersion && value.translationVersion === content.translation.version && /^tts\//.test(value.fileRef)) setBinding(value)
    }).catch(() => { /* 未准备好时保留文字，不调用实时语音。 */ })
    return () => { cancelled = true; controller.abort(); audio.current?.pause(); audio.current = null }
  }, [line.id, line.learningContent.contentId, line.learningContent.textVersion, line.learningContent.translation.version, token])
  useEffect(() => { stop() }, [stopSignal, muted])
  useEffect(() => { if (audio.current) audio.current.playbackRate = rate }, [rate])
  async function play() {
    if (!binding || muted || isCapturing()) return
    if (playing) { stop(); return }
    // 同一页多个气泡也只允许一个声音。
    window.dispatchEvent(new Event('morrow:s09:stop-playback'))
    const current = new Audio(`${API_BASE}/${binding.fileRef}`)
    audio.current = current; current.playbackRate = rate
    current.onended = () => { if (audio.current === current) { audio.current = null; setPlaying(false) } }
    current.onerror = () => { if (audio.current === current) { stop(); setNotice('这段声音暂时不能播放，可以先看文字。') } }
    try { await current.play(); if (audio.current === current) setPlaying(true) } catch { if (audio.current === current) { stop(); setNotice('播放没有开始，可以再点一次。') } }
  }
  useEffect(() => {
    const handle = () => stop()
    const hide = () => { if (document.hidden) stop() }
    window.addEventListener('morrow:s09:stop-playback', handle)
    document.addEventListener('visibilitychange', hide)
    return () => { window.removeEventListener('morrow:s09:stop-playback', handle); document.removeEventListener('visibilitychange', hide) }
  }, [])
  return <div className="morrow-dialogue s09-dialogue">
    <p className="english" lang="en">{line.learningContent.english}</p>
    {chinese && <p className="translation">{line.learningContent.translation.textZh}</p>}
    <div className="dialogue-tools">
      <button className="replay-button" disabled={!binding || muted || capturing} onClick={play}><Play size={16}/>{playing ? '停止' : '重听'}</button>
      <button className="translation-button" aria-expanded={chinese} onClick={() => setChinese(value => !value)}>{chinese ? '收起中文' : '查看中文'}</button>
    </div>
    <p className="s09-audio-note">{capturing && binding ? '录音结束后可以重听。' : notice || (!binding ? '语音暂未准备好，可先阅读内容。' : muted ? '已静音' : '')}</p>
  </div>
}
