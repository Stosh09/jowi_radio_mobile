import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(
  url &&
    anonKey &&
    !url.includes('YOUR_PROJECT_REF') &&
    !anonKey.includes('your_anon') &&
    !anonKey.includes('your_publishable'),
)

/** Shared studio Auth user — password is the booth PIN. Use a normal email domain (Supabase rejects some TLDs like .fm). */
export const BOOTH_EMAIL = (
  (import.meta.env.VITE_BOOTH_EMAIL as string | undefined) ?? 'studio@jowi981fm.com'
).trim()

/** Browser client — uses the public anon / publishable key. */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null
