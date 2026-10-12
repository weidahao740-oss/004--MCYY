import assert from 'node:assert/strict'
import type { FixedEventCatalogItem, FixedEventRecommendationView } from '@english-pet/contracts'
import { dispatchTypeLabel, recommendationSummary, visibleCatalogEvents } from './scheduler-presentation.js'

assert.equal(dispatchTypeLabel('mainline'), '主线邀请')
assert.equal(dispatchTypeLabel('daily'), '日常引出')
assert.equal(dispatchTypeLabel('recall'), '后台回访')
assert.equal(dispatchTypeLabel('companion'), '普通陪伴')

const baseItem = {
  version: '1.0.0',
  chapterId: 'chapter-1',
  sequence: 1,
  titleZh: '测试事件',
  triggerMode: 'mainline_invitation',
  triggerStrength: 'direct_invitation',
  status: 'available',
} as const
const catalog: FixedEventCatalogItem[] = [
  { ...baseItem, eventId: 'mainline-1', eventType: 'mainline' },
  {
    ...baseItem,
    eventId: 'daily-1',
    sequence: 2,
    eventType: 'daily',
    triggerMode: 'daily_environment',
    triggerStrength: 'ambient_hint',
  },
  {
    ...baseItem,
    eventId: 'recall-1',
    sequence: 3,
    eventType: 'recall',
    triggerMode: 'recall_background',
    triggerStrength: 'background_gentle',
  },
]
assert.deepEqual(visibleCatalogEvents(catalog).map((event) => event.eventId), ['mainline-1', 'daily-1'])

const companionRecommendation: FixedEventRecommendationView = {
  kind: 'companion',
  dispatchType: 'companion',
  triggerMode: 'ordinary_companion',
  triggerStrength: 'none',
  event: null,
  activeInstance: null,
  recallPrompt: null,
  reason: 'budget_reached',
  canRequestExtraEvent: true,
  budget: {
    localDate: '2026-10-11',
    timeZone: 'Asia/Shanghai',
    newMainlineUsed: 2,
    newDailyUsed: 1,
    newLearningObjectsUsed: 10,
    newCoreExpressionsUsed: 3,
    recallUsed: 1,
    extraEventUsed: 0,
    limits: {
      newMainline: 2,
      newDaily: 1,
      newLearningObjects: 10,
      newCoreExpressions: 3,
      recall: 1,
      extraEvent: 1,
    },
  },
}
assert.equal(recommendationSummary(companionRecommendation), '当前调度：普通陪伴')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'mainline-daily-recall-trigger-copy',
    'recall-hidden-by-web-presentation-guard',
    'budget-reached-companion-copy',
  ],
}, null, 2))
