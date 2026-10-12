import assert from 'node:assert/strict'
import type { FixedEventCatalogItem, FixedEventInstanceView, FixedEventRecommendationView } from '@english-pet/contracts'
import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { SchedulerActiveControls, SchedulerOverview } from './SchedulerPresentationView.js'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const limits = {
  newMainline: 2 as const,
  newDaily: 1 as const,
  newLearningObjects: 10 as const,
  newCoreExpressions: 3 as const,
  recall: 1 as const,
  extraEvent: 1 as const,
}
const budget = {
  localDate: '2026-10-12', timeZone: 'Asia/Shanghai',
  newMainlineUsed: 0, newDailyUsed: 0, newLearningObjectsUsed: 0,
  newCoreExpressionsUsed: 0, recallUsed: 0, extraEventUsed: 0, limits,
}
const mainline: FixedEventCatalogItem = {
  eventId: 'mainline-1', version: '1.0.0', chapterId: 'chapter-1', sequence: 1,
  titleZh: '主线事件', eventType: 'mainline', triggerMode: 'mainline_invitation',
  triggerStrength: 'direct_invitation', status: 'available',
}
const daily: FixedEventCatalogItem = {
  eventId: 'daily-1', version: '1.0.0', chapterId: 'chapter-1', sequence: 2,
  titleZh: '日常事件', eventType: 'daily', triggerMode: 'daily_environment',
  triggerStrength: 'ambient_hint', status: 'available',
}
const recall: FixedEventCatalogItem = {
  eventId: 'recall-1', version: '1.0.0', chapterId: 'chapter-1', sequence: 3,
  titleZh: '回访事件', eventType: 'recall', triggerMode: 'recall_background',
  triggerStrength: 'background_gentle', status: 'locked',
}

function recommendation(overrides: Partial<FixedEventRecommendationView> = {}): FixedEventRecommendationView {
  return {
    kind: 'event', dispatchType: 'mainline', triggerMode: 'mainline_invitation',
    triggerStrength: 'direct_invitation', event: mainline, activeInstance: null,
    recallPrompt: { eventId: recall.eventId, titleZh: recall.titleZh, triggerMode: 'recall_background', triggerStrength: 'background_gentle', sourceType: 'shared_memory' },
    reason: 'mainline', canRequestExtraEvent: false, budget,
    ...overrides,
  }
}

let startedEventId: string | null = null
let extraRequests = 0
let renderer: TestRenderer.ReactTestRenderer
await act(async () => {
  renderer = TestRenderer.create(
    React.createElement(SchedulerOverview, {
      events: [mainline, daily, recall], recommendation: recommendation(), busy: false,
      onStart: (eventId: string) => { startedEventId = eventId },
      onRequestExtra: () => { extraRequests += 1 },
    }),
  )
})
const root = renderer!.root
assert.equal(root.findAll((node) => node.props['data-event-type'] === 'recall').length, 0)
assert.equal(root.findAllByProps({ 'data-testid': 'recall-background-hint' }).length, 1)
assert.equal(root.findAllByProps({ 'data-testid': 'mainline-start-action' }).length, 1)
await act(async () => { root.findByProps({ 'data-testid': 'mainline-start-action' }).props.onClick() })
assert.equal(startedEventId, 'mainline-1')
assert.equal(extraRequests, 0)

await act(async () => {
  renderer!.update(React.createElement(SchedulerOverview, {
    events: [mainline, daily, recall],
    recommendation: recommendation({
      kind: 'companion', dispatchType: 'companion', triggerMode: 'ordinary_companion',
      triggerStrength: 'none', event: null, recallPrompt: null, reason: 'budget_reached',
      canRequestExtraEvent: true,
    }),
    busy: false, onStart: () => undefined, onRequestExtra: () => { extraRequests += 1 },
  }))
})
assert.equal(renderer!.root.findAllByProps({ 'data-testid': 'recall-background-hint' }).length, 0)
await act(async () => { renderer!.root.findByProps({ 'data-testid': 'extra-event-action' }).props.onClick() })
assert.equal(extraRequests, 1)

const fakeInstance = { status: 'active' } as FixedEventInstanceView
let pauses = 0
let resumes = 0
await act(async () => {
  renderer!.update(React.createElement(SchedulerActiveControls, {
    status: fakeInstance.status, busy: false,
    onPause: () => { pauses += 1 }, onResume: () => { resumes += 1 },
  }))
})
await act(async () => { renderer!.root.findByProps({ 'data-testid': 'pause-event-action' }).props.onClick() })
assert.equal(pauses, 1)
await act(async () => {
  renderer!.update(React.createElement(SchedulerActiveControls, {
    status: 'paused', busy: false,
    onPause: () => { pauses += 1 }, onResume: () => { resumes += 1 },
  }))
})
await act(async () => { renderer!.root.findByProps({ 'data-testid': 'resume-event-action' }).props.onClick() })
assert.equal(resumes, 1)
await act(async () => { renderer!.unmount() })

console.log(JSON.stringify({
  ok: true,
  checks: [
    'mounted-component-hides-recall-catalog',
    'mounted-component-shows-non-preemptive-recall-hint',
    'mounted-component-keeps-mainline-start-clickable',
    'mounted-component-shows-companion-extra-action',
    'mounted-component-pause-resume-actions',
  ],
}, null, 2))
