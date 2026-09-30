import { useEffect, useState } from 'react'
import type { FixedContentLine } from '@english-pet/contracts'
import { Languages, Square, Volume2 } from 'lucide-react'
import { audioFileUrl, getAudioBinding, type AudioBinding } from '@/api/audio-binding-api'
import { Button } from '@/components/ui/button'

// 模块级单例：一次只播一条，播新停旧。
let activeAudio: HTMLAudioElement | null = null

function stopActiveAudio() {
  if (activeAudio) {
    activeAudio.pause()
    activeAudio.src = ''
    activeAudio = null
  }
}

// 页面切换语速时实时作用于正在播放的元素。
export function setActivePlaybackRate(rate: number) {
  if (activeAudio) activeAudio.playbackRate = rate
}

export function LearningLine({
  line,
  token,
  playbackRate,
}: {
  line: FixedContentLine
  token: string
  playbackRate: number
}) {
  const [expanded, setExpanded] = useState(false)
  const [binding, setBinding] = useState<AudioBinding | null | undefined>(
    line.audioIds.length > 0 ? undefined : null,
  )
  const [playing, setPlaying] = useState(false)

  // 仅当该台词登记了音频候选时才查询绑定；参考句（audioIds=[]）不查、不出按钮。
  useEffect(() => {
    if (line.audioIds.length === 0) {
      setBinding(null)
      return
    }
    let cancelled = false
    getAudioBinding(token, line.audioIds[0])
      .then((result) => {
        if (!cancelled) setBinding(result)
      })
      .catch(() => {
        if (!cancelled) setBinding(null)
      })
    return () => {
      cancelled = true
    }
  }, [line, token])

  // 卸载时停止本组件可能正在播放的音频。
  useEffect(() => {
    return () => {
      stopActiveAudio()
    }
  }, [])

  const canPlay = binding != null && Boolean(binding.fileRef)

  function togglePlay() {
    if (!canPlay || !binding) return
    if (playing) {
      stopActiveAudio()
      setPlaying(false)
      return
    }
    stopActiveAudio()
    const audio = new Audio(audioFileUrl(binding.fileRef))
    audio.playbackRate = playbackRate
    audio.preservesPitch = true
    ;(audio as HTMLAudioElement & { webkitPreservesPitch?: boolean }).webkitPreservesPitch = true
    audio.addEventListener('ended', () => {
      setPlaying(false)
      activeAudio = null
    })
    audio.addEventListener('pause', () => {
      setPlaying(false)
    })
    activeAudio = audio
    void audio.play()
    setPlaying(true)
  }

  return (
    <div className="min-w-0 border-l-2 border-primary pl-4">
      <p className="break-words text-lg leading-8">{line.learningContent.english}</p>
      {expanded && (
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{line.learningContent.translation.textZh}</p>
      )}
      <div className="mt-2 flex justify-end gap-2">
        {canPlay && (
          <Button type="button" size="sm" variant={playing ? 'secondary' : 'outline'} onClick={() => togglePlay()}>
            {playing ? <Square /> : <Volume2 />}
            {playing ? '停止播放' : '播放发音'}
          </Button>
        )}
        <Button type="button" size="sm" variant="ghost" onClick={() => setExpanded((value) => !value)}>
          <Languages />
          {expanded ? '收起中文' : '查看中文'}
        </Button>
      </div>
    </div>
  )
}
