const KEY = 'english-pet:session-token'

export const sessionStorage = {
  get(): string | null {
    try {
      return localStorage.getItem(KEY)
    } catch {
      return null
    }
  },
  set(token: string): void {
    try {
      localStorage.setItem(KEY, token)
    } catch {
      // Storage can be unavailable in private browsing; the in-memory session still works.
    }
  },
  clear(): void {
    try {
      localStorage.removeItem(KEY)
    } catch {
      // Nothing else is required when storage is unavailable.
    }
  },
}
