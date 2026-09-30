import { useCallback, useEffect, useRef, useState } from 'react'
import audioMap from './audio-map.json'

export const PLAYBACK_RATES = [0.75, 1, 1.25] as const
const KEY = 'morrow-prototype:playback-rate'
const BASE = `${(import.meta.env.MIAODA_CLIENT_BASE_PATH || '').replace(/\/$/, '')}/`
export const rateLabel = (rate: number) => rate === 1 ? '1.0×' : `${rate}×`
const normalise = (text: string) => text.toLowerCase().replace(/[’]/g, "'").replace(/[^a-z0-9'\s]/g, '').replace(/\s+/g, ' ').trim()

export function usePlayback(notify: (message: string) => void) {
  const [rate, setRate] = useState(() => {
    try { const n = Number(localStorage.getItem(KEY)); return PLAYBACK_RATES.some(r => r === n) ? n : 1 } catch { return 1 }
  })
  const [playing, setPlaying] = useState(false)
  const audio = useRef<HTMLAudioElement | null>(null)
  const generation = useRef(0)
  const stop = useCallback(() => {
    generation.current += 1
    if (audio.current) { audio.current.pause(); audio.current = null }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    setPlaying(false)
  }, [])
  useEffect(() => () => {
    generation.current += 1
    audio.current?.pause()
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
  }, [])
  function changeRate(value: number) {
    if (!PLAYBACK_RATES.some(r => r === value)) return
    // Changing rate affects local audio immediately; system speech is stopped and replayed explicitly.
    if (audio.current) audio.current.playbackRate = value
    else stop()
    setRate(value)
    try { localStorage.setItem(KEY, String(value)) } catch { notify('本次倍速已生效，但浏览器未能保存设置。') }
  }
  function replay(text: string, muted = false, busy = false) {
    if (busy) return
    stop()
    if (muted) { notify('声音已关闭，请先在设置中开启。'); return }
    const token = generation.current
    const path = (audioMap as Record<string, string>)[normalise(text)]
    if (path) {
      const player = new Audio(`${BASE}${path}`)
      audio.current = player
      player.playbackRate = rate
      player.preservesPitch = true
      player.onplaying = () => { if (token === generation.current) setPlaying(true) }
      player.onended = () => { if (token === generation.current) setPlaying(false) }
      player.onerror = () => { if (token === generation.current) { setPlaying(false); notify('音频加载失败，请重试。') } }
      void player.play().catch(() => { if (token === generation.current) { setPlaying(false); notify('播放未能开始，请再次点击重听。') } })
      return
    }
    if (!('speechSynthesis' in window)) { notify('当前浏览器不能朗读，这句正式音频也尚未制作。'); return }
    const speech = new SpeechSynthesisUtterance(text)
    speech.lang = /[\u4e00-\u9fff]/.test(text) ? 'zh-CN' : 'en-US'
    speech.rate = rate
    const voice = window.speechSynthesis.getVoices().find(v => v.lang.toLowerCase().startsWith(speech.lang.slice(0, 2)))
    if (voice) speech.voice = voice
    speech.onstart = () => { if (token === generation.current) setPlaying(true) }
    speech.onend = () => { if (token === generation.current) setPlaying(false) }
    speech.onerror = () => { if (token === generation.current) { setPlaying(false); notify('系统朗读不可用，请检查设备语音支持。') } }
    notify('本句暂无匹配的正式音频，使用系统朗读。')
    window.speechSynthesis.speak(speech)
  }
  return { rate, changeRate, replay, stop, playing }
}
