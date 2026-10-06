import { Volume1, Volume2, VolumeX } from 'lucide-react'

interface VolumeControlProps {
  volume: number
  onChange: (volume: number) => void
  className?: string
}

export function VolumeControl({ volume, onChange, className = '' }: VolumeControlProps) {
  const Icon = volume === 0 ? VolumeX : volume < 0.45 ? Volume1 : Volume2
  const percent = Math.round(volume * 100)

  return (
    <div className={`flex min-w-0 flex-1 items-center gap-2 sm:gap-3 ${className}`}>
      <button
        type="button"
        aria-label={volume === 0 ? 'Unmute' : 'Mute'}
        onClick={() => onChange(volume === 0 ? 0.75 : 0)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-jowi-accent transition hover:bg-white/5 sm:h-10 sm:w-10"
      >
        <Icon size={18} aria-hidden="true" />
      </button>

      <div className="relative min-w-0 flex-1 py-2 sm:py-3">
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(event) => onChange(Number(event.target.value))}
          onInput={(event) => onChange(Number((event.target as HTMLInputElement).value))}
          aria-label="Volume"
          aria-valuetext={`${percent} percent`}
          className="volume-slider w-full cursor-pointer"
          style={{
            background: `linear-gradient(to right, var(--color-jowi-accent) ${percent}%, rgba(255,255,255,0.15) ${percent}%)`,
          }}
        />
      </div>

      <span className="w-8 shrink-0 text-right font-mono text-[11px] tabular-nums text-jowi-muted sm:w-10 sm:text-xs">
        {percent}
      </span>
    </div>
  )
}
