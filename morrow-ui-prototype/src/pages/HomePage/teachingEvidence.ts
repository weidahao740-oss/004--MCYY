export interface TeachingEvidence { level: 'recognized' | 'prompted'; source: 'real'; version: 2 }
const EVIDENCE_KEY = 'morrow:teaching-evidence:v2'
export function readEvidence(): Record<string, TeachingEvidence> {
  try {
    const value = JSON.parse(localStorage.getItem(EVIDENCE_KEY) || '{}') as Record<string, TeachingEvidence>
    return Object.fromEntries(Object.entries(value).filter(([, item]) => item?.source === 'real' && item.version === 2 && ['recognized', 'prompted'].includes(item.level)))
  } catch { return {} }
}
export function recordEvidence(keys: string[], level: TeachingEvidence['level']) {
  const current = readEvidence()
  keys.forEach(key => { current[key] = { level: current[key]?.level === 'prompted' ? 'prompted' : level, source: 'real', version: 2 } })
  try { localStorage.setItem(EVIDENCE_KEY, JSON.stringify(current)) } catch { /* 不伪造持久化成功 */ }
}
export function getTeachingEchoes() {
  const evidence = readEvidence()
  return Object.entries(evidence).filter(([key, value]) => value.level === 'prompted' && ['bell', 'window', 'by-the-window', 'bring-back', 'i-hear', 'a-bell', 'lamp', 'plant'].includes(key)).map(([key]) => key.replaceAll('-', ' '))
}
export function clearTeachingProgress() {
  for (const key of Object.keys(localStorage)) if (key.startsWith('morrow:teaching-') && key !== 'morrow:teaching-support') localStorage.removeItem(key)
}
