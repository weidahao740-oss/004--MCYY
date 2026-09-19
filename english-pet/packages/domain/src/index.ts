export { eventsV1, getEventDefinition } from './events-v1'
export { fixedContentV1, getFixedContentEvent } from './fixed-content-v1'

export type ClientPlatform = 'web' | 'wechat-mini-program' | 'mobile-app'

export type MemoryKind = 'life' | 'language' | 'relationship'

export const supportedClientPlatforms: readonly ClientPlatform[] = [
  'web',
  'wechat-mini-program',
  'mobile-app',
]
