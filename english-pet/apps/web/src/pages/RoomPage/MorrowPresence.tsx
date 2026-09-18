import type { PetEmotion } from '@english-pet/contracts'
import { cn } from '@/lib/utils'

interface MorrowPresenceProps {
  emotion: PetEmotion
}

export default function MorrowPresence({ emotion }: MorrowPresenceProps) {
  return (
    <div className="relative grid h-64 place-items-center" aria-label={`Morrow · ${emotion}`}>
      <div className="absolute size-52 rounded-full border border-primary/10 bg-primary/5" />
      <div className="absolute size-36 rounded-full border border-primary/15" />
      <div className="morrow-breathe relative h-36 w-40">
        <div className="absolute left-5 top-1 size-16 rotate-[-22deg] rounded-[60%_10%_60%_50%] border border-primary/30 bg-card" />
        <div className="absolute right-5 top-1 size-16 rotate-[22deg] rounded-[10%_60%_50%_60%] border border-primary/30 bg-card" />
        <div className="absolute inset-x-3 bottom-0 top-7 rounded-[48%_48%_42%_42%] border border-primary/30 bg-card shadow-[0_20px_60px_hsl(174_42%_62%_/_0.08)]">
          <div className="absolute left-8 top-10 flex gap-10">
            <span className={cn('h-2.5 w-4 rounded-full bg-primary transition-transform', emotion === 'amused' && 'scale-y-50')} />
            <span className={cn('h-2.5 w-4 rounded-full bg-primary transition-transform', emotion === 'amused' && 'scale-y-50')} />
          </div>
          <div className={cn('absolute left-1/2 top-[4.6rem] h-px w-5 -translate-x-1/2 bg-primary/50', emotion === 'warm' && 'rotate-6', emotion === 'curious' && '-rotate-6')} />
        </div>
        <div className="absolute bottom-3 right-0 size-4 rounded-full bg-primary shadow-[0_0_24px_var(--primary)]" />
      </div>
    </div>
  )
}
