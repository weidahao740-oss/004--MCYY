import type { FixedEventCatalogItem, FixedEventRecommendationView, FixedEventType } from '@english-pet/contracts'

const eventTypeCopy: Record<FixedEventType, string> = {
  mainline: '主线邀请',
  daily: '日常引出',
  recall: '后台回访',
}

export interface SchedulerPresentationModel {
  visibleEvents: FixedEventCatalogItem[]
  summary: string
  recallHint: string | null
  mainlineEventId: string | null
  showExtraEventAction: boolean
  companionMode: boolean
  activeStatus: 'active' | 'completed' | 'paused' | null
  showPauseAction: boolean
  showResumeAction: boolean
}

export function visibleCatalogEvents(events: FixedEventCatalogItem[]): FixedEventCatalogItem[] {
  return events.filter((event) => event.eventType !== 'recall')
}

export function dispatchTypeLabel(dispatchType: FixedEventRecommendationView['dispatchType']): string {
  return dispatchType === 'companion' ? '普通陪伴' : eventTypeCopy[dispatchType]
}

export function recommendationSummary(recommendation: FixedEventRecommendationView): string {
  return `当前调度：${dispatchTypeLabel(recommendation.dispatchType)}`
}

export function buildSchedulerPresentation(
  events: FixedEventCatalogItem[],
  recommendation: FixedEventRecommendationView,
): SchedulerPresentationModel {
  const activeStatus = recommendation.activeInstance?.status ?? null
  return {
    visibleEvents: visibleCatalogEvents(events),
    summary: recommendationSummary(recommendation),
    recallHint: recommendation.recallPrompt
      ? `Morrow 轻轻想起：${recommendation.recallPrompt.titleZh}`
      : null,
    mainlineEventId: recommendation.dispatchType === 'mainline' ? recommendation.event?.eventId ?? null : null,
    showExtraEventAction: recommendation.canRequestExtraEvent,
    companionMode: recommendation.kind === 'companion',
    activeStatus,
    showPauseAction: activeStatus === 'active',
    showResumeAction: activeStatus === 'paused',
  }
}
