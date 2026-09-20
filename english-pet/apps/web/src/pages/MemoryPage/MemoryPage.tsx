import { useEffect, useState } from 'react'
import type { Memory, MemoryActionRequest, MemoryListResponse } from '@english-pet/contracts'
import { Brain, EyeOff, Pause, Pencil, Play, Save, ShieldCheck, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { memoryApi } from '@/api/memory-api'
import { useAuth } from '@/auth/auth-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { currentLocale } from '@/i18n/copy'

const kindCopy = {
  'zh-CN': { life: '生活记忆', language: '语言记忆', relationship: '关系记忆' },
  en: { life: 'Life memory', language: 'Language memory', relationship: 'Relationship memory' },
} as const

function idempotencyKey() {
  return crypto.randomUUID()
}

export default function MemoryPage() {
  const { token, session } = useAuth()
  const locale = currentLocale(session?.settings.interfaceLocale)
  const zh = locale === 'zh-CN'
  const [data, setData] = useState<MemoryListResponse | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function refresh() {
    if (!token) return
    setData(await memoryApi.list(token))
  }

  useEffect(() => {
    if (!token) return
    let cancelled = false
    memoryApi.list(token).then((value) => {
      if (!cancelled) setData(value)
    }).catch(() => {
      if (!cancelled) toast.error(zh ? '暂时无法读取记忆。' : 'Memories are unavailable for a moment.')
    })
    return () => { cancelled = true }
  }, [token, zh])

  async function act(memory: Memory, action: MemoryActionRequest['action'], content?: string) {
    if (!token) return
    setBusyId(memory.id)
    try {
      await memoryApi.act(token, memory.id, {
        action,
        expectedVersion: memory.version,
        content,
        idempotencyKey: idempotencyKey(),
      })
      await refresh()
      toast.success(zh ? '记忆状态已更新。' : 'Memory updated.')
    } catch {
      toast.error(zh ? '记忆已变化或当前操作不可用，请刷新后重试。' : 'The memory changed or this action is unavailable. Refresh and try again.')
    } finally {
      setBusyId(null)
    }
  }

  if (!session) return null
  const proposed = data?.proposed ?? []
  const saved = data?.saved ?? []

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
      <div className="max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">记忆 · 由你掌控</p>
        <h1 className="mt-3 font-serif text-4xl">{zh ? 'Morrow 记住的内容' : 'What Morrow remembers'}</h1>
        <p className="mt-4 leading-7 text-muted-foreground">{zh ? '模型只能提出建议。只有你保存后的记忆才会进入后续对话；暂停、删除和拒绝会立即停止调用。' : 'The model can only suggest. A memory enters future conversations only after you save it; pausing, deleting, or rejecting stops its use immediately.'}</p>
      </div>

      {!data?.memoryEnabled && (
        <div className="mt-7 flex items-start gap-3 border border-warning/40 bg-warning/5 p-4 text-sm">
          <EyeOff className="mt-0.5 size-4 shrink-0" />
          <span>{zh ? '全局记忆已暂停。已有内容不会删除，但当前不会进入 Morrow 的上下文；可在设置中恢复。' : 'Global memory is paused. Existing items are not deleted, but none enter Morrow’s context until you resume it in Settings.'}</span>
        </div>
      )}

      <section className="mt-9">
        <div className="flex items-center justify-between gap-4">
          <div><h2 className="font-serif text-2xl">{zh ? '等待你审核' : 'Waiting for your review'}</h2><p className="mt-1 text-sm text-muted-foreground">{zh ? '提案 24 小时未处理会过期并清空正文。' : 'Unreviewed proposals expire after 24 hours and their text is cleared.'}</p></div>
          <Badge variant="outline">{proposed.length}</Badge>
        </div>
        <div className="mt-4 grid gap-4">
          {proposed.length === 0 ? <EmptyState text={zh ? '现在没有待审核提案。完成一次符合条件的对话或事件后，这里会出现可审核内容。' : 'No proposals are waiting. Eligible conversations or events can create reviewable suggestions.'} /> : proposed.map((memory) => (
            <ProposalCard key={memory.id} memory={memory} locale={locale} busy={busyId === memory.id} onAction={act} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between gap-4">
          <div><h2 className="font-serif text-2xl">{zh ? '已保存记忆' : 'Saved memories'}</h2><p className="mt-1 text-sm text-muted-foreground">{zh ? '可随时编辑、暂停、恢复或删除。' : 'Edit, pause, resume, or delete at any time.'}</p></div>
          <Badge variant="outline">{saved.length}</Badge>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {saved.length === 0 ? <EmptyState text={zh ? '尚未保存长期记忆。' : 'No long-term memories have been saved yet.'} /> : saved.map((memory) => (
            <SavedMemoryCard key={memory.id} memory={memory} locale={locale} busy={busyId === memory.id} onAction={act} />
          ))}
        </div>
      </section>

      {(data?.restrictedProposalCount ?? 0) > 0 && (
        <div className="mt-8 flex items-start gap-3 border border-border p-4 text-sm text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" />
          {zh ? `已拦截 ${data?.restrictedProposalCount} 条不适合长期保存的敏感提案；敏感正文没有进入记忆存储。` : `${data?.restrictedProposalCount} sensitive proposal(s) were blocked; their text did not enter memory storage.`}
        </div>
      )}
      <p className="mt-6 text-xs text-muted-foreground">{zh ? '开发说明：当前记忆使用服务端内存存储，API 重启会清空；数据状态与未来 PostgreSQL Schema 保持一致。' : 'Development note: memories currently use server memory and reset when the API restarts; states match the future PostgreSQL schema.'}</p>
    </main>
  )
}

interface CardProps {
  memory: Memory
  locale: 'zh-CN' | 'en'
  busy: boolean
  onAction: (memory: Memory, action: MemoryActionRequest['action'], content?: string) => Promise<void>
}

function ProposalCard({ memory, locale, busy, onAction }: CardProps) {
  const zh = locale === 'zh-CN'
  const [content, setContent] = useState(memory.content)
  return <Card><CardHeader><div className="flex items-center justify-between gap-3"><Badge>{kindCopy[locale][memory.kind]}</Badge><span className="text-xs text-muted-foreground">{zh ? '需要确认' : 'Needs confirmation'}</span></div><CardTitle className="pt-3">{zh ? '要让 Morrow 记住这件事吗？' : 'Should Morrow remember this?'}</CardTitle><CardDescription>{zh ? '保存前可以修改；拒绝后正文会立即清空。' : 'Edit before saving. Rejecting clears the proposal text immediately.'}</CardDescription></CardHeader><CardContent className="space-y-4"><Input value={content} onChange={(event) => setContent(event.target.value)} disabled={busy} /><div className="flex flex-wrap gap-2"><Button disabled={busy || !content.trim()} onClick={() => void onAction(memory, 'confirm', content.trim())}><Save />{zh ? '保存记忆' : 'Save memory'}</Button><Button variant="outline" disabled={busy} onClick={() => void onAction(memory, 'reject')}><X />{zh ? '不要保存' : "Don't save"}</Button></div></CardContent></Card>
}

function SavedMemoryCard({ memory, locale, busy, onAction }: CardProps) {
  const zh = locale === 'zh-CN'
  const [editing, setEditing] = useState(false)
  const [content, setContent] = useState(memory.content)
  const paused = memory.status === 'paused'
  return <Card className={paused ? 'opacity-70' : ''}><CardHeader><div className="flex items-center justify-between gap-3"><Badge variant={paused ? 'outline' : 'default'}>{kindCopy[locale][memory.kind]}</Badge><span className="text-xs text-muted-foreground">v{memory.version} · {paused ? (zh ? '已暂停' : 'Paused') : (zh ? '使用中' : 'Active')}</span></div></CardHeader><CardContent className="space-y-4">{editing ? <Input value={content} onChange={(event) => setContent(event.target.value)} disabled={busy} /> : <p className="leading-7">{memory.content}</p>}<div className="flex flex-wrap gap-2">{editing ? <><Button size="sm" disabled={busy || !content.trim()} onClick={() => { void onAction(memory, 'edit', content.trim()); setEditing(false) }}><Save />{zh ? '保存修改' : 'Save edit'}</Button><Button size="sm" variant="ghost" onClick={() => { setContent(memory.content); setEditing(false) }}><X />{zh ? '取消' : 'Cancel'}</Button></> : <><Button size="sm" variant="outline" disabled={busy} onClick={() => setEditing(true)}><Pencil />{zh ? '编辑' : 'Edit'}</Button><Button size="sm" variant="outline" disabled={busy} onClick={() => void onAction(memory, paused ? 'resume' : 'pause')}>{paused ? <Play /> : <Pause />}{paused ? (zh ? '恢复' : 'Resume') : (zh ? '暂停' : 'Pause')}</Button><Button size="sm" variant="ghost" disabled={busy} onClick={() => { if (window.confirm(zh ? '删除后不会再进入 Morrow 的上下文。确定删除？' : 'Deleted memories will no longer enter Morrow’s context. Delete it?')) void onAction(memory, 'delete') }}><Trash2 />{zh ? '删除' : 'Delete'}</Button></>}</div></CardContent></Card>
}

function EmptyState({ text }: { text: string }) {
  return <div className="flex min-h-32 items-center gap-3 border border-dashed border-border p-6 text-sm text-muted-foreground"><Brain className="size-5 shrink-0" />{text}</div>
}
