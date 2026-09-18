import { Navigate, Outlet } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
import { useAuth } from '@/auth/auth-context'

export default function ProtectedRoute() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <main className="grid min-h-[70vh] place-items-center">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin" />
          Restoring your room…
        </div>
      </main>
    )
  }

  return session ? <Outlet /> : <Navigate to="/" replace />
}
