import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, KeyRound, Moon, Volume2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/auth/auth-context'
import { ApiClientError } from '@/api/account-api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getCopy } from '@/i18n/copy'

export default function HomePage() {
  const { session, loading, startGuest, register, login } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const t = getCopy('zh-CN')

  if (!loading && session) return <Navigate to={session.pet.firstDayStatus === 'completed' ? '/room' : '/first-day'} replace />

  async function run(action: () => Promise<void>, destination: '/first-day' | '/room') {
    setBusy(true)
    try {
      await action()
      navigate(destination)
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : t.connectionQuiet)
    } finally {
      setBusy(false)
    }
  }

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    void run(() => login({ email: String(data.get('email')), password: String(data.get('password')) }), '/room')
  }

  function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    void run(() => register({ email: String(data.get('email')), password: String(data.get('password')), displayName: String(data.get('displayName') || '') || undefined }), '/first-day')
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-5 py-8 sm:px-8">
      <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(circle_at_20%_15%,var(--accent)_0,transparent_34%),radial-gradient(circle_at_80%_80%,var(--secondary)_0,transparent_28%)]" />
      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1.15fr_.85fr]">
        <section className="max-w-2xl">
          <div className="mb-10 flex items-center gap-3 text-primary"><span className="grid size-11 place-items-center rounded-full border border-primary/30 bg-primary/10"><Moon className="size-5" /></span><span className="text-sm tracking-[0.22em] uppercase">{t.heroEyebrow}</span></div>
          <p className="mb-4 font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase">{t.heroKicker}</p>
          <h1 className="max-w-xl font-serif text-5xl leading-[1.04] tracking-tight sm:text-7xl">{t.heroTitle}</h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground">{t.heroBody}</p>
          <div className="mt-9 grid max-w-xl gap-4 sm:grid-cols-2">
            <div className="border-t border-border pt-4"><Volume2 className="mb-3 size-5 text-primary" /><p className="text-sm font-medium">{t.equalTitle}</p><p className="mt-1 text-sm text-muted-foreground">{t.equalBody}</p></div>
            <div className="border-t border-border pt-4"><KeyRound className="mb-3 size-5 text-primary" /><p className="text-sm font-medium">{t.memoryTitle}</p><p className="mt-1 text-sm text-muted-foreground">{t.memoryBody}</p></div>
          </div>
        </section>

        <section className="border border-card-border bg-card p-6 shadow-xl sm:p-8">
          <div className="mb-7"><p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">{t.enterEyebrow}</p><h2 className="mt-2 font-serif text-3xl">{t.enterTitle}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{t.enterBody}</p></div>
          <Button className="h-12 w-full" disabled={busy || loading} onClick={() => void run(startGuest, '/first-day')}>{t.continueGuest} <ArrowRight /></Button>
          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" /> {t.orAccount} <span className="h-px flex-1 bg-border" /></div>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="login">{t.login}</TabsTrigger><TabsTrigger value="register">{t.register}</TabsTrigger></TabsList>
            <TabsContent value="login" className="mt-5"><form className="space-y-4" onSubmit={handleLogin} noValidate><div className="space-y-2"><Label htmlFor="login-email">{t.email}</Label><Input id="login-email" name="email" type="email" autoComplete="email" required /></div><div className="space-y-2"><Label htmlFor="login-password">{t.password}</Label><Input id="login-password" name="password" type="password" autoComplete="current-password" minLength={8} required /></div><Button className="w-full" variant="secondary" type="submit" disabled={busy}>{t.login}</Button></form></TabsContent>
            <TabsContent value="register" className="mt-5"><form className="space-y-4" onSubmit={handleRegister} noValidate><div className="space-y-2"><Label htmlFor="display-name">{t.nickname}</Label><Input id="display-name" name="displayName" maxLength={30} /></div><div className="space-y-2"><Label htmlFor="register-email">{t.email}</Label><Input id="register-email" name="email" type="email" autoComplete="email" required /></div><div className="space-y-2"><Label htmlFor="register-password">{t.password}</Label><Input id="register-password" name="password" type="password" autoComplete="new-password" minLength={8} required /></div><Button className="w-full" variant="secondary" type="submit" disabled={busy}>{t.register}</Button></form></TabsContent>
          </Tabs>
        </section>
      </div>
    </main>
  )
}
