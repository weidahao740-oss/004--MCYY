import type { FallbackProps } from 'react-error-boundary'

export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <main className="system-page-shell">
      <section className="system-page-card" role="alert">
        <p className="system-page-eyebrow">Morrow 暂时停了一下</p>
        <h1>页面没有正常打开</h1>
        <p>请重试一次。已经确认的原型进度仍保存在当前浏览器中。</p>
        <details>
          <summary>查看错误信息</summary>
          <pre>{error instanceof Error ? error.message : String(error)}</pre>
        </details>
        <button type="button" className="primary" onClick={resetErrorBoundary}>重新打开</button>
      </section>
    </main>
  )
}
