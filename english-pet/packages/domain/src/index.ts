export { eventsV1, getEventDefinition } from './events-v1'
export { fixedContentV1, getFixedContentEvent } from './fixed-content-v1'
export {
  getProductionAudioBinding,
  listProductionAudioBindings,
  productionAudioRoot,
  resolveProductionAudioFile,
} from './audio-bindings'
export type { ProductionAudioBinding, ProductionAudioStatus } from './audio-bindings'

export type ClientPlatform = 'web' | 'wechat_mini_program' | 'mobile_app'

export type MemoryKind = 'life' | 'language' | 'relationship'

export const supportedClientPlatforms: readonly ClientPlatform[] = [
  'web',
  'wechat_mini_program',
  'mobile_app',
]
