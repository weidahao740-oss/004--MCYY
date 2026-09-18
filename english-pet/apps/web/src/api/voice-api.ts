import type {
  SynthesizeSpeechResponse,
  TranscribeAudioResponse,
} from '@english-pet/contracts'

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8787').replace(/\/$/, '')

async function post<T>(path: string, token: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })
  if (!response.ok) throw new Error(`voice_request_failed_${response.status}`)
  return (await response.json()) as T
}

async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let binary = ''
  const chunk = 0x8000
  for (let offset = 0; offset < bytes.length; offset += chunk) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunk))
  }
  return btoa(binary)
}

export const voiceApi = {
  async transcribe(token: string, audio: Blob, mimeType: string) {
    return post<TranscribeAudioResponse>('/v1/audio/transcriptions', token, {
      audioBase64: await blobToBase64(audio),
      mimeType,
      languageHint: 'en',
    })
  },
  synthesize(token: string, text: string, speed: number) {
    return post<SynthesizeSpeechResponse>('/v1/audio/speech', token, {
      text,
      speed,
      format: 'wav',
    })
  },
  audioBlob(response: SynthesizeSpeechResponse): Blob {
    const binary = atob(response.audioBase64)
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    return new Blob([bytes], { type: response.mimeType })
  },
}
