import { useEffect, useState } from 'react'

function formatElapsed(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':')
}

export function useLiveTimer(isPlaying: boolean) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!isPlaying) return

    const interval = window.setInterval(() => {
      setElapsed((current) => current + 1)
    }, 1000)

    return () => window.clearInterval(interval)
  }, [isPlaying])

  useEffect(() => {
    if (!isPlaying) {
      setElapsed(0)
    }
  }, [isPlaying])

  return formatElapsed(elapsed)
}
