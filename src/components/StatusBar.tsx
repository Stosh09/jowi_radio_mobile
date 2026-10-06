import { Headphones, Settings } from 'lucide-react'
import { usePlayer } from '../context/AudioPlayerContext'
import { useNowPlaying } from '../hooks/useNowPlaying'
import { formatSlotStart } from '../lib/scheduleClock'

export function StatusBar() {
  const { listeners } = usePlayer()
  const { upNext } = useNowPlaying()

  return (
    <footer className="flex flex-col gap-3 border-t border-white/5 bg-black/60 px-6 py-4 text-sm text-jowi-muted md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-2">
        <Headphones size={16} className="text-jowi-muted" aria-hidden="true" />
        <span>{listeners} listeners</span>
      </div>

      <p className="text-center md:flex-1">
        {upNext
          ? `Up Next: ${upNext.title} with ${upNext.host} • ${formatSlotStart(upNext)}`
          : 'Live on JOWI 98.1 FM'}
      </p>

      <button
        type="button"
        aria-label="Settings"
        className="self-end text-jowi-accent transition hover:text-white md:self-auto"
      >
        <Settings size={18} />
      </button>
    </footer>
  )
}
