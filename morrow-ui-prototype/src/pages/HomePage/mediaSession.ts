// 从申请麦克风权限到结束采集，角色声音都不能重新播放。
let captureOwner: symbol | null = null
const listeners = new Set<() => void>()

export function isCapturing() { return captureOwner !== null }
export function subscribeCapture(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}
export function acquireCapture(owner: symbol) {
  if (captureOwner !== null) return false
  captureOwner = owner
  window.dispatchEvent(new Event('morrow:s09:stop-playback'))
  listeners.forEach(listener => listener())
  return true
}
export function releaseCapture(owner: symbol) {
  if (captureOwner !== owner) return
  captureOwner = null
  listeners.forEach(listener => listener())
}
