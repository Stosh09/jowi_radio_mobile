import { PRESENTERS } from '../config/station'
import { useNowPlaying } from '../hooks/useNowPlaying'

export function PresentersPage() {
  const { current } = useNowPlaying()
  const onAirIds = new Set(current?.hostIds ?? [])

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-jowi-gold">
        On-air talent
      </p>
      <h1 className="mt-2 font-display text-4xl uppercase text-white md:text-5xl">Presenters</h1>
      <p className="mt-3 max-w-2xl text-jowi-muted">
        The voices behind the mic — from Wuok Chieng&apos; to overnight Jowi Express.
      </p>

      {current && (
        <p className="mt-6 text-sm text-jowi-muted">
          On air now:{' '}
          <span className="font-medium text-jowi-gold">
            {current.title} with {current.host}
          </span>
        </p>
      )}

      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {PRESENTERS.map((p, index) => {
          const isOnAir = onAirIds.has(p.id)
          return (
            <article
              key={p.id}
              className={`relative overflow-hidden border bg-jowi-card/60 p-6 ${
                isOnAir ? 'border-jowi-gold/60 ring-1 ring-jowi-gold/30' : 'border-white/10'
              }`}
            >
              {isOnAir && (
                <span className="absolute right-4 top-4 rounded bg-jowi-live px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  On air
                </span>
              )}
              <div
                className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-jowi-gold/20 font-display text-2xl text-jowi-gold"
                aria-hidden="true"
              >
                {p.name
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .slice(0, 2)}
              </div>
              <p className="text-xs uppercase tracking-wider text-jowi-muted">
                Host {String(index + 1).padStart(2, '0')}
              </p>
              <h2 className="mt-1 font-display text-2xl uppercase text-white">{p.name}</h2>
              <p className="mt-1 text-sm font-medium text-jowi-gold">{p.role}</p>
              <p className="mt-2 text-sm text-jowi-muted">{p.show}</p>
              <p className="mt-4 text-sm leading-relaxed text-jowi-muted">{p.bio}</p>
            </article>
          )
        })}
      </div>
    </div>
  )
}
