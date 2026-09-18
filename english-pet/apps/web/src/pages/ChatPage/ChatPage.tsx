import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Conversation, ConversationMessage, LanguageFeedback } from '@english-pet/contracts'
import { LoaderCircle, RefreshCw, Send, Square, SquareCheckBig } from 'lucide-react'
import { conversationApi } from '@/api/conversation-api'
import { useAuth } from '@/auth/auth-context'
import { LanguageFeedbackPanel } from '@/components/LanguageFeedbackPanel'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { currentLocale } from '@/i18n/copy'
import VoiceComposer from './VoiceComposer'
import VoiceControls from './VoiceControls'

interface IRetryState {
  content: string
  clientMessageId: string
}

export default function ChatPage() {
  const { session, token } = useAuth()
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [draft, setDraft] = useState('')
  const [streamText, setStreamText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retry, setRetry] = useState<IRetryState | null>(null)
  const [latestAssistantId, setLatestAssistantId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<LanguageFeedback | null>(null)
  const [finishing, setFinishing] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const locale = currentLocale(session?.settings.interfaceLocale)
  const zh = locale === 'zh-CN'

  useEffect(() => {
    if (!token) return
    let cancelled = false
    conversationApi.current(token).then((value) => {
      if (!cancelled) setConversation(value)
    }).catch(() => {
      if (!cancelled) setError(zh ? '无法恢复对话，请稍后重试。' : 'Could not restore the conversation.')
    })
    return () => { cancelled = true }
  }, [token, zh])

  if (!session || !token) return null

  async function send(content: string, clientMessageId: string) {
    if (!conversation || sending) return
    const controller = new AbortController()
    abortRef.current = controller
    setSending(true)
    setError(null)
    setStreamText('')
    setRetry({ content, clientMessageId })

    try {
      await conversationApi.streamMessage(
        token,
        conversation.id,
        { content, clientMessageId },
        controller.signal,
        (event) => {
          if (event.type === 'accepted') {
            setConversation((current) => current && current.messages.some((item) => item.id === event.message.id)
              ? current
              : current && { ...current, messages: [...current.messages, event.message] })
          }
          if (event.type === 'delta') setStreamText((current) => current + event.delta)
          if (event.type === 'completed') {
            setConversation((current) => current && current.messages.some((item) => item.id === event.message.id)
              ? current
              : current && { ...current, messages: [...current.messages, event.message] })
            setLatestAssistantId(event.message.id)
            setStreamText('')
            setRetry(null)
          }
          if (event.type === 'error') setError(event.message)
        },
      )
    } catch (requestError) {
      if (!(requestError instanceof DOMException && requestError.name === 'AbortError')) {
        setError(zh ? '回复中断了。你的消息仍在，可以重试。' : 'The reply was interrupted. Your message is still here; you can retry.')
      }
    } finally {
      setSending(false)
      abortRef.current = null
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const content = draft.trim()
    if (!content) return
    setDraft('')
    void send(content, crypto.randomUUID())
  }

  function cancel() {
    abortRef.current?.abort()
    setSending(false)
    setStreamText('')
  }

  function askForSimpler(text: string) {
    setDraft(`Please say this in simpler English: ${text}`)
  }

  async function finishConversation() {
    if (!conversation || sending || finishing) return
    setFinishing(true)
    setError(null)
    try {
      const result = await conversationApi.complete(token, conversation.id, { idempotencyKey: crypto.randomUUID() })
      setConversation((current) => current ? { ...current, status: result.conversation.status } : current)
      setFeedback(result.feedback)
    } catch {
      setError(zh ? '请至少完成一次表达后再查看反馈。' : 'Send at least one expression before viewing feedback.')
    } finally {
      setFinishing(false)
    }
  }

  async function startNewConversation() {
    setFeedback(null)
    setError(null)
    setConversation(await conversationApi.current(token))
  }

  const messages = conversation?.messages ?? []
  const keepMockSubtitle = conversation?.modelMode === 'mock'
  return (
    <main className="mx-auto flex h-[calc(100vh-73px)] max-w-4xl flex-col px-4 py-5 sm:px-8 sm:py-8">
      <header className="mb-5 flex items-end justify-between gap-5 border-b border-border pb-5">
        <div><p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">{zh ? '自由对话 / Morrow 默认使用英语' : 'Free chat / Morrow speaks English by default'}</p><h1 className="mt-2 font-serif text-3xl">{zh ? '和 Morrow 说点什么' : 'Talk with Morrow'}</h1></div>
        <span className="text-xs text-muted-foreground">{conversation?.modelMode === 'mock' ? 'Mock LLM · ASR · TTS' : 'Live AI'}</span>
      </header>

      <section className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1" aria-live="polite">
        {messages.map((item: ConversationMessage) => {
          const showText = item.role === 'user' || session.settings.subtitlesEnabled || item.degraded || keepMockSubtitle
          return (
            <article key={item.id} className={`max-w-[86%] border p-4 ${item.role === 'user' ? 'ml-auto border-primary/25 bg-primary/5' : 'border-card-border bg-card'}`}>
              <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.13em] text-muted-foreground">{item.role === 'user' ? (zh ? '你' : 'You') : 'Morrow'}</p>
              {showText ? <p className="whitespace-pre-wrap leading-7">{item.content}</p> : <p className="text-sm text-muted-foreground">{zh ? '字幕已关闭' : 'Subtitles are off'}</p>}
              {item.degraded && <p className="mt-2 text-xs text-warning">{zh ? '当前为安全文字降级回复' : 'Safe text fallback is active'}</p>}
              {item.role === 'assistant' && (
                <VoiceControls
                  token={token}
                  text={item.content}
                  zh={zh}
                  voiceEnabled={session.settings.voiceOutputEnabled}
                  autoPlay={item.id === latestAssistantId}
                  onSimpler={() => askForSimpler(item.content)}
                />
              )}
            </article>
          )
        })}
        {streamText && <article className="max-w-[86%] border border-primary/20 bg-card p-4"><p className="mb-2 font-mono text-[11px] uppercase tracking-[0.13em] text-muted-foreground">Morrow</p><p className="leading-7">{streamText}<span className="ml-1 inline-block h-4 w-px animate-pulse bg-primary" /></p></article>}
        {sending && !streamText && <div className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" />{zh ? 'Morrow 正在想……' : 'Morrow is thinking…'}</div>}
      </section>

      {error && <div className="mt-4 flex items-center justify-between gap-4 border border-warning/30 bg-warning/5 p-3 text-sm"><span>{error}</span>{retry && <Button type="button" variant="outline" size="sm" onClick={() => void send(retry.content, retry.clientMessageId)}><RefreshCw />{zh ? '重试' : 'Retry'}</Button>}</div>}

      {feedback && <LanguageFeedbackPanel feedback={feedback} locale={locale} />}

      {conversation?.status === 'active' ? (
        <>
          <VoiceComposer token={token} zh={zh} enabled={session.settings.voiceInputEnabled} disabled={sending} onUseTranscript={setDraft} />

          <form className="mt-3 flex flex-wrap items-end gap-3 border-t border-border pt-4" onSubmit={handleSubmit}>
            <Textarea className="min-w-64 flex-1" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={zh ? '可以用英语或中文开始；Morrow 默认用英语回应。' : 'Start in English or Chinese; Morrow replies in English by default.'} maxLength={800} rows={2} disabled={sending || finishing} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit() } }} />
            {sending ? <Button type="button" variant="outline" onClick={cancel}><Square />{zh ? '取消' : 'Cancel'}</Button> : <Button type="submit" disabled={!draft.trim() || finishing}><Send />{zh ? '发送' : 'Send'}</Button>}
            <Button type="button" variant="outline" disabled={sending || finishing || messages.every((item) => item.role !== 'user')} onClick={() => void finishConversation()}><SquareCheckBig />{zh ? '结束并查看反馈' : 'Finish and view feedback'}</Button>
          </form>
        </>
      ) : (
        <div className="mt-5 border-t border-border pt-4"><Button onClick={() => void startNewConversation()}>{zh ? '开始新对话' : 'Start a new conversation'}</Button></div>
      )}
    </main>
  )
}
