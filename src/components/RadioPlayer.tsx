import { useAudioPlayer } from '../hooks/useAudioPlayer'
import { useLiveTimer } from '../hooks/useLiveTimer'
import { LiveProgressBar } from './LiveProgressBar'
import { NowPlaying } from './NowPlaying'
import { PlaybackControls } from './PlaybackControls'
import { StationBranding } from './StationBranding'
import { StatusBar } from './StatusBar'
import { VolumeControl } from './VolumeControl'

export function RadioPlayer() {
  const { isPlaying, isLoading, volume, error, setVolume, toggle, reconnect } =
    useAudioPlayer()
  const elapsed = useLiveTimer(isPlaying)

  return (
    <div className="flex min-h-screen items-center justify-center p-4 md:p-8">
      {/* Mobile layout */}
      <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-jowi-card shadow-2xl md:hidden">
        <div className="h-1 bg-jowi-gold" aria-hidden="true" />

        <StationBranding variant="mobile" />

        <div className="space-y-6 px-6 pb-6">
          <div className="border-t border-white/10 pt-6 text-center">
            <NowPlaying align="center" />
          </div>

          {error && (
            <div className="rounded-lg bg-jowi-live/10 px-4 py-3 text-center text-sm text-red-300">
              {error}
              <button
                type="button"
                onClick={reconnect}
                className="ml-2 underline hover:text-white"
              >
                Retry
              </button>
            </div>
          )}

          <PlaybackControls
            isPlaying={isPlaying}
            isLoading={isLoading}
            onToggle={toggle}
            size="mobile"
          />

          <VolumeControl volume={volume} onChange={setVolume} />
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden w-full max-w-5xl overflow-hidden rounded-2xl bg-jowi-card shadow-2xl md:block">
        <div className="grid min-h-[420px] grid-cols-[280px_1fr]">
          <aside className="relative bg-jowi-panel">
            <StationBranding variant="sidebar" />
          </aside>

          <main className="flex flex-col bg-black">
            <div className="flex flex-1 flex-col justify-center gap-8 px-10 py-8">
              <NowPlaying />

              <LiveProgressBar elapsed={elapsed} />

              {error && (
                <div className="rounded-lg bg-jowi-live/10 px-4 py-3 text-sm text-red-300">
                  {error}
                  <button
                    type="button"
                    onClick={reconnect}
                    className="ml-2 underline hover:text-white"
                  >
                    Retry
                  </button>
                </div>
              )}

              <PlaybackControls
                isPlaying={isPlaying}
                isLoading={isLoading}
                onToggle={toggle}
                size="desktop"
              />

              <VolumeControl volume={volume} onChange={setVolume} />
            </div>

            <StatusBar />
          </main>
        </div>
      </div>
    </div>
  )
}
