import type { LanguageFeedback } from '@english-pet/contracts'
import { ArrowRight, CheckCircle2, MessageCircleWarning, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const resultCopy = {
  'zh-CN': {
    successful: '表达成功',
    more_natural: '可以更自然',
    affects_understanding: '影响理解',
  },
  en: {
    successful: 'Meaning understood',
    more_natural: 'Could be more natural',
    affects_understanding: 'Affected understanding',
  },
} as const

export function LanguageFeedbackPanel({ feedback, locale }: { feedback: LanguageFeedback; locale: 'zh-CN' | 'en' }) {
  const zh = locale === 'zh-CN'
  const ResultIcon = feedback.result === 'successful' ? CheckCircle2 : feedback.result === 'more_natural' ? Sparkles : MessageCircleWarning
  return (
    <section className="mt-7 border border-primary/25 bg-primary/5 p-5 sm:p-6" aria-labelledby={`feedback-${feedback.id}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-primary">{zh ? '交流结束后的英语反馈' : 'English feedback after the conversation'}</p>
          <h2 id={`feedback-${feedback.id}`} className="mt-2 flex items-center gap-2 font-serif text-2xl"><ResultIcon className="size-5" />{resultCopy[locale][feedback.result]}</h2>
        </div>
        <Badge variant="outline">{feedback.focusItems.length} / 3</Badge>
      </div>

      <div className="mt-5 grid gap-3">
        {feedback.focusItems.map((item, index) => (
          <article key={`${item.kind}-${index}`} className="border border-border bg-card p-4">
            <p className="font-medium">{zh ? item.titleZh : item.title}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{zh ? item.explanationZh : item.explanation}</p>
          </article>
        ))}
      </div>

      {feedback.originalExpression && feedback.naturalExpression && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="border border-border p-4"><p className="text-xs text-muted-foreground">{zh ? '你的原表达' : 'Your original expression'}</p><p className="mt-2 leading-6">{feedback.originalExpression}</p></div>
          <div className="border border-primary/25 bg-card p-4"><p className="text-xs text-muted-foreground">{zh ? '更自然的表达' : 'A more natural expression'}</p><p className="mt-2 leading-6">{feedback.naturalExpression}</p></div>
        </div>
      )}

      {feedback.pronunciationNote && <p className="mt-4 text-sm">{feedback.pronunciationNote}</p>}
      {feedback.suggestedMemoryId && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">{zh ? '复习表达已作为语言记忆提案，只有你确认后才会保存。' : 'A review expression is waiting as a language-memory proposal. It is saved only after you confirm it.'}</p>
          <Button asChild size="sm" variant="outline"><Link to="/memories">{zh ? '审核记忆提案' : 'Review memory proposal'}<ArrowRight /></Link></Button>
        </div>
      )}
      {!feedback.pronunciationNote && <p className="mt-4 text-xs text-muted-foreground">{zh ? '本次没有可靠语音证据，因此不生成发音提醒。' : 'No pronunciation note was created without reliable speech evidence.'}</p>}
    </section>
  )
}
