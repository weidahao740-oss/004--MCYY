import { useEffect, useState } from 'react'
import type { FixedEventCatalogItem, FixedEventInstanceView } from '@english-pet/contracts'
import { ArrowLeft, Check, Loader2, LockKeyhole, Play, Send } from 'lucide-react'
import { toast } from 'sonner'
import { fixedEventApi } from '@/api/fixed-event-api'
import { useAuth } from '@/auth/auth-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { LearningLine, setActivePlaybackRate } from './LearningLine'
import VoiceComposer from '@/pages/ChatPage/VoiceComposer'

const playbackRates = [1, 0.8, 0.6] as const
const playbackRateLabels: Record<number, string> = {
  1: '1.0×',
  0.8: '0.8×',
  0.6: '0.6×',
}

const catalogStatusCopy = {
  available: '可以开始',
  completed: '已完成',
  locked: '尚未解锁',
} as const

const DAILY_TOPIC_CHAPTER = 'chapter_daily_talk'

const instanceStatusCopy = {
  active: '进行中',
  completed: '已完成',
  paused: '已暂停',
} as const

function key() {
  return crypto.randomUUID()
}

export default function FixedEventPage() {
  const { token } = useAuth()
  const [catalog, setCatalog] = useState<FixedEventCatalogItem[]>([])
  const [instance, setInstance] = useState<FixedEventInstanceView | null>(null)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [playbackRate, setPlaybackRate] = useState<number>(1)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [advanceError, setAdvanceError] = useState<string | null>(null)

  function choosePlaybackRate(rate: number) {
    setPlaybackRate(rate)
    setActivePlaybackRate(rate)
  }

  async function refresh() {
    if (!token) return
    const [list, current] = await Promise.all([fixedEventApi.catalog(token), fixedEventApi.current(token)])
    setCatalog(list.events)
    setInstance(current.instance)
  }

  // 首屏拉目录+当前事件；失败进入错误卡片，可点重试再次执行。
  async function loadInitial() {
    if (!token) return
    setLoading(true)
    setLoadError(null)
    try {
      const [list, current] = await Promise.all([fixedEventApi.catalog(token), fixedEventApi.current(token)])
      setCatalog(list.events)
      setInstance(current.instance)
    } catch {
      setLoadError('暂时连不上事件')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!token) return
    void loadInitial()
  }, [token])

  if (!token) return null

  if (loading) {
    return (
      <main className="mx-auto flex max-w-5xl flex-col items-center justify-center px-5 py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">正在准备事件…</p>
      </main>
    )
  }

  if (loadError) {
    return (
      <main className="mx-auto max-w-5xl px-5 py-24">
        <div className="mx-auto max-w-md border border-card-border bg-card p-8 text-center shadow-lg">
          <h1 className="font-serif text-2xl">暂时连不上事件</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            可能是网络慢或服务暂时没响应，你的内容不会丢。
          </p>
          <Button className="mt-6 w-full" onClick={() => void loadInitial()}>
            重试
          </Button>
        </div>
      </main>
    )
  }

  async function start(eventId: string) {
    if (!token) return
    setBusy(true)
    try {
      const view = await fixedEventApi.start(token, eventId, key())
      setInstance(view)
      setText('')
      await refresh()
    } catch {
      toast.error('这个事件现在还不能开始。')
    } finally {
      setBusy(false)
    }
  }

  async function advance(input: Parameters<typeof fixedEventApi.advance>[2]) {
    if (!token || !instance) return
    setBusy(true)
    try {
      const view = await fixedEventApi.advance(token, instance.instanceId, input)
      setInstance(view)
      setAdvanceError(null)
      if (input.inputMode === 'text') {
        if (view.advanced) setText('')
      }
    } catch {
      setAdvanceError(
        input.inputMode === 'text'
          ? '这一步没走成，你的英文还在输入框里，改一下再发，或直接点发送重试。'
          : '这一步没走成，再点一次试试。',
      )
    } finally {
      setBusy(false)
    }
  }

  function pickChoice(choiceId: string) {
    void advance({ inputMode: 'choice', choiceId, idempotencyKey: key() })
  }

  function sendText() {
    const value = text.trim()
    if (!value) return
    void advance({ inputMode: 'text', text: value, idempotencyKey: key() })
  }

  async function backToCatalog() {
    setInstance(null)
    setText('')
    await refresh()
  }

  // ── 目录视图 ─────────────────────────────────────────────────────────────
  if (!instance) {
    return (
      <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">固定内容事件 v1.0.0</p>
          <h1 className="mt-3 font-serif text-4xl">共同生活事件</h1>
          <p className="mt-4 leading-7 text-muted-foreground">每次只进行一个事件；主线按顺序解锁，日常话题可以反复聊，会自动换着来，不连着同一个。</p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {catalog.map((event) => (
            <article key={event.eventId} className="border border-card-border bg-card p-6 shadow-lg">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">
                    {event.sequence} · v{event.version}
                    {event.chapterId === DAILY_TOPIC_CHAPTER ? ' · 日常话题' : ''}
                  </p>
                  <h2 className="mt-2 font-serif text-2xl">{event.titleZh}</h2>
                  {event.recommendedNext && (
                    <Badge variant="default" className="mt-2">推荐今天聊这个</Badge>
                  )}
                </div>
                <Badge variant={event.status === 'available' ? 'default' : 'outline'}>
                  {catalogStatusCopy[event.status]}
                </Badge>
              </div>
              <Button
                className="mt-6 w-full"
                disabled={busy || event.status === 'locked' || event.status === 'completed'}
                onClick={() => void start(event.eventId)}
              >
                {event.status === 'locked' ? <LockKeyhole /> : <Play />}
                {event.status === 'completed' ? '已完成' : '进入事件'}
              </Button>
            </article>
          ))}
        </div>
        <p className="mt-6 text-xs text-muted-foreground">事件解锁与真实完成状态相连；每完成一个事件，下一事件会按规则自然解锁。</p>
      </main>
    )
  }

  // ── 进行中视图 ────────────────────────────────────────────────────────────
  const completed = instance.status === 'completed'
  const state = instance.currentState
  const renderLines = instance.resultLines.length > 0 ? instance.resultLines : state.lines
  const acceptsText = state.acceptedInputModes.includes('text') || state.acceptedInputModes.includes('confirmed_asr_text')
  const candidates = (instance.candidates ?? []).slice(0, 3)

  return (
    <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => void backToCatalog()}>
          <ArrowLeft />
          事件目录
        </Button>
        <Badge variant="outline">
          {state.phase} · {state.id}
        </Badge>
      </div>

      <section className="mt-6 border border-card-border bg-card p-6 shadow-xl sm:p-9">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
              {instance.eventId} v{instance.eventVersion}
            </p>
            <h1 className="mt-3 break-words font-serif text-3xl">{instance.titleZh}</h1>
          </div>
          <div className="flex min-w-0 flex-col items-end gap-2">
            <Badge>{instanceStatusCopy[instance.status]}</Badge>
            {instance.outcome && <Badge variant="outline">{instance.outcome.labelZh}</Badge>}
            <div className="flex flex-wrap items-center justify-end gap-1">
              <span className="mr-1 text-xs text-muted-foreground">语速</span>
              {playbackRates.map((rate) => (
                <Button
                  key={rate}
                  type="button"
                  size="sm"
                  variant={playbackRate === rate ? 'secondary' : 'outline'}
                  onClick={() => choosePlaybackRate(rate)}
                >
                  {playbackRateLabels[rate]}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <h2 className="mt-8 font-serif text-xl">{state.uiTitleZh}</h2>
        <p className="mt-2 text-sm text-muted-foreground">你要做的事：{state.userTaskZh}</p>

        <div className="mt-6 space-y-4">
          {renderLines.map((line) => (
            <LearningLine key={line.id} line={line} token={token} playbackRate={playbackRate} />
          ))}
        </div>

        {instance.messageZh && (
          <p className="mt-5 border border-primary/20 bg-primary/5 p-4 text-sm">{instance.messageZh}</p>
        )}

        {candidates.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {candidates.map((candidate) => {
              const choice = state.choices.find((item) => item.submitsIntentId === candidate.intentId)
              if (choice) {
                return (
                  <Button
                    key={candidate.intentId}
                    variant="secondary"
                    size="sm"
                    disabled={busy || completed}
                    onClick={() => pickChoice(choice.id)}
                  >
                    {candidate.labelZh}
                  </Button>
                )
              }
              return (
                <span
                  key={candidate.intentId}
                  className="inline-flex items-center rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                >
                  {candidate.labelZh}
                </span>
              )
            })}
          </div>
        )}

        {advanceError && (
          <p className="mt-6 rounded-md border border-border bg-muted px-4 py-3 text-sm leading-6">{advanceError}</p>
        )}

        {!completed && state.referenceReplyLines.length > 0 && (
          <div className="mt-6 grid gap-2">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">可参考的表达</p>
            {state.referenceReplyLines.map((reply) => (
              <Button
                key={reply.id}
                variant="outline"
                className="h-auto justify-start whitespace-normal break-words py-3 text-left"
                onClick={() => setText(reply.learningContent.english)}
              >
                {reply.learningContent.english}
              </Button>
            ))}
          </div>
        )}

        {!completed && state.choices.length > 0 && (
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            {state.choices.map((choice) => (
              <Button key={choice.id} variant="secondary" className="h-auto py-3" disabled={busy} onClick={() => pickChoice(choice.id)}>
                {choice.labelZh}
              </Button>
            ))}
          </div>
        )}

        {!completed && acceptsText && (
          <div className="mt-6 space-y-3">
            <Textarea
              value={text}
              onChange={(event) => {
                setText(event.target.value)
                setAdvanceError(null)
              }}
              placeholder="用英语写下你的意思；发送前可以自由修改。"
            />
            <VoiceComposer token={token} zh={true} enabled disabled={busy} onUseTranscript={(value) => setText(value)} />
            <Button disabled={busy || !text.trim()} onClick={() => sendText()}>
              <Send />
              发送
            </Button>
          </div>
        )}

        {completed && (
          <div className="mt-8 flex flex-wrap gap-3 border-t border-border pt-6">
            <p className="w-full text-sm text-muted-foreground">这个事件已经完成。</p>
            <Button onClick={() => void backToCatalog()}>
              <Check />
              回到事件目录
            </Button>
          </div>
        )}
      </section>
    </main>
  )
}
