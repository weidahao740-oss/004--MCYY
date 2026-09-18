import { useEffect, useRef, useState } from 'react'
import { Gauge, RefreshCw, Volume2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { voiceApi } from '@/api/voice-api'
import { WebAudioPlayerAdapter } from '@/audio/web-audio-player-adapter'

interface VoiceControlsProps {
  token: string
  text: string
  zh: boolean
  voiceEnabled: boolean
  autoPlay?: boolean
  onSimpler: () => void
}

export default function VoiceControls({ token, text, zh, voiceEnabled, autoPlay = false, onSimpler }: VoiceControlsProps) {
  const [player] = useState(() => new WebAudioPlayerAdapter())
  const [loading, setLoading] = useState<'normal' | 'slow' | null>(null)
  const playedAutomaticallyRef = useRef(false)

  async function play(rate: number, mode: 'normal' | 'slow') {
    if (!voiceEnabled) {
      toast.info(zh ? '语音播放已在设置中关闭。' : 'Voice output is turned off in settings.')
      return
    }
    setLoading(mode)
    try {
      const response = await voiceApi.synthesize(token, text, rate)
      if (!response.audioBase64) throw new Error('empty_audio')
      await player.play(voiceApi.audioBlob(response), rate)
    } catch {
      toast.error(zh ? '语音暂时不可用，文字内容仍可继续使用。' : 'Voice is unavailable; the text is still available.')
    } finally {
      setLoading(null)
    }
  }

  useEffect(() => {
    if (!autoPlay || playedAutomaticallyRef.current || !voiceEnabled) return
    playedAutomaticallyRef.current = true
    let cancelled = false
    voiceApi.synthesize(token, text, 1).then((response) => {
      if (cancelled || !response.audioBase64) return
      return player.play(voiceApi.audioBlob(response), 1)
    }).catch(() => undefined)
    return () => {
      cancelled = true
      player.stop()
    }
  }, [autoPlay, player, text, token, voiceEnabled])

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/70 pt-3">
      <Button type="button" size="sm" variant="ghost" disabled={loading !== null} onClick={() => void play(1, 'normal')}><Volume2 />{loading === 'normal' ? (zh ? '生成中' : 'Loading') : (zh ? '重听' : 'Replay')}</Button>
      <Button type="button" size="sm" variant="ghost" disabled={loading !== null} onClick={() => void play(0.75, 'slow')}><Gauge />{loading === 'slow' ? (zh ? '生成中' : 'Loading') : (zh ? '慢速' : 'Slower')}</Button>
      <Button type="button" size="sm" variant="ghost" onClick={onSimpler}><RefreshCw />{zh ? '换简单说法' : 'Simpler English'}</Button>
      <span className="text-[11px] text-muted-foreground">Mock TTS</span>
    </div>
  )
}
