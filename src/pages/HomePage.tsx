import { Link } from 'react-router-dom'
import { AdBanner } from '../components/AdBanner'
import { HeroPlayer } from '../components/HeroPlayer'
import { PRESENTERS } from '../config/station'
import { useNowPlaying } from '../hooks/useNowPlaying'
import { getTodayHighlights } from '../lib/scheduleClock'

export function HomePage() {
  const { current, block } = useNowPlaying()
  const highlights = getTodayHighlights(4)
  const featuredPresenters = PRESENTERS.slice(0, 3)

  return (
    <>
      <HeroPlayer />
      <AdBanner variant="dock" />

      <section className="border-t border-white/10 bg-black/20">
        <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-jowi-gold">
            Today on air · {block.day}
          </p>
          <h2 className="mt-2 font-display text-3xl uppercase text-white md:text-4xl">
            {current ? 'On now & coming up' : 'Coming up today'}
          </h2>
          <p className="mt-2 max-w-xl text-jowi-muted">
            Live from the JOWI programme guide (East Africa Time). Full timetable on the schedule
            page.
          </p>

          <ul className="mt-8 divide-y divide-white/10 border-y border-white/10">
            {highlights.map((slot) => {
              const isLive = current?.id === slot.id
              return (
                <li
                  key={slot.id}
                  className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:justify-between"
                >
                  <span className="font-mono text-sm text-jowi-gold">
                    {slot.time}
                    {isLive && (
                      <span className="ml-2 rounded bg-jowi-live px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                        Live
                      </span>
                    )}
                  </span>
                  <span className="text-lg text-white">{slot.title}</span>
                  <span className="text-sm text-jowi-muted">{slot.host}</span>
                </li>
              )
            })}
          </ul>

          <Link
            to="/schedule"
            className="mt-6 inline-block text-sm font-semibold text-jowi-gold hover:underline"
          >
            View full schedule →
          </Link>
        </div>
      </section>

      <section className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-jowi-gold">
            The booth
          </p>
          <h2 className="mt-2 font-display text-3xl uppercase text-white md:text-4xl">
            Meet the presenters
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredPresenters.map((p) => (
              <article key={p.id} className="border-t-2 border-jowi-gold pt-4">
                <h3 className="font-display text-xl uppercase text-white">{p.name}</h3>
                <p className="mt-1 text-sm text-jowi-gold">{p.role}</p>
                <p className="mt-3 text-sm leading-relaxed text-jowi-muted">{p.bio}</p>
              </article>
            ))}
          </div>
          <Link
            to="/presenters"
            className="mt-8 inline-block text-sm font-semibold text-jowi-gold hover:underline"
          >
            All presenters →
          </Link>
        </div>
      </section>

      <section className="border-t border-white/10 bg-jowi-gold/10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-12 md:flex-row md:items-center md:px-6">
          <div>
            <h2 className="font-display text-3xl uppercase text-white">Talk to the studio</h2>
            <p className="mt-2 max-w-lg text-jowi-muted">
              Send shoutouts, request songs, and vote in live polls — presenters see it in the booth.
            </p>
          </div>
          <Link
            to="/interact"
            className="rounded-md bg-jowi-gold px-6 py-3 text-sm font-bold uppercase tracking-wide text-black hover:bg-jowi-gold-dark"
          >
            Open interact panel
          </Link>
        </div>
      </section>
    </>
  )
}
