import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { STATION } from '@shared/station'
import { KEYS, readJson, removeKey, writeJson } from '../lib/storage'
import { BOOTH_EMAIL, isSupabaseConfigured, supabase } from '../lib/supabase'

/** PIN-only booth sessions expire after a shift; Supabase Auth sessions persist until sign-out. */
const PIN_SESSION_MS = 12 * 60 * 60 * 1000

export interface BoothLoginResult {
  ok: boolean
  hasAuth: boolean
  message?: string
}

interface PresenterAuthApi {
  isPresenter: boolean
  hasAuthSession: boolean
  authEmail: string | null
  boothEmail: string
  /** JWT for calling protected Edge Functions (station alerts) */
  accessToken: string | null
  loginWithPin: (pin: string) => Promise<BoothLoginResult>
  logout: () => Promise<void>
}

const PresenterAuthContext = createContext<PresenterAuthApi | null>(null)

export function PresenterAuthProvider({ children }: { children: ReactNode }) {
  const [pinSession, setPinSession] = useState(false)
  const [authEmail, setAuthEmail] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  const markPinSession = useCallback(() => {
    setPinSession(true)
    void writeJson(KEYS.boothSession, { at: Date.now() })
  }, [])

  useEffect(() => {
    void readJson<{ at: number } | null>(KEYS.boothSession, null).then((stored) => {
      if (stored && Date.now() - stored.at < PIN_SESSION_MS) setPinSession(true)
      else if (stored) void removeKey(KEYS.boothSession)
    })

    if (!supabase) return
    const client = supabase
    void client.auth.getSession().then(({ data }) => {
      setAuthEmail(data.session?.user?.email ?? null)
      setAccessToken(data.session?.access_token ?? null)
      if (data.session) setPinSession(true)
    })
    const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
      setAuthEmail(session?.user?.email ?? null)
      setAccessToken(session?.access_token ?? null)
      if (session) setPinSession(true)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const loginWithPin = useCallback(
    async (pin: string): Promise<BoothLoginResult> => {
      const trimmed = pin.trim()
      if (!trimmed) return { ok: false, hasAuth: false }

      if (isSupabaseConfigured && supabase) {
        const client = supabase
        const signIn = await client.auth.signInWithPassword({ email: BOOTH_EMAIL, password: trimmed })
        if (!signIn.error && signIn.data.session) {
          markPinSession()
          return { ok: true, hasAuth: true }
        }

        if (trimmed === STATION.presenterPin) {
          const signedUp = await client.auth.signUp({ email: BOOTH_EMAIL, password: trimmed })
          if (!signedUp.error && signedUp.data.session) {
            markPinSession()
            return { ok: true, hasAuth: true }
          }
          markPinSession()
          return {
            ok: true,
            hasAuth: false,
            message: `Signed in with PIN. Confirm booth user ${BOOTH_EMAIL} in Supabase Auth for attachments and station alerts.`,
          }
        }

        const offline = /network|fetch/i.test(signIn.error?.message ?? '')
        return {
          ok: false,
          hasAuth: false,
          message: offline ? 'No connection to the studio server.' : 'Incorrect PIN.',
        }
      }

      if (trimmed === STATION.presenterPin) {
        markPinSession()
        return { ok: true, hasAuth: false }
      }
      return { ok: false, hasAuth: false, message: 'Incorrect PIN.' }
    },
    [markPinSession],
  )

  const logout = useCallback(async () => {
    await removeKey(KEYS.boothSession)
    setPinSession(false)
    setAuthEmail(null)
    setAccessToken(null)
    if (supabase) await supabase.auth.signOut()
  }, [])

  const value = useMemo<PresenterAuthApi>(
    () => ({
      isPresenter: pinSession || Boolean(accessToken),
      hasAuthSession: Boolean(accessToken),
      authEmail,
      boothEmail: BOOTH_EMAIL,
      accessToken,
      loginWithPin,
      logout,
    }),
    [pinSession, accessToken, authEmail, loginWithPin, logout],
  )

  return <PresenterAuthContext.Provider value={value}>{children}</PresenterAuthContext.Provider>
}

export function usePresenterAuth() {
  const ctx = useContext(PresenterAuthContext)
  if (!ctx) throw new Error('usePresenterAuth must be used within PresenterAuthProvider')
  return ctx
}
