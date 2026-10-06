import { Headphones, Pause, Play } from 'lucide-react'
import { Link } from 'react-router-dom'
import { usePlayer } from '../../context/AudioPlayerContext'
import { useNowPlaying } from '../../hooks/useNowPlaying'
import { VolumeControl } from '../VolumeControl'

export function MiniPlayer() {
  const { isPlaying, isLoading, volume, setVolume, toggle, listeners } = usePlayer()
  const { current } = useNowPlaying()

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-jowi-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col gap-0.5 px-3 py-2 sm:px-4 md:gap-1 md:px-6 md:py-2.5">
        <div className="flex items-center gap-2.5 sm:gap-3 md:gap-5">
          <button
            type="button"
            onClick={() => void toggle()}
            disabled={isLoading}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-jowi-gold text-black transition hover:bg-jowi-gold-dark disabled:opacity-70 sm:h-11 sm:w-11"
          >
            {isLoading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
            ) : isPlaying ? (
              <Pause size={18} fill="currentColor" />
            ) : (
              <Play size={18} fill="currentColor" className="ml-0.5" />
            )}
          </button>

          <Link to="/" className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold uppercase tracking-wider text-jowi-gold">
              Live now
            </p>
            <p className="truncate text-sm font-medium text-white">
              {current?.title ?? 'JOWI Live'}
            </p>
            <p className="truncate text-xs text-jowi-muted">
              with {current?.host ?? 'The booth'}
            </p>
          </Link>

          <div className="hidden items-center gap-2 text-xs text-jowi-muted sm:flex">
            <Headphones size={14} />
            <span className="tabular-nums">{listeners}</span>
          </div>

          {isPlaying && (
            <div className="hidden h-5 items-end gap-0.5 md:flex" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="eq-bar w-1 rounded-sm bg-jowi-gold"
                  style={{
                    height: '100%',
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </div>
          )}

          <div className="hidden w-44 md:block">
            <VolumeControl volume={volume} onChange={setVolume} />
          </div>
        </div>

        {/* Mobile volume — always reachable from the sticky bar */}
        <div className="md:hidden">
          <VolumeControl volume={volume} onChange={setVolume} />
        </div>
      </div>
    </div>
  )
}
