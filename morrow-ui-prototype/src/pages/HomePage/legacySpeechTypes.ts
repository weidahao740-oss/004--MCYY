/** 仅供未接入当前路由的历史演示组件保留类型；S09 页面使用 MediaRecorder。 */
export interface ISpeechRecognitionResultEvent extends Event { results: ArrayLike<ArrayLike<{ transcript: string; confidence: number }>> }
interface ISpeechRecognitionErrorEvent extends Event { error: string }
export interface ISpeechRecognition {
  lang: string; interimResults: boolean; continuous: boolean; maxAlternatives: number
  onstart: (() => void) | null; onresult: ((event: ISpeechRecognitionResultEvent) => void) | null
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null; onend: (() => void) | null
  start: () => void; stop: () => void; abort: () => void
}
declare global { interface Window { SpeechRecognition?: new () => ISpeechRecognition; webkitSpeechRecognition?: new () => ISpeechRecognition } }
