import { useState, type ReactNode } from 'react'
import { ChevronDown, Play } from 'lucide-react'

export function SpeedControl({ rate, onRate, disabled = false }: {
  rate: number; onRate: (rate: number) => void; disabled?: boolean
}) {
  return <label className="speed-control chapter-speed-control">
    <span className="speed-button" aria-hidden="true">{rate === 1 ? '正常' : `${rate}×`}<ChevronDown size={12}/></span>
    <select aria-label="播放倍速" value={rate} disabled={disabled} onChange={event => onRate(Number(event.target.value))}>
      <option value={1}>正常</option><option value={0.8}>0.8 倍</option><option value={0.6}>0.6 倍</option>
    </select>
  </label>
}

export default function Dialogue({ english, chinese, rate, onRate, onReplay, playbackDisabled = true, playing = false, note, children }: {
  english: string; chinese?: string; rate: number; onRate: (rate: number) => void
  onReplay?: () => void; playbackDisabled?: boolean; playing?: boolean; note?: string; children?: ReactNode
}) {
  const [showChinese, setShowChinese] = useState(false)
  const chineseLead = /[\u4e00-\u9fff]/.test(english)
  return <div className="morrow-dialogue">
    <p className={chineseLead ? 'context-line' : 'english'} lang={chineseLead ? 'zh-CN' : 'en'}>{english}</p>
    {chinese && (chineseLead || showChinese) && <p className="translation">{chinese}</p>}
    {onReplay && <div className="dialogue-tools">
      <button className="replay-button" type="button" disabled={playbackDisabled} onClick={onReplay}><span className="play-disc"><Play/></span><span>{playing ? '停止' : '重听'}</span></button>
      <SpeedControl rate={rate} onRate={onRate}/>
      <button className="translation-button" type="button" disabled={!chinese || chineseLead} aria-expanded={chineseLead || showChinese} onClick={() => setShowChinese(value => !value)}>{chineseLead || showChinese ? '收起中文' : '查看中文'}</button>
    </div>}
    {note && <p className="chapter-audio-note" role="status">{note}</p>}
    {children}
  </div>
}
