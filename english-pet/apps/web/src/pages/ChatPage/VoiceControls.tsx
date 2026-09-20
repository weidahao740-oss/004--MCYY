import { useEffect, useRef, useState } from 'react'
import { RefreshCw, Volume2 } from 'lucide-react'
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

type PlaybackRate = 1 | 0.8 | 0.6

const playbackRates: PlaybackRate[] = [1, 0.8, 0.6]

export default function VoiceControls({ token, text, zh, voiceEnabled, autoPlay = false, onSimpler }: VoiceControlsProps) {
  const [player] = useState(() => new WebAudioPlayerAdapter())
  const [loading, setLoading] = useState(false)
  const [audio, setAudio] = useState<Blob | null>(null)
  const playedAutomaticallyRef = useRef(false)

  async function getAudio(): Promise<Blob> {
    if (audio) return audio
    const response = await voiceApi.synthesize(token, text, 1)
    if (!response.audioBase64) throw new Error('empty_audio')
    const source = voiceApi.audioBlob(response)
    setAudio(source)
    return source
  }

  async function play(rate: PlaybackRate) {
    if (!voiceEnabled) {
      toast.info(zh ? '语音播放已在设置中关闭。' : 'Voice output is turned off in settings.')
      return
    }
    setLoading(true)
    try {
      await player.play(await getAudio(), rate)
    } catch {
      toast.error(zh ? '语音暂时不可用，文字内容仍可继续使用。' : 'Voice is unavailable; the text is still available.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setAudio(null)
    playedAutomaticallyRef.current = false
  }, [text])

  useEffect(() => {
    if (!autoPlay || playedAutomaticallyRef.current || !voiceEnabled) return
    playedAutomaticallyRef.current = true
    let cancelled = false
    voiceApi.synthesize(token, text, 1).then((response) => {
      if (cancelled || !response.audioBase64) return
      const source = voiceApi.audioBlob(response)
      setAudio(source)
      return player.play(source, 1)
    }).catch(() => undefined)
    return () => {
      cancelled = true
      player.stop()
    }
  }, [autoPlay, player, text, token, voiceEnabled])

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/70 pt-3">
      {playbackRates.map((rate) => (
        <Button key={rate} type="button" size="sm" variant="ghost" disabled={loading} onClick={() => void play(rate)}>
          <Volume2 />{loading ? (zh ? '加载中' : 'Loading') : `${rate.toFixed(1)}×`}
        </Button>
      ))}
      <Button type="button" size="sm" variant="ghost" onClick={onSimpler}><RefreshCw />{zh ? '换简单说法' : 'Simpler English'}</Button>
      <span className="text-[11px] text-muted-foreground">同一音频，播放时变速并保持音高</span>
    </div>
  )
}
