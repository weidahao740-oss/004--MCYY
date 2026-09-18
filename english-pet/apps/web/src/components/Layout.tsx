import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { BookHeart, BookOpen, Brain, CalendarHeart, LogOut, MessageCircle, Moon, Settings } from 'lucide-react'
import { Toaster } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/auth/auth-context'
import AuthProvider from '@/auth/AuthProvider'
import { currentLocale, getCopy } from '@/i18n/copy'

function AppChrome() {
  const { session, logout } = useAuth()
  const navigate = useNavigate()
  const t = getCopy(currentLocale(session?.settings.interfaceLocale))

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {session && (
        <header className="border-b border-border/70 bg-card/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-5">
            <NavLink to="/room" className="flex min-w-0 items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full border border-primary/30 bg-primary/10 text-primary"><Moon className="size-4" /></span>
              <span className="min-w-0"><span className="block font-serif text-lg leading-none">Morrow</span><span className="hidden truncate text-xs text-muted-foreground sm:block">{t.brandTagline}</span></span>
            </NavLink>
            <nav className="flex items-center gap-1" aria-label={t.room}>
              <NavLink to="/room" className={({ isActive }) => `inline-flex min-h-9 items-center gap-2 rounded-md px-2 text-sm sm:px-3 ${isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}><BookOpen className="size-4" /><span className="hidden sm:inline">{t.room}</span></NavLink>
              <NavLink to="/events" className={({ isActive }) => `inline-flex min-h-9 items-center gap-2 rounded-md px-2 text-sm sm:px-3 ${isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}><CalendarHeart className="size-4" /><span className="hidden sm:inline">{t.events}</span></NavLink>
              <NavLink to="/journal" className={({ isActive }) => `inline-flex min-h-9 items-center gap-2 rounded-md px-2 text-sm sm:px-3 ${isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}><BookHeart className="size-4" /><span className="hidden sm:inline">{t.journal}</span></NavLink>
              <NavLink to="/memories" className={({ isActive }) => `inline-flex min-h-9 items-center gap-2 rounded-md px-2 text-sm sm:px-3 ${isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}><Brain className="size-4" /><span className="hidden sm:inline">{t.memories}</span></NavLink>
              <NavLink to="/chat" className={({ isActive }) => `inline-flex min-h-9 items-center gap-2 rounded-md px-2 text-sm sm:px-3 ${isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}><MessageCircle className="size-4" /><span className="hidden sm:inline">{t.chat}</span></NavLink>
              <NavLink to="/settings" className={({ isActive }) => `inline-flex min-h-9 items-center gap-2 rounded-md px-2 text-sm sm:px-3 ${isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}><Settings className="size-4" /><span className="hidden sm:inline">{t.settings}</span></NavLink>
              <Button type="button" variant="ghost" size="sm" onClick={handleLogout}><LogOut /><span className="hidden sm:inline">{t.signOut}</span></Button>
            </nav>
          </div>
        </header>
      )}
      <Outlet />
      <Toaster position="bottom-center" />
    </div>
  )
}

export const Layout = () => <AuthProvider><AppChrome /></AuthProvider>
