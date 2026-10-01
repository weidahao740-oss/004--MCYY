import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <main className="system-page-shell">
      <section className="system-page-card">
        <p className="system-page-eyebrow">404</p>
        <h1>这里没有这个页面</h1>
        <p>回到 Morrow 的房间，可以继续当前的原型体验。</p>
        <Link to="/" className="system-page-link">回到房间</Link>
      </section>
    </main>
  )
}
