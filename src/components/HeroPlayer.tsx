import { Headphones, Share2 } from 'lucide-react'
import { STATION } from '../config/station'
import { usePlayer } from '../context/AudioPlayerContext'
import { useNowPlaying } from '../hooks/useNowPlaying'
import { useShareListening } from '../hooks/useShareListening'
import { formatSlotStart } from '../lib/scheduleClock'
import { LiveBadge } from './LiveBadge'
import { LiveProgressBar } from './LiveProgressBar'
import { PlaybackControls } from './PlaybackControls'
import { VolumeControl } from './VolumeControl'

export function HeroPlayer() {
  const {
    isPlaying,
    isLoading,
    volume,
    error,
    setVolume,
    toggle,
    reconnect,
    elapsed,
    listeners,
  } = usePlayer()
  const { current, upNext } = useNowPlaying()
  const { share, copied } = useShareListening()

  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <img
          src={STATION.heroImage}
          alt=""
          className="h-full w-full object-cover object-[center_28%] sm:object-[center_35%] md:object-[center_30%]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-jowi-bg md:bg-gradient-to-r md:from-black/90 md:via-black/75 md:to-black/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-jowi-bg via-transparent to-black/35" />
        <div
          className="absolute inset-0 hero-glow"
          style={{
            background:
              'radial-gradient(circle at 50% 25%, rgba(232,163,23,0.16), transparent 55%)',
          }}
        />
      </div>

      <div className="relative mx-auto grid max-w-6xl content-center gap-5 px-4 pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-5 sm:gap-8 sm:px-5 sm:pb-36 sm:pt-8 md:min-h-[calc(100svh-4rem)] md:grid-cols-[1.05fr_0.95fr] md:items-center md:gap-14 md:px-6 md:py-16 md:pb-40">
        {/* Brand + now playing */}
        <div className="min-w-0">
          <div className="fade-up mb-3 flex items-center gap-2.5 sm:mb-5 sm:gap-3">
            <LiveBadge />
            <span className="text-xs text-jowi-muted sm:text-sm">On air now</span>
            <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-jowi-muted tabular-nums md:hidden">
              <Headphones size={13} />
              {listeners}
            </span>
          </div>

          <div className="fade-up fade-up-delay-1 flex items-center gap-3.5 sm:gap-5">
            <img
              src={STATION.logo}
              alt={`${STATION.name} logo`}
              className="h-[4.5rem] w-[4.5rem] shrink-0 rounded-full bg-white object-contain p-1 shadow-xl ring-2 ring-jowi-gold/50 sm:h-24 sm:w-24 md:h-32 md:w-32"
            />
            <div className="min-w-0">
              <h1 className="font-display text-[2.35rem] uppercase leading-[0.92] tracking-tight text-white sm:text-5xl md:text-7xl">
                {STATION.shortName}
              </h1>
              <p className="mt-0.5 font-display text-xl uppercase tracking-wide text-jowi-gold sm:mt-1 sm:text-3xl md:text-4xl">
                {STATION.frequency}
              </p>
              <p className="mt-1 font-script text-xl leading-none text-jowi-gold sm:mt-2 sm:text-2xl md:text-3xl">
                {STATION.tagline}
              </p>
            </div>
          </div>

          <div className="fade-up fade-up-delay-2 mt-4 space-y-1 sm:mt-8 sm:space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-jowi-muted sm:text-xs sm:tracking-[0.22em]">
              Now playing
            </p>
            <h2 className="font-display text-[1.65rem] uppercase leading-tight text-white sm:text-3xl md:text-4xl">
              {current?.title ?? 'JOWI Live'}
            </h2>
            <p className="truncate text-sm text-jowi-muted sm:text-lg">
              with {current?.host ?? 'The booth'}
            </p>
          </div>

          <p className="fade-up fade-up-delay-3 mt-3 hidden max-w-md text-sm leading-relaxed text-jowi-muted sm:mt-6 sm:block md:text-base">
            Community radio you can feel — music, talk, and live moments from the booth.
          </p>
        </div>

        {/* Controls card */}
        <div className="fade-up fade-up-delay-2 space-y-4 rounded-2xl border border-white/10 bg-black/60 p-4 shadow-2xl backdrop-blur-md sm:space-y-6 sm:p-6 md:bg-black/55 md:p-8">
          <LiveProgressBar elapsed={elapsed} />

          {error && (
            <div className="rounded-lg bg-jowi-live/10 px-3 py-2.5 text-sm text-red-300 sm:px-4 sm:py-3">
              {error}
              <button
                type="button"
                onClick={() => void reconnect()}
                className="ml-2 underline hover:text-white"
              >
                Retry
              </button>
            </div>
          )}

          <PlaybackControls
            isPlaying={isPlaying}
            isLoading={isLoading}
            onToggle={() => void toggle()}
            size="mobile"
            compact
          />

          {/* Desktop volume — mobile uses sticky mini-player slider */}
          <div className="hidden items-center justify-between gap-4 md:flex">
            <VolumeControl volume={volume} onChange={setVolume} />
            <div className="flex items-center gap-2 text-sm text-jowi-muted">
              <Headphones size={16} />
              <span className="tabular-nums">{listeners} listening</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 border-t border-white/10 pt-4 sm:flex-row sm:flex-wrap sm:gap-3 sm:pt-5">
            <button
              type="button"
              onClick={() => void toggle()}
              className="w-full rounded-md bg-jowi-gold px-5 py-3 text-sm font-bold uppercase tracking-wide text-black transition hover:bg-jowi-gold-dark sm:w-auto sm:py-2.5"
            >
              {isPlaying ? 'Pause live' : 'Listen live'}
            </button>
            <button
              type="button"
              onClick={() => void share()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-white/20 px-4 py-3 text-sm font-medium text-white transition hover:border-jowi-gold/50 hover:text-jowi-gold sm:w-auto sm:py-2.5"
            >
              <Share2 size={16} />
              {copied ? 'Link copied' : "Share I'm listening"}
            </button>
          </div>

          <p className="line-clamp-2 text-[11px] leading-snug text-jowi-muted sm:text-xs">
            {upNext
              ? `Up next: ${upNext.title} with ${upNext.host} · ${formatSlotStart(upNext)}`
              : 'Live on JOWI 98.1 FM'}
          </p>
        </div>
      </div>
    </section>
  )
}
