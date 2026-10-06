import { useEffect, useState } from 'react'
import { resolveOnAir, type OnAirState } from '../lib/scheduleClock'

const TICK_MS = 30_000

export function useNowPlaying(): OnAirState {
  const [state, setState] = useState(() => resolveOnAir())

  useEffect(() => {
    const tick = () => setState(resolveOnAir())
    tick()
    const id = window.setInterval(tick, TICK_MS)
    const onFocus = () => tick()
    window.addEventListener('focus', onFocus)
    return () => {
      window.clearInterval(id)
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  return state
}
