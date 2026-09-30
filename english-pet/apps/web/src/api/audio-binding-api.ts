const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8787').replace(/\/$/, '')

// fileRef 形如 tts/chapter_01_birth/.../audio.wav，已以 tts/ 开头，直接拼一个斜杠即可。
export function audioFileUrl(fileRef: string): string {
  return `${API_BASE}/${fileRef}`
}

export interface AudioBinding {
  audioId: string
  lineId: string
  contentId: string
  textVersion: string
  translationVersion: string
  voiceProfileId: string
  fileRef: string
  status: string
  checksumSha256: string
  durationSeconds: number | null
  sourceModel: string
}

// 200 返回绑定；404（未登记 / 未 ready）返回 null，前端降级为纯文字。
export async function getAudioBinding(token: string, audioId: string): Promise<AudioBinding | null> {
  const response = await fetch(`${API_BASE}/v1/audio/bindings/${encodeURIComponent(audioId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`audio_binding_request_failed_${response.status}`)
  return (await response.json()) as AudioBinding
}
