const trim = (value: string | undefined) => value?.trim() || undefined

export const SUPABASE_URL = trim(process.env.EXPO_PUBLIC_SUPABASE_URL)?.replace(/\/$/, '')
export const SUPABASE_ANON_KEY = trim(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY)

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes('YOUR_PROJECT_REF') &&
    !SUPABASE_ANON_KEY.includes('your_anon') &&
    !SUPABASE_ANON_KEY.includes('your_publishable'),
)

/** Shared studio Auth user — password is the booth PIN. */
export const BOOTH_EMAIL = trim(process.env.EXPO_PUBLIC_BOOTH_EMAIL) ?? 'studio@jowi981fm.com'

function functionUrl(override: string | undefined, name: string): string | null {
  if (override) return override
  if (!isSupabaseConfigured || !SUPABASE_URL) return null
  return `${SUPABASE_URL}/functions/v1/${name}`
}

export const LISTENERS_URL = functionUrl(trim(process.env.EXPO_PUBLIC_LISTENERS_URL), 'listeners')
export const EXTRACT_URL = functionUrl(trim(process.env.EXPO_PUBLIC_EXTRACT_URL), 'extract-bulletin')
export const PUSH_URL = functionUrl(trim(process.env.EXPO_PUBLIC_PUSH_URL), 'send-push')

export const SITE_URL = trim(process.env.EXPO_PUBLIC_SITE_URL) ?? 'https://jowi981.fm'

/** Shoutcast stats — native apps are not bound by browser CORS, so this is a direct fallback. */
export const STREAM_STATS_URL = 'https://s23.myradiostream.com:20542/stats?json=1'

/** Headers Supabase Edge Functions expect from public clients. */
export function anonHeaders(): Record<string, string> {
  if (!SUPABASE_ANON_KEY) return {}
  return { Authorization: `Bearer ${SUPABASE_ANON_KEY}`, apikey: SUPABASE_ANON_KEY }
}
