import React from 'react'
import type { FixedEventCatalogItem, FixedEventRecommendationView } from '@english-pet/contracts'
import { buildSchedulerPresentation, dispatchTypeLabel } from './scheduler-presentation'

const statusCopy: Record<FixedEventCatalogItem['status'], string> = {
  available: '可以开始',
  completed: '已完成',
  locked: '尚未解锁',
  cooldown: '冷却中',
}

export function SchedulerOverview({
  events,
  recommendation,
  busy,
  onStart,
  onRequestExtra,
}: {
  events: FixedEventCatalogItem[]
  recommendation: FixedEventRecommendationView
  busy: boolean
  onStart: (eventId: string) => void
  onRequestExtra: () => void
}) {
  const model = buildSchedulerPresentation(events, recommendation)
  return (
    <>
      <section data-testid="scheduler-summary" className="mt-5 border border-card-border bg-card p-4 text-sm">
        <p>{model.summary}</p>
        {model.recallHint && (
          <p data-testid="recall-background-hint" className="mt-2 border-l-2 border-primary/30 pl-3 text-muted-foreground">
            {model.recallHint}。这只是后台轻提示，不会占用主线。
          </p>
        )}
        <p className="mt-1 text-muted-foreground">
          原因：{recommendation.reason} · 本地主线 {recommendation.budget.newMainlineUsed}/2 · 新内容日常 {recommendation.budget.newDailyUsed}/1 · 回访 {recommendation.budget.recallUsed}/1
        </p>
        {model.showExtraEventAction && (
          <button data-testid="extra-event-action" type="button" disabled={busy} onClick={onRequestExtra}>
            今天再经历一件事
          </button>
        )}
      </section>
      <section data-testid="visible-event-catalog" className="mt-8 grid gap-4 md:grid-cols-2">
        {model.visibleEvents.map((event) => (
          <article key={event.eventId} data-event-id={event.eventId} data-event-type={event.eventType} className="border border-card-border bg-card p-6 shadow-lg">
            <p>{event.sequence} · v{event.version} · {dispatchTypeLabel(event.eventType)}</p>
            <h2>{event.titleZh}</h2>
            <p>{statusCopy[event.status]}</p>
            <button
              data-testid={event.eventType === 'mainline' ? 'mainline-start-action' : 'daily-start-action'}
              type="button"
              disabled={busy || event.status !== 'available'}
              onClick={() => onStart(event.eventId)}
            >
              {event.status === 'completed' ? '已完成' : event.status === 'cooldown' ? '冷却中' : event.eventType === 'mainline' ? '接受邀请' : '进入日常'}
            </button>
          </article>
        ))}
      </section>
    </>
  )
}

export function SchedulerActiveControls({
  status,
  busy,
  onPause,
  onResume,
}: {
  status: 'active' | 'completed' | 'paused'
  busy: boolean
  onPause: () => void
  onResume: () => void
}) {
  return status === 'paused' ? (
    <button data-testid="resume-event-action" type="button" disabled={busy} onClick={onResume}>恢复</button>
  ) : status === 'active' ? (
    <button data-testid="pause-event-action" type="button" disabled={busy} onClick={onPause}>稍后继续</button>
  ) : null
}
