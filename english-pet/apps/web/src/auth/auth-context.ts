import { createContext, useContext } from 'react'
import type {
  LoginRequest,
  MeResponse,
  RegisterRequest,
  UpdateSettingsRequest,
} from '@english-pet/contracts'

export interface IAuthContextValue {
  session: MeResponse | null
  token: string | null
  loading: boolean
  startGuest: () => Promise<void>
  register: (input: RegisterRequest) => Promise<void>
  login: (input: LoginRequest) => Promise<void>
  deleteAccount: () => Promise<void>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
  updateSettings: (patch: UpdateSettingsRequest) => Promise<void>
}

export const AuthContext = createContext<IAuthContextValue | null>(null)

export function useAuth(): IAuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('AuthProvider is required')
  return value
}
