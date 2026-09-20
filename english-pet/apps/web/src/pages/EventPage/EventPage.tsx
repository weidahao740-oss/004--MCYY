import { useEffect, useMemo, useState } from 'react'
import type { EventActionRequest, EventCatalogItem, EventInstanceView, LanguageFeedback } from '@english-pet/contracts'
import { ArrowLeft, Check, CirclePause, LockKeyhole, Play, RotateCcw, Send } from 'lucide-react'
import { toast } from 'sonner'
import { eventApi } from '@/api/event-api'
import { useAuth } from '@/auth/auth-context'
import { LanguageFeedbackPanel } from '@/components/LanguageFeedbackPanel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { currentLocale } from '@/i18n/copy'

const statusCopy = {
  'zh-CN': { locked: '尚未解锁', available: '可以开始', active: '进行中', paused: '已暂停', completed: '已完成' },
  en: { locked: 'Locked', available: 'Available', active: 'In progress', paused: 'Paused', completed: 'Completed' },
} as const

function key() {
  return crypto.randomUUID()
}

export default function EventPage() {
  const { token, session } = useAuth()
  const locale = currentLocale(session?.settings.interfaceLocale)
  const zh = locale === 'zh-CN'
  const [catalog, setCatalog] = useState<EventCatalogItem[]>([])
  const [instance, setInstance] = useState<EventInstanceView | null>(null)
  const [text, setText] = useState('')
  const [notice, setNotice] = useState('')
  const [feedback, setFeedback] = useState<LanguageFeedback | null>(null)
  const [resurfacingHandled, setResurfacingHandled] = useState(false)
  const [busy, setBusy] = useState(false)

  async function refresh() {
    if (!token) return
    const [list, current] = await Promise.all([eventApi.catalog(token), eventApi.current(token)])
    setCatalog(list.events)
    setInstance(current.instance)
  }

  useEffect(() => {
    if (!token) return
    let cancelled = false
    Promise.all([eventApi.catalog(token), eventApi.current(token)])
      .then(([list, current]) => {
        if (cancelled) return
        setCatalog(list.events)
        setInstance(current.instance)
      })
      .catch(() => {
        if (!cancelled) toast.error(zh ? '事件暂时没有回应，请稍后再试。' : 'Events are quiet for a moment.')
      })
    return () => { cancelled = true }
  }, [token, zh])

  const acceptsText = instance?.allowedActions.some((action) => action === 'submit' || action === 'clarify') ?? false
  const canContinue = instance?.allowedActions.some((action) => action === 'continue' || action === 'complete') ?? false
  const canDecline = instance?.allowedActions.includes('decline') ?? false
  const showOutcomes = instance?.allowedActions.includes('confirm') && instance.currentState.phase === 'choice' && instance.availableOutcomes.length > 0
  const canConfirm = instance?.allowedActions.includes('confirm') ?? false
  const progress = useMemo(() => instance ? `${instance.currentState.phase} · ${instance.currentState.id}` : '', [instance])

  async function start(eventKey: string) {
    if (!token) return
    setBusy(true)
    try {
      setInstance(await eventApi.start(token, { eventKey, idempotencyKey: key() }))
      setNotice('')
      setFeedback(null)
      setResurfacingHandled(false)
      await refresh()
    } catch {
      toast.error(zh ? '这个事件还不能开始。' : 'This event cannot start yet.')
    } finally {
      setBusy(false)
    }
  }

  async function act(action: EventActionRequest['action'], choiceId?: string, submittedText?: string) {
    if (!token || !instance) return
    setBusy(true)
    try {
      const response = await eventApi.act(token, instance.instanceId, {
        action,
        inputMode: choiceId ? 'choice' : submittedText ? 'text' : 'continue',
        text: submittedText,
        choiceId,
        idempotencyKey: key(),
      })
      setInstance(response.instance)
      setNotice(zh ? response.messageZh : response.message)
      setFeedback(response.feedback)
      setText('')
      if (response.outcome) setCatalog((await eventApi.catalog(token)).events)
    } catch {
      toast.error(zh ? '这一步没有推进。请换一种表达，或先暂停。' : 'That step did not advance. Try another expression or pause.')
    } finally {
      setBusy(false)
    }
  }

  async function handleResurfacing(result: 'declined' | 'ignored') {
    if (!token || !instance?.resurfacingPrompt) return
    setBusy(true)
    try {
      setInstance(await eventApi.recordResurfacing(token, instance.instanceId, { result, idempotencyKey: key() }))
      setResurfacingHandled(true)
    } catch {
      toast.error(zh ? '这条表达已不再可用，事件可以继续。' : 'That expression is no longer available. You can continue the event.')
    } finally {
      setBusy(false)
    }
  }

  if (!session) return null

  if (!instance) {
    return (
      <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">事件集 v1.0.0</p>
          <h1 className="mt-3 font-serif text-4xl">{zh ? '共同生活事件' : 'Shared life events'}</h1>
          <p className="mt-4 leading-7 text-muted-foreground">{zh ? '每次只进行一个事件。暂停不会扣分，误解只会触发一次轻量澄清。' : 'Only one event runs at a time. Pausing has no penalty, and misunderstandings lead to a light clarification.'}</p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {catalog.map((event, index) => (
            <article key={event.eventKey} className="border border-card-border bg-card p-6 shadow-lg">
              <div className="flex items-start justify-between gap-4">
                <div><p className="font-mono text-xs text-muted-foreground">0{index + 1}</p><h2 className="mt-2 font-serif text-2xl">{zh ? event.titleZh : event.title}</h2></div>
                <Badge variant={event.status === 'available' ? 'default' : 'outline'}>{statusCopy[locale][event.status]}</Badge>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">{event.estimatedMinutes.min}—{event.estimatedMinutes.max} {zh ? '分钟' : 'minutes'}</p>
              <Button className="mt-6 w-full" disabled={busy || event.status === 'locked' || event.status === 'completed'} onClick={() => void start(event.eventKey)}>
                {event.status === 'locked' ? <LockKeyhole /> : event.status === 'paused' ? <Play /> : <Play />}
                {event.status === 'paused' ? (zh ? '继续事件' : 'Resume') : (zh ? '进入事件' : 'Open event')}
              </Button>
            </article>
          ))}
        </div>
        <p className="mt-6 text-xs text-muted-foreground">{zh ? '事件解锁与 first-day-1.0 的真实完成状态相连；每完成一个事件，下一事件会按规则自然解锁。' : 'Event unlocks are connected to the real first-day-1.0 completion state; completing one event unlocks the next according to the shared rules.'}</p>
      </main>
    )
  }

  const completed = instance.status === 'completed'
  return (
    <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => { setInstance(null); void refresh() }}><ArrowLeft />{zh ? '事件目录' : 'Event list'}</Button>
        <Badge variant="outline">{progress}</Badge>
      </div>

      <section className="mt-6 border border-card-border bg-card p-6 shadow-xl sm:p-9">
        <div className="flex items-start justify-between gap-4">
          <div><p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">{instance.eventKey}</p><h1 className="mt-3 font-serif text-3xl">Morrow</h1></div>
          <Badge>{statusCopy[locale][instance.status]}</Badge>
        </div>

        <div className="mt-8 space-y-3">
          {instance.currentState.lines.map((line) => <p key={line.id} className="border-l-2 border-primary pl-4 text-lg leading-8">{line.text}</p>)}
        </div>
        <p className="mt-6 text-sm text-muted-foreground">{zh ? '你要做的事：' : 'Your task: '}{instance.currentState.userTask}</p>
        {notice && <p className="mt-5 border border-primary/20 bg-primary/5 p-4 text-sm">{notice}</p>}
        {!completed && acceptsText && instance.resurfacingPrompt && !resurfacingHandled && (
          <aside className="mt-6 border border-primary/25 bg-primary/5 p-4" aria-label={zh ? '可选旧表达' : 'Optional saved expression'}>
            <div className="flex items-start gap-3">
              <RotateCcw className="mt-0.5 size-4 shrink-0 text-primary" />
              <div className="flex-1">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{zh ? '一条自然出现的旧表达' : 'A saved expression that fits here'}</p>
                <p className="mt-2 text-sm leading-6">{zh ? instance.resurfacingPrompt.promptZh : instance.resurfacingPrompt.prompt}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => setText(instance.resurfacingPrompt?.expression ?? '')}>{zh ? '放入输入框' : 'Use in reply'}</Button>
                  <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => void handleResurfacing('declined')}>{zh ? '这次不用' : 'Not this time'}</Button>
                </div>
              </div>
            </div>
          </aside>
        )}
        {completed && feedback && <LanguageFeedbackPanel feedback={feedback} locale={locale} />}

        {!completed && instance.currentState.referenceReplies.length > 0 && (
          <div className="mt-6 grid gap-2">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{zh ? '可编辑参考表达' : 'Editable reference replies'}</p>
            {instance.currentState.referenceReplies.map((reply) => <Button key={reply.id} variant="outline" className="h-auto justify-start whitespace-normal py-3 text-left" onClick={() => setText(reply.text)}>{reply.text}</Button>)}
          </div>
        )}

        {!completed && showOutcomes && (
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            {instance.availableOutcomes.map((outcome) => (
              <Button key={outcome.id} variant={instance.selectedOutcomeId === outcome.id ? 'default' : 'secondary'} className="h-auto py-3" disabled={busy} onClick={() => void act('confirm', outcome.id)}>
                <Check />{outcome.label}
              </Button>
            ))}
          </div>
        )}

        {!completed && acceptsText && (
          <div className="mt-6 space-y-3">
            <Textarea value={text} onChange={(event) => setText(event.target.value)} placeholder={zh ? '用英语写下你的意思；发送前可以自由修改。' : 'Write what you mean in English. You can edit before sending.'} />
            <Button disabled={busy || !text.trim()} onClick={() => void act(instance.currentState.phase === 'clarification' ? 'clarify' : 'submit', undefined, text.trim())}><Send />{zh ? '发送表达' : 'Send expression'}</Button>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3 border-t border-border pt-6">
          {!completed && canContinue && <Button disabled={busy} onClick={() => void act(instance.allowedActions.includes('complete') ? 'complete' : 'continue')}><Play />{instance.allowedActions.includes('complete') ? (zh ? '确认结果' : 'Confirm result') : (zh ? '继续' : 'Continue')}</Button>}
          {!completed && canConfirm && !showOutcomes && <Button disabled={busy} onClick={() => void act('confirm')}><Check />{zh ? '确认理解' : 'Confirm understanding'}</Button>}
          {!completed && canDecline && <Button variant="secondary" disabled={busy} onClick={() => void act('decline')}>{zh ? '跳过 / 暂不进行' : 'Skip or not now'}</Button>}
          {!completed && instance.allowedActions.includes('pause') && <Button variant="outline" disabled={busy} onClick={() => void act('pause')}><CirclePause />{zh ? '暂停，稍后继续' : 'Pause and return later'}</Button>}
          {completed && <Button onClick={() => { setInstance(null); void refresh() }}><Check />{zh ? '查看下一个事件' : 'See next event'}</Button>}
        </div>
      </section>
    </main>
  )
}
