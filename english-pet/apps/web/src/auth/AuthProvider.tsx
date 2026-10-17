import { useEffect, useState, type ReactNode } from 'react'
import type {
  LoginRequest,
  MeResponse,
  RegisterRequest,
  UpdateSettingsRequest,
} from '@english-pet/contracts'
import { accountApi, ApiClientError } from '@/api/account-api'
import { AuthContext } from './auth-context'
import { sessionStorage } from './session-storage'

interface AuthProviderProps {
  children: ReactNode
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(() => sessionStorage.get())
  const [session, setSession] = useState<MeResponse | null>(null)
  const [loading, setLoading] = useState(() => Boolean(sessionStorage.get()))
  const [restoreError, setRestoreError] = useState(false)
  const [restoreAttempt, setRestoreAttempt] = useState(0)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    setRestoreError(false)
    setLoading(true)
    accountApi
      .me(token)
      .then((nextSession) => {
        if (!cancelled) setSession(nextSession)
      })
      .catch((error) => {
        if (!cancelled) {
          if (error instanceof ApiClientError && error.status === 401) {
            sessionStorage.clear()
            setToken(null)
            setSession(null)
          } else setRestoreError(true)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token, restoreAttempt])

  async function startGuest() {
    setLoading(true)
    try {
      const next = await accountApi.createGuest()
      sessionStorage.set(next.token)
      setToken(next.token)
      setSession(next)
    } finally {
      setLoading(false)
    }
  }

  async function register(input: RegisterRequest) {
    setLoading(true)
    try {
      const next = await accountApi.register(input, token)
      sessionStorage.set(next.token)
      setToken(next.token)
      setSession(next)
    } finally {
      setLoading(false)
    }
  }

  async function login(input: LoginRequest) {
    setLoading(true)
    try {
      const next = await accountApi.login(input)
      sessionStorage.set(next.token)
      setToken(next.token)
      setSession(next)
    } finally {
      setLoading(false)
    }
  }

  async function deleteAccount() {
    const currentToken = token
    if (!currentToken) return
    await accountApi.deleteAccount(currentToken)
    sessionStorage.clear()
    setToken(null)
    setSession(null)
  }

  async function logout() {
    const currentToken = token
    sessionStorage.clear()
    setToken(null)
    setSession(null)
    if (currentToken) await accountApi.signOut(currentToken).catch(() => undefined)
  }

  async function refreshSession() {
    if (!token) return
    setSession(await accountApi.me(token))
  }

  async function updateSettings(patch: UpdateSettingsRequest) {
    if (!token) throw new Error('A session is required')
    const next = await accountApi.updateSettings(token, patch)
    setSession(next)
  }

  if (restoreError && token && !session) return (
    <main className="grid min-h-screen place-items-center px-5 text-center">
      <div role="alert"><p>暂时连不上后台，登录信息已保留。</p><button disabled={loading} className="mt-4 rounded border px-5 py-3" onClick={() => setRestoreAttempt(value => value + 1)}>重新连接原账号</button></div>
    </main>
  )

  return (
    <AuthContext.Provider
      value={{
        session,
        token,
        loading,
        startGuest,
        register,
        login,
        deleteAccount,
        logout,
        refreshSession,
        updateSettings,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
