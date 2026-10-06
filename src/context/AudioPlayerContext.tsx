import { useMemo, type ReactNode } from 'react'
import { createContext, useContext } from 'react'
import { useAudioPlayer } from '../hooks/useAudioPlayer'
import { useLiveTimer } from '../hooks/useLiveTimer'
import { useListenerCount } from '../hooks/useListenerCount'

interface AudioPlayerApi {
  isPlaying: boolean
  isLoading: boolean
  volume: number
  error: string | null
  setVolume: (volume: number) => void
  play: () => Promise<void>
  pause: () => void
  toggle: () => Promise<void>
  reconnect: () => Promise<void>
  elapsed: string
  listeners: number
}

const AudioPlayerContext = createContext<AudioPlayerApi | null>(null)

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const {
    isPlaying,
    isLoading,
    volume,
    error,
    setVolume,
    play,
    pause,
    toggle,
    reconnect,
  } = useAudioPlayer()
  const elapsed = useLiveTimer(isPlaying)
  const listeners = useListenerCount()

  const value = useMemo(
    () => ({
      isPlaying,
      isLoading,
      volume,
      error,
      setVolume,
      play,
      pause,
      toggle,
      reconnect,
      elapsed,
      listeners,
    }),
    [
      isPlaying,
      isLoading,
      volume,
      error,
      setVolume,
      play,
      pause,
      toggle,
      reconnect,
      elapsed,
      listeners,
    ],
  )

  return (
    <AudioPlayerContext.Provider value={value}>{children}</AudioPlayerContext.Provider>
  )
}

export function usePlayer() {
  const ctx = useContext(AudioPlayerContext)
  if (!ctx) {
    throw new Error('usePlayer must be used within AudioPlayerProvider')
  }
  return ctx
}
