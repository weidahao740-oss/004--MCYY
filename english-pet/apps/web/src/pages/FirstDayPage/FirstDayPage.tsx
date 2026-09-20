import { useEffect, useMemo, useState } from 'react'
import type { FirstDayAction, FirstDayView, Memory, MemoryActionRequest } from '@english-pet/contracts'
import { ArrowRight, Check, Lightbulb, Save, Sprout, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { firstDayApi } from '@/api/first-day-api'
import { memoryApi } from '@/api/memory-api'
import { useAuth } from '@/auth/auth-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { currentLocale } from '@/i18n/copy'
import VoiceComposer from '@/pages/ChatPage/VoiceComposer'

function key() { return crypto.randomUUID() }

export default function FirstDayPage() {
  const { token, session, refreshSession } = useAuth()
  const navigate = useNavigate()
  const locale = currentLocale(session?.settings.interfaceLocale)
  const zh = locale === 'zh-CN'
  const [view, setView] = useState<FirstDayView | null>(null)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    firstDayApi.get(token).then((result) => { if (!cancelled) setView(result) }).catch(() => {
      if (!cancelled) toast.error(zh ? '暂时无法恢复首日进度。' : 'Could not restore first-day progress.')
    })
    return () => { cancelled = true }
  }, [token, zh])

  const progress = useMemo(() => {
    const states = ['FD00_ENTRY', 'FD01_WAKE', 'FD02_NAME', 'FD03_TODAY', 'FD04_UNDERSTOOD', 'FD05_RESTORE', 'FD06_MEMORY_REVIEW', 'FD07_JOURNAL', 'COMPLETED']
    return Math.max(0, states.indexOf(view?.state ?? 'FD00_ENTRY'))
  }, [view?.state])

  async function act(action: FirstDayAction, extras: { text?: string; object?: 'lamp' | 'plant' } = {}) {
    if (!token) return
    setBusy(true)
    try {
      const next = await firstDayApi.act(token, { action, ...extras, idempotencyKey: key() })
      setView(next)
      setDraft('')
      if (next.status === 'completed') await refreshSession()
    } catch {
      toast.error(zh ? '这一步尚未完成，请检查输入或先处理全部记忆提案。' : 'This step is not complete. Check your input or review every memory proposal.')
    } finally { setBusy(false) }
  }

  async function review(memory: Memory, action: MemoryActionRequest['action'], content?: string) {
    if (!token) return
    setBusy(true)
    try {
      await memoryApi.act(token, memory.id, {
        action,
        expectedVersion: memory.version,
        content: action === 'confirm' ? (content ?? memory.content) : undefined,
        idempotencyKey: key(),
      })
      setView(await firstDayApi.get(token))
    } catch {
      toast.error(zh ? '记忆审核未完成，请重试。' : 'Memory review did not complete. Try again.')
    } finally { setBusy(false) }
  }

  if (!session || !view) return null
  if (view.status === 'completed') return <main className="mx-auto max-w-3xl px-5 py-12"><section className="border border-card-border bg-card p-8 shadow-xl"><h1 className="font-serif text-4xl">{zh ? '第一束光已经留下' : 'The first light remains'}</h1><p className="mt-4 leading-7 text-muted-foreground">{zh ? 'Morrow 会在房间里承接你们共同完成的事情。' : 'Morrow will carry what you completed together into the room.'}</p><Button className="mt-7" onClick={() => navigate('/room')}>{zh ? '回到房间' : 'Go to the room'}<ArrowRight /></Button></section></main>

  const task = zh ? view.userTaskZh : view.userTaskEn
  return (
    <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-12">
      <header className="flex items-center justify-between gap-4"><div><p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">first-day-1.0</p><h1 className="mt-2 font-serif text-4xl">{zh ? '房间里的第一束光' : 'The first light in the room'}</h1></div><Badge variant="outline">{progress + 1}/8</Badge></header>
      <section className="mt-7 border border-card-border bg-card p-6 shadow-xl sm:p-9">
        <div className="space-y-3">{view.morrowLines.map((line) => <p key={line} className="border-l-2 border-primary pl-4 text-lg leading-8">{line}</p>)}</div>
        <p className="mt-6 text-sm text-muted-foreground">{task}</p>

        {view.state === 'FD00_ENTRY' && <Button className="mt-6" disabled={busy} onClick={() => void act('start')}><ArrowRight />{zh ? '开始相遇' : 'Begin'}</Button>}
        {view.state === 'FD01_WAKE' && <Button className="mt-6" disabled={busy} onClick={() => void act('continue')}>{zh ? '继续' : 'Continue'}<ArrowRight /></Button>}
        {view.state === 'FD02_NAME' && <div className="mt-6 space-y-3"><Input value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={30} placeholder={zh ? '名字或昵称' : 'Name or nickname'} /><div className="flex gap-2"><Button disabled={busy || !draft.trim()} onClick={() => void act('submit_name', { text: draft.trim() })}>{zh ? '使用这个称呼' : 'Use this name'}</Button><Button variant="ghost" disabled={busy} onClick={() => void act('skip_name')}>{zh ? '暂时跳过' : 'Skip for now'}</Button></div></div>}
        {view.state === 'FD03_TODAY' && <div className="mt-6 space-y-3"><div className="grid gap-2 sm:grid-cols-2"><Button variant="outline" className="h-auto py-3" onClick={() => setDraft('Today was busy.')}>Today was busy.</Button><Button variant="outline" className="h-auto py-3" onClick={() => setDraft("I'm a little tired today.")}>I'm a little tired today.</Button></div><Textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={zh ? '用一句英语说说今天。' : 'Share one thing about today in English.'} /><VoiceComposer token={token} zh={zh} enabled={session.settings.voiceInputEnabled} disabled={busy} onUseTranscript={setDraft} /><Button disabled={busy || !draft.trim()} onClick={() => void act('submit_today', { text: draft.trim() })}>{zh ? '发送表达' : 'Send expression'}<ArrowRight /></Button></div>}
        {view.state === 'FD04_UNDERSTOOD' && <div className="mt-6"><div className="border border-primary/20 bg-primary/5 p-4"><p className="text-xs text-muted-foreground">{zh ? 'Morrow 理解到' : 'Morrow understood'}</p><p className="mt-2">{view.understoodMeaning}</p></div><Button className="mt-4" disabled={busy} onClick={() => void act('confirm_understanding')}><Check />{zh ? '是的，你理解对了' : 'Yes, that is right'}</Button></div>}
        {view.state === 'FD05_RESTORE' && <div className="mt-6 grid gap-3 sm:grid-cols-2"><Button className="h-auto justify-start py-5" variant="secondary" disabled={busy} onClick={() => void act('select_object', { object: 'lamp' })}><Lightbulb />{zh ? '让窗边的灯回来' : 'Bring back the window lamp'}</Button><Button className="h-auto justify-start py-5" variant="secondary" disabled={busy} onClick={() => void act('select_object', { object: 'plant' })}><Sprout />{zh ? '让门边的植物回来' : 'Bring back the plant by the door'}</Button></div>}
        {view.state === 'FD06_MEMORY_REVIEW' && <div className="mt-6 space-y-4">{view.proposals.map((memory) => <FirstDayMemoryCard key={memory.id} memory={memory} zh={zh} busy={busy} onReview={review} />)}{view.proposals.length === 0 && <Button disabled={busy} onClick={() => void act('complete_memory_review')}>{zh ? '生成第一篇共同记忆' : 'Create the first shared memory'}<ArrowRight /></Button>}</div>}
        {view.state === 'FD07_JOURNAL' && view.journal && <div className="mt-6 space-y-4"><article className="border border-primary/25 bg-primary/5 p-5"><h2 className="font-serif text-2xl">{zh ? view.journal.titleZh : view.journal.title}</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><JournalField label={zh ? '发生了什么' : 'What happened'} value={view.journal.whatHappened} /><JournalField label={zh ? '你的表达' : 'What you said'} value={view.journal.whatUserSaid} /><JournalField label={zh ? '值得保留的表达' : 'A phrase worth keeping'} value={view.journal.naturalExpression} /><JournalField label={zh ? 'Morrow 被允许记住的内容' : 'What Morrow may remember'} value={view.journal.whatMorrowRemembers} /><JournalField label={zh ? '房间发生的变化' : 'What changed'} value={view.journal.worldChange} /></div></article><Button disabled={busy} onClick={() => void act('finish')}><Check />{zh ? '结束首日并回到房间' : 'Finish and return to the room'}</Button></div>}
      </section>
    </main>
  )
}

function JournalField({ label, value }: { label: string; value: string | null }) {
  return <div className="border border-border bg-card p-4"><p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{label}</p><p className="mt-2 leading-7">{value || '—'}</p></div>
}

function FirstDayMemoryCard({ memory, zh, busy, onReview }: { memory: Memory; zh: boolean; busy: boolean; onReview: (memory: Memory, action: MemoryActionRequest['action'], content?: string) => Promise<void> }) {
  const [content, setContent] = useState(memory.content)
  return <article className="border border-border p-4"><Badge>{memory.kind}</Badge><Input className="mt-3" value={content} onChange={(event) => setContent(event.target.value)} disabled={busy} /><p className="mt-2 text-xs text-muted-foreground">{zh ? '保存前可以修改；只有确认后的版本会进入后续对话。' : 'Edit before saving. Only the confirmed version enters future conversations.'}</p><div className="mt-3 flex gap-2"><Button size="sm" disabled={busy || !content.trim()} onClick={() => void onReview(memory, 'confirm', content.trim())}><Save />{zh ? '保存' : 'Save'}</Button><Button size="sm" variant="ghost" disabled={busy} onClick={() => void onReview(memory, 'reject')}><X />{zh ? '不保存' : "Don't save"}</Button></div></article>
}
