import assert from 'node:assert/strict'
import type { FixedEventCatalogItem, FixedEventRecommendationView } from '@english-pet/contracts'
import { fixedContentV1 } from '@english-pet/domain'
import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { SchedulerOverview } from './SchedulerPresentationView.js'
import { buildSchedulerPresentation } from './scheduler-presentation.js'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

// 使用实际 fixedContentV1，而不是手工合成事件定义。
const toCatalog = (eventId: string, status: FixedEventCatalogItem['status']): FixedEventCatalogItem => {
  const event = fixedContentV1.events.find((candidate) => candidate.id === eventId)!
  return {
    eventId: event.id, version: event.version, chapterId: event.chapterId, sequence: event.sequence,
    titleZh: event.titleZh, eventType: event.eventType, triggerMode: event.triggerMode,
    triggerStrength: event.triggerStrength, status,
  }
}
const e01 = toCatalog('birth_first_voice_v1', 'available')
const e02 = toCatalog('b1_first_room_object_v1', 'locked')
const recall = toCatalog('b1_return_first_words_v1', 'locked')
assert.equal(fixedContentV1.events.some((event) => event.id === 'birth_restore_object_v1'), false)
assert.equal(fixedContentV1.events.filter((event) => event.chapterId === 'chapter_01_birth').length, 13)
assert.deepEqual(e01.eventId, 'birth_first_voice_v1')
assert.deepEqual(e02.eventId, 'b1_first_room_object_v1')

const limits = { newMainline: 2 as const, newDaily: 1 as const, newLearningObjects: 10 as const, newCoreExpressions: 3 as const, recall: 1 as const, extraEvent: 1 as const }
const budget = { localDate: '2026-10-12', timeZone: 'Asia/Shanghai', newMainlineUsed: 0, newDailyUsed: 0, newLearningObjectsUsed: 0, newCoreExpressionsUsed: 0, recallUsed: 0, extraEventUsed: 0, limits }
const recommendation: FixedEventRecommendationView = {
  kind: 'event', dispatchType: 'mainline', triggerMode: e01.triggerMode,
  triggerStrength: e01.triggerStrength, event: e01, activeInstance: null,
  recallPrompt: { eventId: recall.eventId, titleZh: recall.titleZh, triggerMode: 'recall_background', triggerStrength: 'background_gentle', sourceType: 'legacy_expression' },
  reason: 'mainline', canRequestExtraEvent: false, budget,
}

const actualCatalog = fixedContentV1.events
  .filter((event) => event.chapterId === 'chapter_01_birth')
  .map((event) => toCatalog(event.id, event.id === e01.eventId ? 'available' : 'locked'))
const presentation = buildSchedulerPresentation(actualCatalog, recommendation)
assert.ok(presentation.visibleEvents.some((item) => item.eventId === e01.eventId))
assert.ok(presentation.visibleEvents.some((item) => item.eventId === e02.eventId))
assert.equal(presentation.visibleEvents.some((item) => item.eventId === recall.eventId), false)
assert.equal(presentation.visibleEvents.some((item) => item.eventId === 'birth_restore_object_v1'), false)
assert.equal(presentation.mainlineEventId, e01.eventId)

let started: string | null = null
let renderer: TestRenderer.ReactTestRenderer
await act(async () => {
  renderer = TestRenderer.create(React.createElement(SchedulerOverview, {
    events: presentation.visibleEvents, recommendation, busy: false,
    onStart: (eventId: string) => { started = eventId }, onRequestExtra: () => undefined,
  }))
})
const root = renderer!.root
assert.equal(root.findAll((node) => node.props['data-event-type'] === 'recall').length, 0)
assert.equal(root.findAllByProps({ 'data-testid': 'recall-background-hint' }).length, 1)
const startActions = root.findAllByProps({ 'data-testid': 'mainline-start-action' })
assert.ok(startActions.length >= 1)
await act(async () => { startActions[0]!.props.onClick() })
assert.equal(started, e01.eventId)
const renderedText = JSON.stringify(renderer!.toJSON())
assert.match(renderedText, /苏醒后的第一句话/)
assert.match(renderedText, /陪墨洛认识房间第一件物品/)
assert.doesNotMatch(renderedText, /birth_restore_object_v1/)
await act(async () => { renderer!.unmount() })

console.log(JSON.stringify({ ok: true, checks: [
  'web-uses-actual-fixed-content-v1-chapter-one-catalog',
  'web-shows-actual-e01-01-and-e01-02',
  'web-hides-actual-chapter-one-recall',
  'web-excludes-retired-event',
] }, null, 2))
