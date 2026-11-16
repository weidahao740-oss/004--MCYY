import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { FixedContentLine } from '@english-pet/contracts'
import StoryLine from './StoryLine'

// One bubble stays in the original top-right position; every line remains accessible.
export default function StoryDialogue({ lines, token, muted, rate, onRate, stopSignal, stopPlayback }: {
  lines: FixedContentLine[]; token: string; muted: boolean; rate: number; onRate: (rate: number) => void
  stopSignal: number; stopPlayback: () => void
}) {
  const [index, setIndex] = useState(0)
  const currentIndex = Math.min(index, lines.length - 1)
  const line = lines[currentIndex]
  if (!line) return null
  function move(next: number) { stopPlayback(); setIndex(next) }
  return <div className="story-bubbles">
    <StoryLine key={line.id} line={line} token={token} muted={muted} rate={rate} onRate={onRate} stopSignal={stopSignal}>
      {lines.length > 1 && <div className="chapter-dialogue-pager" aria-label="当前对话">
        <button type="button" aria-label="上一句" disabled={currentIndex === 0} onClick={() => move(currentIndex - 1)}><ChevronLeft size={16}/></button>
        <span aria-live="polite">{currentIndex + 1} / {lines.length}</span>
        <button type="button" aria-label="下一句" disabled={currentIndex === lines.length - 1} onClick={() => move(currentIndex + 1)}><ChevronRight size={16}/></button>
      </div>}
    </StoryLine>
  </div>
}
