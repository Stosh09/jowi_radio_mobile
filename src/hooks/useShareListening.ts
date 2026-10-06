import { useCallback, useState } from 'react'
import { STATION } from '../config/station'

export function useShareListening() {
  const [copied, setCopied] = useState(false)

  const share = useCallback(async () => {
    const url = window.location.origin
    const title = `${STATION.name} — Live`
    const text = `I'm listening to ${STATION.name} live. Tune in!`

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url })
        return
      }
    } catch {
      /* user cancelled or share failed — fall through to clipboard */
    }

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable */
    }
  }, [])

  return { share, copied }
}
