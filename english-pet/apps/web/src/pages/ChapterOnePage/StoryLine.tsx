import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import type { FixedContentLine } from '@english-pet/contracts'
import { API_BASE, request } from './backend'
import { isCapturing, subscribeCapture } from './mediaSession'
import Dialogue from './Dialogue'

interface Binding {
  audioId: string; lineId: string; contentId: string; textVersion: string; translationVersion: string
  status: string; fileRef: string
}

export default function StoryLine({ line, token, muted, rate, onRate, stopSignal, children }: {
  line: FixedContentLine; token: string; muted: boolean; rate: number; onRate: (rate: number) => void; stopSignal: number; children?: ReactNode
}) {
  const [binding, setBinding] = useState<Binding | null>(null)
  const [notice, setNotice] = useState('')
  const [playing, setPlaying] = useState(false)
  const capturing = useSyncExternalStore(subscribeCapture, isCapturing)
  const audio = useRef<HTMLAudioElement | null>(null)
  function stop() { audio.current?.pause(); audio.current = null; setPlaying(false) }
  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    setBinding(null); setNotice(''); stop()
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
  return <Dialogue english={line.learningContent.english} chinese={line.learningContent.translation.textZh}
    rate={rate} onRate={onRate} onReplay={play} playbackDisabled={!binding || muted || capturing} playing={playing}
    note={capturing && binding ? '录音结束后可以重听。' : notice || (!binding ? '语音暂未准备好，可先阅读内容。' : muted ? '已静音' : '')}>
    {children}
  </Dialogue>
}
