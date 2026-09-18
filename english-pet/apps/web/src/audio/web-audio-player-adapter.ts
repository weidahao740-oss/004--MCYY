export interface IAudioPlayerAdapter {
  play(source: Blob, rate: number): Promise<void>
  stop(): void
}

export class WebAudioPlayerAdapter implements IAudioPlayerAdapter {
  private audio: HTMLAudioElement | null = null
  private objectUrl: string | null = null

  async play(source: Blob, rate: number): Promise<void> {
    this.stop()
    this.objectUrl = URL.createObjectURL(source)
    this.audio = new Audio(this.objectUrl)
    this.audio.playbackRate = rate
    this.audio.addEventListener('ended', () => this.stop(), { once: true })
    await this.audio.play()
  }

  stop(): void {
    this.audio?.pause()
    this.audio = null
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl)
    this.objectUrl = null
  }
}
