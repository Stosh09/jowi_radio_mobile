import { useState } from 'react'

/**
 * Presenter avatar with photo support. Falls back to the initials circle
 * until a photo exists: drop `public/presenters/<presenter-id>.jpg`
 * (e.g. `mercyline-akinyi-ogweno.jpg`) and it appears with no code change.
 */
export function PresenterAvatar({
  id,
  name,
  className = '',
}: {
  id: string
  name: string
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)

  return (
    <div
      aria-hidden="true"
      className={`relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-jowi-gold/20 font-display text-2xl text-jowi-gold ${className}`}
    >
      {initials}
      {failed ? null : (
        <img
          src={`/presenters/${id}.jpg`}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  )
}
