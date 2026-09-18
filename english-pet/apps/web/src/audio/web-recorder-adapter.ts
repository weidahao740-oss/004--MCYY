export interface IRecordedAudio {
  blob: Blob
  mimeType: string
}

export interface IRecorderAdapter {
  requestPermission(): Promise<boolean>
  start(): Promise<void>
  stop(): Promise<IRecordedAudio>
  cancel(): void
}

export class WebRecorderAdapter implements IRecorderAdapter {
  private recorder: MediaRecorder | null = null
  private stream: MediaStream | null = null
  private chunks: Blob[] = []

  async requestPermission(): Promise<boolean> {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') return false
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      return true
    } catch {
      return false
    }
  }

  async start(): Promise<void> {
    if (!this.stream) {
      const allowed = await this.requestPermission()
      if (!allowed) throw new Error('microphone_denied')
    }
    this.chunks = []
    this.recorder = new MediaRecorder(this.stream!)
    this.recorder.addEventListener('dataavailable', (event) => {
      if (event.data.size > 0) this.chunks.push(event.data)
    })
    this.recorder.start()
  }

  stop(): Promise<IRecordedAudio> {
    return new Promise((resolve, reject) => {
      if (!this.recorder || this.recorder.state !== 'recording') {
        reject(new Error('not_recording'))
        return
      }
      const recorder = this.recorder
      recorder.addEventListener('stop', () => {
        const mimeType = recorder.mimeType || 'audio/webm'
        const blob = new Blob(this.chunks, { type: mimeType })
        this.dispose()
        resolve({ blob, mimeType })
      }, { once: true })
      recorder.stop()
    })
  }

  cancel(): void {
    if (this.recorder?.state === 'recording') this.recorder.stop()
    this.dispose()
  }

  private dispose(): void {
    this.stream?.getTracks().forEach((track) => track.stop())
    this.stream = null
    this.recorder = null
    this.chunks = []
  }
}
