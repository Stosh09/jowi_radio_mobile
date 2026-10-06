import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { STATION } from '../config/station'
import { BOOTH_EMAIL, isSupabaseConfigured, supabase } from '../lib/supabase'

const AUTH_KEY = 'jowi-presenter-auth'

export interface BoothLoginResult {
  ok: boolean
  hasAuth: boolean
  /** Shown on the login form when PIN worked but Auth did not */
  message?: string
}

interface PresenterAuthApi {
  isPresenter: boolean
  /** True when signed in via Supabase Auth (needed for Storage uploads). */
  hasAuthSession: boolean
  authEmail: string | null
  boothEmail: string
  loginWithPin: (pin: string) => Promise<BoothLoginResult>
  logout: () => Promise<void>
}

const PresenterAuthContext = createContext<PresenterAuthApi | null>(null)

function markPinSession(
  setPinSession: (v: boolean) => void,
  setHasAuthSession: (v: boolean) => void,
  setAuthEmail: (v: string | null) => void,
  email?: string | null,
) {
  try {
    sessionStorage.setItem(AUTH_KEY, '1')
  } catch {
    /* ignore */
  }
  setPinSession(true)
  if (email) {
    setHasAuthSession(true)
    setAuthEmail(email)
  } else {
    setHasAuthSession(false)
    setAuthEmail(null)
  }
}

export function PresenterAuthProvider({ children }: { children: ReactNode }) {
  const [pinSession, setPinSession] = useState(() => {
    try {
      return sessionStorage.getItem(AUTH_KEY) === '1'
    } catch {
      return false
    }
  })
  const [authEmail, setAuthEmail] = useState<string | null>(null)
  const [hasAuthSession, setHasAuthSession] = useState(false)

  useEffect(() => {
    if (!supabase) return
    const client = supabase

    void client.auth.getSession().then(({ data }) => {
      const email = data.session?.user?.email ?? null
      setAuthEmail(email)
      setHasAuthSession(Boolean(data.session))
      if (data.session) {
        try {
          sessionStorage.setItem(AUTH_KEY, '1')
        } catch {
          /* ignore */
        }
        setPinSession(true)
      }
    })

    const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
      setAuthEmail(session?.user?.email ?? null)
      setHasAuthSession(Boolean(session))
      if (session) {
        try {
          sessionStorage.setItem(AUTH_KEY, '1')
        } catch {
          /* ignore */
        }
        setPinSession(true)
      }
    })

    return () => {
      sub.subscription.unsubscribe()
    }
  }, [])

  const loginWithPin = useCallback(async (pin: string): Promise<BoothLoginResult> => {
    const trimmed = pin.trim()
    if (!trimmed) return { ok: false, hasAuth: false }

    if (isSupabaseConfigured && supabase) {
      const client = supabase

      const signIn = await client.auth.signInWithPassword({
        email: BOOTH_EMAIL,
        password: trimmed,
      })

      if (!signIn.error && signIn.data.session) {
        markPinSession(
          setPinSession,
          setHasAuthSession,
          setAuthEmail,
          signIn.data.session.user.email ?? BOOTH_EMAIL,
        )
        return { ok: true, hasAuth: true }
      }

      if (trimmed === STATION.presenterPin) {
        const signedUp = await client.auth.signUp({
          email: BOOTH_EMAIL,
          password: trimmed,
        })

        if (!signedUp.error && signedUp.data.session) {
          markPinSession(
            setPinSession,
            setHasAuthSession,
            setAuthEmail,
            signedUp.data.session.user.email ?? BOOTH_EMAIL,
          )
          return { ok: true, hasAuth: true }
        }

        if (!signedUp.error && signedUp.data.user && !signedUp.data.session) {
          const again = await client.auth.signInWithPassword({
            email: BOOTH_EMAIL,
            password: trimmed,
          })
          if (!again.error && again.data.session) {
            markPinSession(
              setPinSession,
              setHasAuthSession,
              setAuthEmail,
              again.data.session.user.email ?? BOOTH_EMAIL,
            )
            return { ok: true, hasAuth: true }
          }
          markPinSession(setPinSession, setHasAuthSession, setAuthEmail, null)
          return {
            ok: true,
            hasAuth: false,
            message: `Signed in with PIN. Optional: confirm booth user ${BOOTH_EMAIL} in Supabase Auth for a full session.`,
          }
        }

        if (signedUp.error) {
          console.warn('Booth signUp', signedUp.error.message)
        }

        markPinSession(setPinSession, setHasAuthSession, setAuthEmail, null)
        return {
          ok: true,
          hasAuth: false,
        }
      }

      return {
        ok: false,
        hasAuth: false,
        message: signIn.error?.message || 'Incorrect PIN.',
      }
    }

    if (trimmed === STATION.presenterPin) {
      markPinSession(setPinSession, setHasAuthSession, setAuthEmail, null)
      return { ok: true, hasAuth: false }
    }

    return { ok: false, hasAuth: false, message: 'Incorrect PIN.' }
  }, [])

  const logout = useCallback(async () => {
    try {
      sessionStorage.removeItem(AUTH_KEY)
    } catch {
      /* ignore */
    }
    setPinSession(false)
    setHasAuthSession(false)
    setAuthEmail(null)
    if (supabase) {
      await supabase.auth.signOut()
    }
  }, [])

  const value = useMemo(
    () => ({
      isPresenter: pinSession || hasAuthSession,
      hasAuthSession,
      authEmail,
      boothEmail: BOOTH_EMAIL,
      loginWithPin,
      logout,
    }),
    [pinSession, hasAuthSession, authEmail, loginWithPin, logout],
  )

  return (
    <PresenterAuthContext.Provider value={value}>{children}</PresenterAuthContext.Provider>
  )
}

export function usePresenterAuth() {
  const ctx = useContext(PresenterAuthContext)
  if (!ctx) {
    throw new Error('usePresenterAuth must be used within PresenterAuthProvider')
  }
  return ctx
}
