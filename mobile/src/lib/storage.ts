import AsyncStorage from '@react-native-async-storage/async-storage'

export const KEYS = {
  volume: 'jowi-volume',
  voterKey: 'jowi-voter-key',
  favorites: 'jowi-favorites',
  reminders: 'jowi-reminders',
  settings: 'jowi-settings',
  pushToken: 'jowi-push-token',
  listenerName: 'jowi-listener-name',
  cacheMessages: 'jowi-cache-messages',
  cachePoll: 'jowi-cache-poll',
  cacheNews: 'jowi-cache-news',
  cacheListeners: 'jowi-cache-listeners',
  newsUsed: 'jowi-news-used',
  boothSession: 'jowi-presenter-auth',
} as const

export async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key)
    if (raw == null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage full or unavailable — non-fatal */
  }
}

export async function removeKey(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

/** Cached payload with the time it was saved, for "last updated" hints while offline. */
export interface Cached<T> {
  savedAt: string
  data: T
}

export async function readCache<T>(key: string): Promise<Cached<T> | null> {
  return readJson<Cached<T> | null>(key, null)
}

export async function writeCache<T>(key: string, data: T): Promise<void> {
  await writeJson(key, { savedAt: new Date().toISOString(), data } satisfies Cached<T>)
}
