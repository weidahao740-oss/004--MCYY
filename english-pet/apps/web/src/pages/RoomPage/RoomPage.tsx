import { useEffect, useState } from 'react'
import type { EventCatalogItem, PetAction, PetHomeResponse } from '@english-pet/contracts'
import { Link } from 'react-router-dom'
import { Ear, Hand, LockKeyhole, Moon, TimerReset } from 'lucide-react'
import { toast } from 'sonner'
import { accountApi } from '@/api/account-api'
import { eventApi } from '@/api/event-api'
import { useAuth } from '@/auth/auth-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { currentLocale, getCopy } from '@/i18n/copy'
import MorrowPresence from './MorrowPresence'

function statusCopyForRoom(status: EventCatalogItem['status'], locale: 'zh-CN' | 'en') {
  const copy = {
    'zh-CN': { locked: '尚未解锁', available: '可以开始', active: '进行中', paused: '已暂停', completed: '已完成' },
    en: { locked: 'Locked', available: 'Available', active: 'In progress', paused: 'Paused', completed: 'Completed' },
  } as const
  return copy[locale][status]
}

export default function RoomPage() {
  const { session, token } = useAuth()
  const [home, setHome] = useState<PetHomeResponse | null>(null)
  const [todayEvent, setTodayEvent] = useState<EventCatalogItem | null>(null)
  const [busyAction, setBusyAction] = useState<PetAction | null>(null)
  const locale = currentLocale(session?.settings.interfaceLocale)
  const t = getCopy(locale)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    Promise.all([accountApi.petHome(token), eventApi.catalog(token)]).then(([value, eventCatalog]) => {
      if (cancelled) return
      setHome(value)
      setTodayEvent(eventCatalog.events.find((event) => event.status === 'active' || event.status === 'paused' || event.status === 'available') ?? null)
    }).catch(() => {
      if (!cancelled) toast.error(t.connectionQuiet)
    })
    return () => { cancelled = true }
  }, [token, t.connectionQuiet])

  if (!session) return null

  async function act(action: PetAction) {
    if (!token) return
    setBusyAction(action)
    try {
      setHome(await accountApi.petAction(token, action))
    } catch {
      toast.error(t.connectionQuiet)
    } finally {
      setBusyAction(null)
    }
  }

  const status = home?.home
  const eventTitle = todayEvent ? (locale === 'en' ? todayEvent.title : todayEvent.titleZh) : '—'

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
      <div className="grid gap-8 lg:grid-cols-[1.05fr_.95fr]">
        <section className="flex flex-col justify-between border border-card-border bg-card p-6 shadow-xl sm:p-9">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline">{session.user.accountKind === 'guest' ? t.deviceOnly : t.accountSynced}</Badge>
              <span className="text-sm text-muted-foreground">{t.relationshipNew}</span>
            </div>
            <p className="mt-8 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Morrow / {t.roomState}</p>
            <h1 className="mt-3 font-serif text-5xl leading-tight">Morrow</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {locale === 'en' ? status?.statusTextEn : status?.statusTextZh}
            </p>
            <p className="mt-6 max-w-xl border-l-2 border-primary pl-4 text-base leading-7">
              {locale === 'en' ? status?.returnMessageEn : status?.returnMessageZh}
            </p>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            <Button type="button" variant="secondary" disabled={busyAction !== null} onClick={() => void act('greet')}><Hand />{t.greet}</Button>
            <Button type="button" variant="secondary" disabled={busyAction !== null} onClick={() => void act('listen')}><Ear />{t.listen}</Button>
            <Button type="button" variant="secondary" disabled={busyAction !== null} onClick={() => void act('rest')}><Moon />{t.rest}</Button>
          </div>
        </section>

        <aside className="relative overflow-hidden border border-card-border bg-card p-6 shadow-xl sm:p-8">
          <div className="absolute inset-x-0 top-0 h-px bg-primary/60" />
          <MorrowPresence emotion={status?.emotion ?? 'calm'} />
          <div className="border-t border-border pt-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">{t.todayEvent}</p>
                <h2 className="mt-2 font-serif text-2xl">{eventTitle ?? '—'}</h2>
              </div>
              {todayEvent && <Badge>{statusCopyForRoom(todayEvent.status, locale)}</Badge>}
            </div>
            {todayEvent && (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <TimerReset className="size-4" /> {todayEvent.estimatedMinutes.min}—{todayEvent.estimatedMinutes.max} {t.minutes}
              </div>
            )}
            <p className="mt-5 border-t border-border pt-5 text-sm text-muted-foreground">
              {locale === 'en'
                ? 'Shared life events are now available. They use the same versioned event rules as the server.'
                : '共同生活事件已经接通；页面与服务端使用同一份版本化事件规则。'}
            </p>
            <Button asChild className="mt-5 w-full"><Link to={session.pet.firstDayStatus === 'completed' ? '/events' : '/first-day'}>{session.pet.firstDayStatus === 'completed' ? (locale === 'en' ? 'Open shared events' : '进入共同生活事件') : (locale === 'en' ? 'Begin or continue the first meeting' : '开始或继续首日相遇')}</Link></Button>
            <div className="mt-5 flex items-start gap-3 border-t border-border pt-5 text-sm text-muted-foreground">
              <LockKeyhole className="mt-0.5 size-4 shrink-0" />{t.memoryNotice}
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}
