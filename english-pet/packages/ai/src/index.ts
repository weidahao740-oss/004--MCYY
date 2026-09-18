/**
 * @english-pet/ai 公共出口。
 * 业务层只从这里导入：适配器接口、Mock 实现、校验与降级工具。
 */
export * from './types.js'
export * from './validation.js'
export * from './degradation.js'

export * from './llm/adapter.js'
export { OpenAICompatibleLLM } from './llm/openai-compatible.js'
export { MockLLM } from './llm/mock.js'

export * from './asr/adapter.js'
export { OpenAICompatibleASR } from './asr/openai-compatible.js'
export { MockASR } from './asr/mock.js'

export * from './tts/adapter.js'
export { OpenAICompatibleTTS } from './tts/openai-compatible.js'
export { MockTTS, makeSilentWav } from './tts/mock.js'
