import { useEffect, useState } from 'react'
import { STATION } from '../config/station'

interface StreamStats {
  currentlisteners?: number
  uniquelisteners?: number
}

/**
 * Prefer Supabase Edge Function so always-open listen tabs do not burn
 * Vercel Hobby invocations. Local/dev keeps the Vite `/api/listeners` proxy
 * unless VITE_LISTENERS_URL is set explicitly.
 */
function statsEndpoint(): string {
  const configured = import.meta.env.VITE_LISTENERS_URL as string | undefined
  if (configured?.trim()) return configured.trim()

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
  if (
    import.meta.env.PROD &&
    supabaseUrl?.trim() &&
    !supabaseUrl.includes('YOUR_PROJECT_REF')
  ) {
    return `${supabaseUrl.replace(/\/$/, '')}/functions/v1/listeners`
  }

  return '/api/listeners'
}

async function fetchListenerCount(): Promise<number | null> {
  try {
    const headers: HeadersInit = {}
    const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
    // Supabase Edge Functions expect the anon/publishable key
    if (statsEndpoint().includes('supabase.co') && anon) {
      headers.Authorization = `Bearer ${anon}`
      headers.apikey = anon
    }

    const res = await fetch(statsEndpoint(), {
      headers,
      cache: 'no-store',
    })
    if (!res.ok) return null

    const data = (await res.json()) as StreamStats
    const count = data.currentlisteners ?? data.uniquelisteners
    return typeof count === 'number' && Number.isFinite(count) ? Math.max(0, count) : null
  } catch {
    return null
  }
}

const POLL_MS = 20_000

/** Live listener count from the Shoutcast / MyRadioStream stats feed. */
export function useListenerCount() {
  const [listeners, setListeners] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false

    const tick = async () => {
      const count = await fetchListenerCount()
      if (!cancelled && count != null) setListeners(count)
    }

    void tick()
    const id = window.setInterval(() => void tick(), POLL_MS)
    const onFocus = () => void tick()
    window.addEventListener('focus', onFocus)

    return () => {
      cancelled = true
      window.clearInterval(id)
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  // Keep a sensible placeholder only until the first successful fetch
  return listeners ?? STATION.listeners
}
