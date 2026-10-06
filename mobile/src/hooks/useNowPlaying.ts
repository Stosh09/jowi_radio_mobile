import { useEffect, useState } from 'react'
import { resolveOnAir, type OnAirState } from '../lib/scheduleClock'
import { useAppActive } from './useAppActive'

const TICK_MS = 30_000

export function useNowPlaying(): OnAirState {
  const active = useAppActive()
  const [state, setState] = useState(() => resolveOnAir())

  useEffect(() => {
    if (!active) return
    const tick = () => setState(resolveOnAir())
    tick()
    const id = setInterval(tick, TICK_MS)
    return () => clearInterval(id)
  }, [active])

  return state
}
