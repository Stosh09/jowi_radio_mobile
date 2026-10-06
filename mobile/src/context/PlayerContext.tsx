import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  type AudioMetadata,
  type AudioPlayer,
} from 'expo-audio'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { STATION } from '@shared/station'
import { useListenerCount } from '../hooks/useListenerCount'
import { useNetwork } from '../hooks/useNetwork'
import { useNowPlaying } from '../hooks/useNowPlaying'
import { SITE_URL } from '../lib/env'
import { haptic } from '../lib/haptics'
import { KEYS, readJson, writeJson } from '../lib/storage'
import { usePreferences } from './PreferencesContext'

interface PlayerApi {
  isPlaying: boolean
  isLoading: boolean
  /** Whether the listener asked for audio (stays true while reconnecting). */
  wantsAudio: boolean
  volume: number
  error: string | null
  elapsed: string
  listeners: number
  play: () => void
  pause: () => void
  toggle: () => void
  reconnect: () => void
  setVolume: (value: number) => void
}

const PlayerContext = createContext<PlayerApi | null>(null)

const STALL_MS = 20_000
const EXTERNAL_PAUSE_GRACE_MS = 4_000
const RETRY_DELAYS_MS = [2_000, 5_000, 10_000, 20_000]
const OFFLINE_MESSAGE = 'You are offline. We will reconnect when you are back.'

function streamSource() {
  return { uri: `${STATION.streamUrl}?nocache=${Date.now()}`, name: STATION.name }
}

function applyVolume(player: AudioPlayer, value: number) {
  player.volume = value
}

function startStream(player: AudioPlayer, volume: number, metadata: AudioMetadata) {
  player.replace(streamSource())
  player.volume = volume
  player.play()
  // Android needs lock-screen controls active to keep the foreground service alive past ~3 minutes.
  player.setActiveForLockScreen(true, metadata, { isLiveStream: true })
}

function formatElapsed(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const player = useAudioPlayer(null, { updateInterval: 1000 })
  const status = useAudioPlayerStatus(player)
  const { current } = useNowPlaying()
  const { isOffline } = useNetwork()
  const { settings } = usePreferences()
  const listeners = useListenerCount()

  const [wantsAudio, setWantsAudio] = useState(false)
  const [volume, setVolumeState] = useState(0.85)
  const [error, setError] = useState<string | null>(null)
  const [seconds, setSeconds] = useState(0)

  const wantsRef = useRef(false)
  const startedAtRef = useRef(0)
  const retryRef = useRef(0)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lockScreenRef = useRef(false)

  const metadata = useMemo<AudioMetadata>(
    () => ({
      title: current?.title ?? `${STATION.shortName} Live`,
      artist: current ? `with ${current.host} · ${STATION.name}` : STATION.name,
      albumTitle: STATION.tagline,
      artworkUrl: `${SITE_URL}/logo.png`,
    }),
    [current],
  )

  const setWants = useCallback((next: boolean) => {
    wantsRef.current = next
    setWantsAudio(next)
    if (!next) {
      setSeconds(0)
      setError(null)
    }
  }, [])

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    })
    void readJson<number | null>(KEYS.volume, null).then((stored) => {
      if (stored != null && Number.isFinite(stored)) {
        const v = Math.min(1, Math.max(0, stored))
        setVolumeState(v)
        applyVolume(player, v)
      }
    })
  }, [player])

  const clearRetry = useCallback(() => {
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
    retryTimerRef.current = null
  }, [])

  const connect = useCallback(() => {
    clearRetry()
    setError(null)
    startedAtRef.current = Date.now()
    startStream(player, volume, metadata)
    lockScreenRef.current = true
  }, [player, volume, metadata, clearRetry])

  const play = useCallback(() => {
    haptic.press()
    retryRef.current = 0
    setWants(true)
    connect()
  }, [connect, setWants])

  const pause = useCallback(() => {
    haptic.tap()
    clearRetry()
    setWants(false)
    player.pause()
  }, [player, clearRetry, setWants])

  const toggle = useCallback(() => {
    if (wantsAudio) pause()
    else play()
  }, [wantsAudio, pause, play])

  const reconnect = useCallback(() => {
    retryRef.current = 0
    setWants(true)
    connect()
  }, [connect, setWants])

  const setVolume = useCallback(
    (value: number) => {
      const v = Math.min(1, Math.max(0, value))
      setVolumeState(v)
      applyVolume(player, v)
      void writeJson(KEYS.volume, v)
    },
    [player],
  )

  const scheduleRetry = useCallback(
    (reason: string) => {
      if (!settings.autoReconnect || retryRef.current >= RETRY_DELAYS_MS.length) {
        setError(`${reason} Tap retry to reconnect.`)
        return
      }
      const delay = RETRY_DELAYS_MS[retryRef.current]
      retryRef.current += 1
      setError(`${reason} Reconnecting…`)
      clearRetry()
      retryTimerRef.current = setTimeout(() => connect(), delay)
    },
    [settings.autoReconnect, connect, clearRetry],
  )

  // Healthy playback resets the retry budget.
  useEffect(() => {
    if (status.playing) retryRef.current = 0
  }, [status.playing])

  // Stream errors while the listener wants audio → back-off reconnect.
  useEffect(() => {
    if (wantsAudio && status.error) scheduleRetry('Lost the stream.')
  }, [wantsAudio, status.error, scheduleRetry])

  // Stall watchdog: wanted audio but nothing for a while.
  useEffect(() => {
    if (!wantsAudio || status.playing || isOffline) return
    const id = setTimeout(() => scheduleRetry('The stream is taking too long.'), STALL_MS)
    return () => clearTimeout(id)
  }, [wantsAudio, status.playing, isOffline, scheduleRetry])

  // Play / pause pressed on the lock screen or notification keeps our intent in sync.
  useEffect(() => {
    const sub = player.addListener('playbackStatusUpdate', (s) => {
      if (!wantsRef.current && s.playing) {
        setWants(true)
        return
      }
      if (
        wantsRef.current &&
        s.isLoaded &&
        !s.playing &&
        !s.isBuffering &&
        !s.error &&
        !retryTimerRef.current &&
        Date.now() - startedAtRef.current > EXTERNAL_PAUSE_GRACE_MS
      ) {
        setWants(false)
      }
    })
    return () => sub.remove()
  }, [player, setWants])

  // Back online → jump straight to the live edge.
  const wasOfflineRef = useRef(isOffline)
  useEffect(() => {
    if (wasOfflineRef.current && !isOffline && wantsAudio && settings.autoReconnect) {
      retryRef.current = 0
      connect()
    }
    wasOfflineRef.current = isOffline
  }, [isOffline, wantsAudio, settings.autoReconnect, connect])

  // Keep lock-screen title in step with the schedule.
  useEffect(() => {
    if (lockScreenRef.current) player.updateLockScreenMetadata(metadata)
  }, [player, metadata])

  // Elapsed live timer
  useEffect(() => {
    if (!status.playing) return
    const id = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [status.playing])

  useEffect(() => clearRetry, [clearRetry])

  const visibleError = status.playing ? null : isOffline && wantsAudio ? OFFLINE_MESSAGE : error

  const value = useMemo<PlayerApi>(
    () => ({
      isPlaying: status.playing,
      isLoading: wantsAudio && !status.playing,
      wantsAudio,
      volume,
      error: visibleError,
      elapsed: formatElapsed(seconds),
      listeners,
      play,
      pause,
      toggle,
      reconnect,
      setVolume,
    }),
    [status.playing, wantsAudio, volume, visibleError, seconds, listeners, play, pause, toggle, reconnect, setVolume],
  )

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
}

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider')
  return ctx
}
