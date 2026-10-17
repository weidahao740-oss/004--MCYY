// 仅供测试：模拟可信识别结果进入引擎，不修改生产 ASR，不把 mock API 当真实语音。
import type { SqliteFixedEventEngine } from './sqlite-fixed-event-engine.js'

let sequence = 0
export function completeTeaching(engine: SqliteFixedEventEngine, userId: string, instanceId: string) {
  const state = engine.current(userId)!.currentState
  if (state.phase !== 'input' || !state.id.startsWith('c1e')) return
  const read = () => engine.teaching(userId, instanceId, { action: 'begin', stateId: state.id, idempotencyKey: `test-read-${++sequence}` })
  let view = read()
  for (let attempts = 0; view.step.kind !== 'output'; attempts += 1) {
    if (attempts > 20) throw new Error('test teaching did not reach output')
    const step = view.step
    const proof = step.kind === 'repeat' ? engine.issueAsrProof(userId, instanceId, state.id, step.english, step.id) : null
    view = engine.teaching(userId, instanceId, {
      action: 'confirm', stateId: state.id, stepId: step.id, idempotencyKey: `test-confirm-${++sequence}`,
      ...(proof ? { text: step.english, asrProof: proof.proof } : { answerIds: step.answerIds }),
    })
  }
}
