import { useMemo, useState } from 'react'
import { SCHEDULE, type DayKey } from '../config/station'
import { useNowPlaying } from '../hooks/useNowPlaying'

const TABS: { key: DayKey; label: string }[] = [
  { key: 'weekday', label: 'Weekdays' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
]

export function SchedulePage() {
  const { current, clock, block: todayBlock } = useNowPlaying()
  const [selected, setSelected] = useState<DayKey | null>(null)
  const activeKey = selected ?? clock.dayKey

  const block = useMemo(
    () => SCHEDULE.find((b) => b.dayKey === activeKey) ?? SCHEDULE[0],
    [activeKey],
  )

  const isToday = activeKey === todayBlock.dayKey

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-jowi-gold">
        Program guide
      </p>
      <h1 className="mt-2 font-display text-4xl uppercase text-white md:text-5xl">Schedule</h1>
      <p className="mt-3 max-w-2xl text-jowi-muted">
        Official JOWI 98.1 FM line-up — weekdays, Saturday, and Sunday. Times are East Africa Time
        (Nairobi).
      </p>

      {current && (
        <div className="mt-8 flex flex-wrap items-center gap-3 rounded-xl border border-jowi-gold/30 bg-jowi-gold/10 px-5 py-4">
          <span className="rounded bg-jowi-live px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            Live now
          </span>
          <p className="text-white">
            <span className="font-display text-xl uppercase">{current.title}</span>
            <span className="text-jowi-muted"> · with {current.host}</span>
          </p>
          <span className="font-mono text-sm text-jowi-gold">{current.time}</span>
        </div>
      )}

      <div className="mt-10 flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const isActive = tab.key === activeKey
          const isLiveDay = tab.key === clock.dayKey
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSelected(tab.key)}
              className={`rounded-md px-4 py-2 text-sm font-semibold uppercase tracking-wide transition ${
                isActive
                  ? 'bg-jowi-gold text-black'
                  : 'border border-white/15 text-jowi-muted hover:border-jowi-gold/40 hover:text-white'
              }`}
            >
              {tab.label}
              {isLiveDay && !isActive && (
                <span className="ml-2 text-[10px] text-jowi-live">Today</span>
              )}
            </button>
          )
        })}
      </div>

      <section className="mt-8">
        <h2 className="font-display text-2xl uppercase text-jowi-gold">{block.day}</h2>
        <ul className="mt-4 divide-y divide-white/10 border-y border-white/10">
          {block.slots.map((slot) => {
            const isLive = isToday && current?.id === slot.id
            return (
              <li
                key={slot.id}
                className={`grid gap-2 py-4 sm:grid-cols-[11rem_1fr_12rem] sm:items-center ${
                  isLive ? 'bg-jowi-gold/5' : ''
                }`}
              >
                <span className="font-mono text-sm text-jowi-muted">
                  {slot.time}
                  {isLive && (
                    <span className="ml-2 inline-block rounded bg-jowi-live px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                      Live
                    </span>
                  )}
                </span>
                <span className={`text-lg ${isLive ? 'font-semibold text-jowi-gold' : 'text-white'}`}>
                  {slot.title}
                </span>
                <span className="text-sm text-jowi-muted sm:text-right">{slot.host}</span>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
