import { useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { Play, ChevronDown } from 'lucide-react'
import { PLAYBACK_RATES, rateLabel } from './usePlayback'

export function SpeedControl({ rate, onRate, disabled = false }: { rate: number; onRate: (r: number) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({})
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [wasDisabled, setWasDisabled] = useState(disabled)
  if (wasDisabled !== disabled) { setWasDisabled(disabled); if (disabled) setOpen(false) }
  function toggle() {
    if (!open) {
      const rect = buttonRef.current?.getBoundingClientRect()
      if (rect) setMenuStyle({ left: rect.left, top: rect.bottom + 5, width: rect.width })
    }
    setOpen(value => !value)
  }
  const options = open && createPortal(<div className="speed-options speed-options-portal" style={menuStyle} role="group" aria-label="选择播放倍速">
    {PLAYBACK_RATES.map(value => <button key={value} type="button" aria-pressed={rate === value} className={rate === value ? 'selected' : ''} onClick={() => { onRate(value); setOpen(false) }}>{rateLabel(value)}</button>)}
  </div>, document.body)
  return <div className="speed-control" onKeyDown={e => { if (e.key === 'Escape') setOpen(false) }}>
    <button ref={buttonRef} className="speed-button" type="button" disabled={disabled} aria-label={`播放倍速 ${rateLabel(rate)}`} aria-expanded={open} onClick={toggle}>{rateLabel(rate)}<ChevronDown size={12}/></button>
    {options}
  </div>
}
export default function Dialogue({ english, chinese, showChinese, onTranslation, onReplay, rate, onRate, busy = false, scene = false }: {
  english: string; chinese: string; showChinese: boolean; onTranslation: () => void; onReplay: () => void;
  rate: number; onRate: (rate: number) => void; busy?: boolean; scene?: boolean
}) {
  const isChineseLead = /[\u4e00-\u9fff]/.test(english)
  return <div className={`${scene ? 'scene-response' : 'dialogue-card'} morrow-dialogue`}>
    <p className={isChineseLead ? 'context-line' : 'english'}>{english}</p>
    {(showChinese || isChineseLead) && <p className="translation">{chinese}</p>}
    <div className="dialogue-tools">
      <button className="replay-button" type="button" disabled={busy} onClick={onReplay}><span className="play-disc"><Play/></span><span>重听</span></button>
      <SpeedControl rate={rate} onRate={onRate} disabled={busy}/>
      <button className="translation-button" type="button" onClick={onTranslation} disabled={isChineseLead} aria-expanded={showChinese || isChineseLead}>{showChinese || isChineseLead ? '收起中文' : '查看中文'}</button>
    </div>
  </div>
}
