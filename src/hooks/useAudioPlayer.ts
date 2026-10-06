import { useCallback, useEffect, useRef, useState } from 'react'
import { getStreamUrl } from '../config/station'

interface UseAudioPlayerOptions {
  initialVolume?: number
}

const VOLUME_KEY = 'jowi-volume'

function readStoredVolume(fallback: number) {
  try {
    const raw = localStorage.getItem(VOLUME_KEY)
    if (raw == null) return fallback
    const value = Number(raw)
    if (Number.isFinite(value)) return Math.min(1, Math.max(0, value))
  } catch {
    /* ignore */
  }
  return fallback
}

function getAudioContextConstructor(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null
  return window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ?? null
}

/**
 * HTMLAudioElement.volume is ignored on iOS Safari.
 * We drive loudness through a Web Audio GainNode instead.
 */
export function useAudioPlayer({ initialVolume = 0.75 }: UseAudioPlayerOptions = {}) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const contextRef = useRef<AudioContext | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const graphReadyRef = useRef(false)

  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolumeState] = useState(() => readStoredVolume(initialVolume))
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const applyGain = useCallback((value: number) => {
    const clamped = Math.min(1, Math.max(0, value))
    if (gainRef.current) {
      gainRef.current.gain.value = clamped
    }
    if (audioRef.current) {
      // Helps on Android / desktop; harmless no-op on iOS when graph is active
      audioRef.current.volume = clamped
      audioRef.current.muted = clamped === 0
    }
  }, [])

  const ensureGraph = useCallback(() => {
    const audio = audioRef.current
    if (!audio || graphReadyRef.current) return

    const Ctx = getAudioContextConstructor()
    if (!Ctx) {
      audio.volume = volume
      return
    }

    try {
      const ctx = new Ctx()
      const source = ctx.createMediaElementSource(audio)
      const gain = ctx.createGain()
      gain.gain.value = volume
      source.connect(gain)
      gain.connect(ctx.destination)
      contextRef.current = ctx
      gainRef.current = gain
      graphReadyRef.current = true
    } catch (err) {
      console.warn('Web Audio volume graph unavailable', err)
      audio.volume = volume
    }
  }, [volume])

  useEffect(() => {
    const audio = new Audio()
    audio.preload = 'none'
    audio.crossOrigin = 'anonymous'
    audio.volume = volume
    audioRef.current = audio

    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onWaiting = () => setIsLoading(true)
    const onPlaying = () => setIsLoading(false)
    const onError = () => {
      setIsLoading(false)
      setIsPlaying(false)
      setError('Unable to connect to the stream. Tap play to retry.')
    }

    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('waiting', onWaiting)
    audio.addEventListener('playing', onPlaying)
    audio.addEventListener('error', onError)

    return () => {
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('waiting', onWaiting)
      audio.removeEventListener('playing', onPlaying)
      audio.removeEventListener('error', onError)
      audio.pause()
      audio.src = ''
      void contextRef.current?.close()
      contextRef.current = null
      gainRef.current = null
      graphReadyRef.current = false
    }
  }, [])

  useEffect(() => {
    applyGain(volume)
    try {
      localStorage.setItem(VOLUME_KEY, String(volume))
    } catch {
      /* ignore */
    }
  }, [volume, applyGain])

  const setVolume = useCallback((next: number) => {
    const clamped = Math.min(1, Math.max(0, next))
    setVolumeState(clamped)
    applyGain(clamped)
  }, [applyGain])

  const play = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return

    setError(null)
    setIsLoading(true)

    if (!audio.src) {
      audio.src = getStreamUrl()
    }

    ensureGraph()
    try {
      if (contextRef.current?.state === 'suspended') {
        await contextRef.current.resume()
      }
      applyGain(volume)
      await audio.play()
    } catch {
      setIsLoading(false)
      setError('Playback blocked. Please interact with the page and try again.')
    }
  }, [applyGain, ensureGraph, volume])

  const pause = useCallback(() => {
    audioRef.current?.pause()
  }, [])

  const toggle = useCallback(async () => {
    if (isPlaying) {
      pause()
    } else {
      await play()
    }
  }, [isPlaying, pause, play])

  const reconnect = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return

    audio.pause()
    audio.src = getStreamUrl()
    setError(null)
    await play()
  }, [play])

  return {
    isPlaying,
    isLoading,
    volume,
    error,
    setVolume,
    play,
    pause,
    toggle,
    reconnect,
  }
}
