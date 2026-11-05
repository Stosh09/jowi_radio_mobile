import { useEffect, useState } from 'react'

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(onDone, 250)
    }, 1900)
    return () => clearTimeout(t)
  }, [onDone])
  if (!visible) return null
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#4a0f07', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <img src="/jowi-logo.svg" alt="JOWI" style={{ width: 'min(86vw,420px)' }} />
    </div>
  )
}