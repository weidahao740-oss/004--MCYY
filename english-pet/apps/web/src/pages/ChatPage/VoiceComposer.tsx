import { useState } from 'react'
import { Mic, Square, X } from 'lucide-react'
import type { TranscribeAudioResponse } from '@english-pet/contracts'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { voiceApi } from '@/api/voice-api'
import { WebRecorderAdapter } from '@/audio/web-recorder-adapter'

interface VoiceComposerProps {
  token: string
  zh: boolean
  enabled: boolean
  disabled: boolean
  onUseTranscript: (text: string) => void
}

export default function VoiceComposer({ token, zh, enabled, disabled, onUseTranscript }: VoiceComposerProps) {
  const [recorder] = useState(() => new WebRecorderAdapter())
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [transcript, setTranscript] = useState<TranscribeAudioResponse | null>(null)
  const [editedText, setEditedText] = useState('')

  async function start() {
    if (!enabled) {
      toast.info(zh ? '语音输入已在设置中关闭。' : 'Voice input is turned off in settings.')
      return
    }
    try {
      await recorder.start()
      setRecording(true)
    } catch {
      toast.error(zh ? '麦克风不可用。你仍可以打字或使用参考句。' : 'Microphone is unavailable. You can still type.')
    }
  }

  async function stop() {
    setRecording(false)
    setTranscribing(true)
    try {
      const recorded = await recorder.stop()
      const result = await voiceApi.transcribe(token, recorded.blob, recorded.mimeType)
      setTranscript(result)
      setEditedText(result.text)
    } catch {
      toast.error(zh ? '没有听清。录音没有保存，你可以重试或改用文字。' : 'Could not hear that. The recording was not saved; try again or type.')
    } finally {
      setTranscribing(false)
    }
  }

  function discard() {
    recorder.cancel()
    setRecording(false)
    setTranscript(null)
    setEditedText('')
  }

  if (transcript) {
    return (
      <div className="mt-3 border border-primary/25 bg-primary/5 p-4">
        <div className="flex items-center justify-between gap-3"><p className="text-sm font-medium">{zh ? '请确认转写内容' : 'Review the transcript'}</p><span className="text-xs text-muted-foreground">{transcript.provider} · {transcript.confidence === null ? (zh ? '请人工确认' : 'Review required') : `${Math.round(transcript.confidence * 100)}%`}</span></div>
        <Textarea className="mt-3" value={editedText} onChange={(event) => setEditedText(event.target.value)} rows={2} />
        <p className="mt-2 text-xs text-muted-foreground">{zh ? '只有你确认后的文字会发送；原始录音不会长期保存。' : 'Only confirmed text is sent. Raw audio is not stored long term.'}</p>
        <div className="mt-3 flex gap-2"><Button type="button" size="sm" onClick={() => { onUseTranscript(editedText); discard() }} disabled={!editedText.trim()}>{zh ? '使用这段文字' : 'Use this text'}</Button><Button type="button" size="sm" variant="ghost" onClick={discard}><X />{zh ? '取消' : 'Cancel'}</Button></div>
      </div>
    )
  }

  return recording ? (
    <Button type="button" variant="destructive" disabled={disabled} onMouseUp={() => void stop()} onTouchEnd={() => void stop()} onClick={() => void stop()}><Square />{zh ? '松开并转写' : 'Release to transcribe'}</Button>
  ) : (
    <Button type="button" variant="outline" disabled={disabled || transcribing} onMouseDown={() => void start()} onTouchStart={() => void start()}>{transcribing ? <span>{zh ? '转写中' : 'Transcribing'}</span> : <><Mic />{zh ? '按住说话' : 'Hold to talk'}</>}</Button>
  )
}
