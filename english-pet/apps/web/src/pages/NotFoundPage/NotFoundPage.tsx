import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center py-24">
      <h1 className="mb-4 font-serif text-6xl">404</h1>
      <p className="mb-8 text-lg text-muted-foreground">页面不存在 / Page not found</p>
      <Link to="/" className="text-primary hover:underline">返回首页 / Back home</Link>
    </div>
  )
}
