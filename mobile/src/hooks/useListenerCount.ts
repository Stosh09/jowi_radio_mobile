import { useEffect, useState } from 'react'
import { STATION } from '@shared/station'
import { anonHeaders, LISTENERS_URL, STREAM_STATS_URL } from '../lib/env'
import { KEYS, readJson, writeJson } from '../lib/storage'
import { useAppActive } from './useAppActive'

interface StreamStats {
  currentlisteners?: number
  uniquelisteners?: number
}

const POLL_MS = 20_000

async function fetchCount(url: string, headers: Record<string, string> = {}): Promise<number | null> {
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json', ...headers } })
    if (!res.ok) return null
    const data = (await res.json()) as StreamStats
    const count = data.currentlisteners ?? data.uniquelisteners
    return typeof count === 'number' && Number.isFinite(count) ? Math.max(0, count) : null
  } catch {
    return null
  }
}

async function fetchListenerCount(): Promise<number | null> {
  if (LISTENERS_URL) {
    const viaSupabase = await fetchCount(LISTENERS_URL, anonHeaders())
    if (viaSupabase != null) return viaSupabase
  }
  return fetchCount(STREAM_STATS_URL)
}

/** Live listener count from MyRadioStream; polls only while the app is in the foreground. */
export function useListenerCount() {
  const active = useAppActive()
  const [listeners, setListeners] = useState<number | null>(null)

  useEffect(() => {
    void readJson<number | null>(KEYS.cacheListeners, null).then((cached) => {
      setListeners((prev) => prev ?? cached)
    })
  }, [])

  useEffect(() => {
    if (!active) return
    let cancelled = false
    const tick = async () => {
      const count = await fetchListenerCount()
      if (!cancelled && count != null) {
        setListeners(count)
        void writeJson(KEYS.cacheListeners, count)
      }
    }
    void tick()
    const id = setInterval(() => void tick(), POLL_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [active])

  return listeners ?? STATION.listeners
}
