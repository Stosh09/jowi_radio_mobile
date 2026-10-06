import { Pause, Play, SkipBack, SkipForward } from 'lucide-react'

interface PlaybackControlsProps {
  isPlaying: boolean
  isLoading: boolean
  onToggle: () => void
  size?: 'mobile' | 'desktop'
  /** Hide disabled skip buttons — cleaner on small listen screens */
  compact?: boolean
}

export function PlaybackControls({
  isPlaying,
  isLoading,
  onToggle,
  size = 'desktop',
  compact = false,
}: PlaybackControlsProps) {
  const isMobile = size === 'mobile'
  const playButtonSize = compact
    ? 'h-14 w-14 sm:h-16 sm:w-16'
    : isMobile
      ? 'h-16 w-16'
      : 'h-14 w-14'
  const skipButtonSize = isMobile ? 'h-10 w-10' : 'h-9 w-9'
  const iconSize = isMobile ? 22 : 20
  const playIconSize = compact ? 26 : isMobile ? 28 : 24

  return (
    <div
      className={`flex items-center justify-center ${
        compact ? 'gap-0' : isMobile ? 'gap-8' : 'gap-6'
      }`}
    >
      {!compact && (
        <button
          type="button"
          aria-label="Previous segment"
          className={`flex ${skipButtonSize} items-center justify-center rounded-md bg-jowi-gold/90 text-black transition hover:bg-jowi-gold`}
          disabled
          title="Not available for live radio"
        >
          <SkipBack size={iconSize} fill="currentColor" />
        </button>
      )}

      <button
        type="button"
        aria-label={isPlaying ? 'Pause' : 'Play'}
        onClick={onToggle}
        disabled={isLoading}
        className={`flex ${playButtonSize} items-center justify-center rounded-full bg-jowi-gold text-black shadow-lg shadow-jowi-gold/20 transition hover:bg-jowi-gold-dark disabled:opacity-70`}
      >
        {isLoading ? (
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-black/20 border-t-black" />
        ) : isPlaying ? (
          <Pause size={playIconSize} fill="currentColor" />
        ) : (
          <Play size={playIconSize} fill="currentColor" className="ml-1" />
        )}
      </button>

      {!compact && (
        <button
          type="button"
          aria-label="Next segment"
          className={`flex ${skipButtonSize} items-center justify-center rounded-md bg-jowi-gold/90 text-black transition hover:bg-jowi-gold`}
          disabled
          title="Not available for live radio"
        >
          <SkipForward size={iconSize} fill="currentColor" />
        </button>
      )}
    </div>
  )
}
