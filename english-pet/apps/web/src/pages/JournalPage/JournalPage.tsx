import { useEffect, useState } from 'react'
import type { JournalActionRequest, JournalEditPatch, JournalEntry } from '@english-pet/contracts'
import { BookHeart, Eye, EyeOff, Pencil, Save, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { journalApi } from '@/api/journal-api'
import { useAuth } from '@/auth/auth-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { currentLocale } from '@/i18n/copy'

function key() {
  return crypto.randomUUID()
}

export default function JournalPage() {
  const { token, session } = useAuth()
  const locale = currentLocale(session?.settings.interfaceLocale)
  const zh = locale === 'zh-CN'
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)

  async function refresh() {
    if (!token) return
    setEntries((await journalApi.list(token)).entries)
  }

  useEffect(() => {
    if (!token) return
    let cancelled = false
    journalApi.list(token).then((result) => {
      if (!cancelled) setEntries(result.entries)
    }).catch(() => {
      if (!cancelled) toast.error(zh ? '暂时无法读取共同记忆。' : 'Shared memories are unavailable for a moment.')
    })
    return () => { cancelled = true }
  }, [token, zh])

  async function act(entry: JournalEntry, action: JournalActionRequest['action'], patch?: JournalEditPatch) {
    if (!token) return
    setBusyId(entry.id)
    try {
      await journalApi.act(token, entry.id, { action, expectedVersion: entry.version, patch, idempotencyKey: key() })
      await refresh()
      toast.success(zh ? '共同记忆已更新。' : 'Shared memory updated.')
    } catch {
      toast.error(zh ? '内容已变化或当前操作不可用，请刷新后再试。' : 'The entry changed or this action is unavailable. Refresh and try again.')
    } finally {
      setBusyId(null)
    }
  }

  if (!session) return null

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
      <div className="max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">shared journal</p>
        <h1 className="mt-3 font-serif text-4xl">{zh ? '共同记忆册' : 'Shared journal'}</h1>
        <p className="mt-4 leading-7 text-muted-foreground">{zh ? '每篇记录只使用已经结算的事件事实。删除记录不会删除长期记忆；两者需要分别管理。' : 'Each entry uses only settled event facts. Deleting an entry does not delete long-term memory; they are controlled separately.'}</p>
      </div>

      <div className="mt-9 grid gap-5">
        {entries.length === 0 ? (
          <div className="flex min-h-40 items-center gap-3 border border-dashed border-border p-7 text-sm text-muted-foreground"><BookHeart className="size-5 shrink-0" />{zh ? '完成一个生活事件后，这里会生成第一篇共同记忆。' : 'Complete a life event to create the first shared entry.'}</div>
        ) : entries.map((entry) => (
          <JournalCard key={entry.id} entry={entry} locale={locale} busy={busyId === entry.id} onAction={act} />
        ))}
      </div>
      <p className="mt-6 text-xs text-muted-foreground">{zh ? '开发说明：当前日记使用服务端内存存储，API 重启会清空；正式持久化待 PostgreSQL 接入。' : 'Development note: entries currently use server memory and reset when the API restarts; PostgreSQL persistence is still pending.'}</p>
    </main>
  )
}

interface JournalCardProps {
  entry: JournalEntry
  locale: 'zh-CN' | 'en'
  busy: boolean
  onAction: (entry: JournalEntry, action: JournalActionRequest['action'], patch?: JournalEditPatch) => Promise<void>
}

function JournalCard({ entry, locale, busy, onAction }: JournalCardProps) {
  const zh = locale === 'zh-CN'
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({
    whatHappened: entry.whatHappened,
    whatUserSaid: entry.whatUserSaid ?? '',
    naturalExpression: entry.naturalExpression ?? '',
    whatMorrowRemembers: entry.whatMorrowRemembers ?? '',
  })
  const hidden = entry.visibility === 'hidden'

  function save() {
    const patch: JournalEditPatch = {
      whatHappened: draft.whatHappened.trim(),
      whatUserSaid: draft.whatUserSaid.trim() || null,
      naturalExpression: draft.naturalExpression.trim() || null,
    }
    if (entry.linkedMemoryId && draft.whatMorrowRemembers.trim()) patch.whatMorrowRemembers = draft.whatMorrowRemembers.trim()
    void onAction(entry, 'edit', patch)
    setEditing(false)
  }

  return <Card className={hidden ? 'opacity-70' : ''}>
    <CardHeader>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><Badge variant="outline">{entry.eventKey}</Badge><CardTitle className="mt-3 font-serif text-2xl">{zh ? entry.titleZh : entry.title}</CardTitle><CardDescription className="mt-1">{new Date(entry.createdAt).toLocaleString(locale)}</CardDescription></div>
        <Badge variant={hidden ? 'outline' : 'default'}>{hidden ? (zh ? '已隐藏' : 'Hidden') : (zh ? '可见' : 'Visible')}</Badge>
      </div>
    </CardHeader>
    <CardContent className="space-y-5">
      {editing ? <JournalEditor entry={entry} draft={draft} setDraft={setDraft} locale={locale} /> : <JournalContent entry={entry} locale={locale} />}
      <div className="flex flex-wrap gap-2 border-t border-border pt-5">
        {editing ? <><Button size="sm" disabled={busy || !draft.whatHappened.trim()} onClick={save}><Save />{zh ? '保存修改' : 'Save edit'}</Button><Button size="sm" variant="ghost" onClick={() => setEditing(false)}><X />{zh ? '取消' : 'Cancel'}</Button></> : <><Button size="sm" variant="outline" disabled={busy} onClick={() => setEditing(true)}><Pencil />{zh ? '编辑' : 'Edit'}</Button><Button size="sm" variant="outline" disabled={busy} onClick={() => void onAction(entry, hidden ? 'restore' : 'hide')}>{hidden ? <Eye /> : <EyeOff />}{hidden ? (zh ? '恢复显示' : 'Restore') : (zh ? '隐藏' : 'Hide')}</Button><Button size="sm" variant="ghost" disabled={busy} onClick={() => { if (window.confirm(zh ? '删除这篇共同记忆？长期记忆不会随之删除。' : 'Delete this entry? Linked long-term memories will remain.')) void onAction(entry, 'delete') }}><Trash2 />{zh ? '删除记录' : 'Delete entry'}</Button></>}
      </div>
    </CardContent>
  </Card>
}

function JournalContent({ entry, locale }: { entry: JournalEntry; locale: 'zh-CN' | 'en' }) {
  const zh = locale === 'zh-CN'
  return <div className="grid gap-4 sm:grid-cols-2">
    <Field label={zh ? '发生了什么' : 'What happened'} value={entry.whatHappened} />
    <Field label={zh ? '世界变化' : 'World change'} value={entry.worldChange} />
    <Field label={zh ? '你的原表达' : 'What you said'} value={entry.whatUserSaid} />
    <Field label={zh ? '更自然的表达' : 'A natural expression'} value={entry.naturalExpression} />
    <Field label={zh ? '发音提醒' : 'Pronunciation note'} value={entry.pronunciationNote} empty={zh ? '没有必要的发音提醒。' : 'No necessary pronunciation note.'} />
    <Field label={zh ? 'Morrow 保存的记忆' : 'What Morrow saved'} value={entry.whatMorrowRemembers} empty={zh ? '相关关系记忆尚未确认，或已暂停/删除。' : 'The related memory is unconfirmed, paused, or deleted.'} />
  </div>
}

function JournalEditor({ entry, draft, setDraft, locale }: { entry: JournalEntry; draft: { whatHappened: string; whatUserSaid: string; naturalExpression: string; whatMorrowRemembers: string }; setDraft: React.Dispatch<React.SetStateAction<{ whatHappened: string; whatUserSaid: string; naturalExpression: string; whatMorrowRemembers: string }>>; locale: 'zh-CN' | 'en' }) {
  const zh = locale === 'zh-CN'
  return <div className="grid gap-4">
    <label className="space-y-2"><span className="text-sm text-muted-foreground">{zh ? '发生了什么' : 'What happened'}</span><Textarea value={draft.whatHappened} onChange={(event) => setDraft((value) => ({ ...value, whatHappened: event.target.value }))} /></label>
    <label className="space-y-2"><span className="text-sm text-muted-foreground">{zh ? '你的原表达' : 'What you said'}</span><Input value={draft.whatUserSaid} onChange={(event) => setDraft((value) => ({ ...value, whatUserSaid: event.target.value }))} /></label>
    <label className="space-y-2"><span className="text-sm text-muted-foreground">{zh ? '更自然的表达' : 'A natural expression'}</span><Input value={draft.naturalExpression} onChange={(event) => setDraft((value) => ({ ...value, naturalExpression: event.target.value }))} /></label>
    {entry.linkedMemoryId && <label className="space-y-2"><span className="text-sm text-muted-foreground">{zh ? 'Morrow 保存的记忆（同步长期记忆）' : 'What Morrow saved (updates long-term memory)'}</span><Input value={draft.whatMorrowRemembers} onChange={(event) => setDraft((value) => ({ ...value, whatMorrowRemembers: event.target.value }))} /></label>}
  </div>
}

function Field({ label, value, empty = '—' }: { label: string; value: string | null; empty?: string }) {
  return <div className="border border-border p-4"><p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{label}</p><p className="mt-2 leading-7">{value || empty}</p></div>
}
