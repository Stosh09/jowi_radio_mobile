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
import { Alert, Linking } from 'react-native'
import { setHapticsEnabled } from '../lib/haptics'
import {
  registerForStationAlerts,
  requestNotificationPermission,
  syncShowReminders,
} from '../lib/notifications'
import { KEYS, readJson, writeJson } from '../lib/storage'

export interface Settings {
  /** Minutes before a show starts to send the reminder */
  reminderLead: number
  haptics: boolean
  autoReconnect: boolean
  stationAlerts: boolean
  /** Remembered for shoutouts / requests */
  listenerName: string
  /** Home "turn on alerts" card dismissed */
  alertsPromptDismissed: boolean
}

interface Favorites {
  presenters: string[]
  shows: string[]
}

const DEFAULT_SETTINGS: Settings = {
  reminderLead: 10,
  haptics: true,
  autoReconnect: true,
  stationAlerts: false,
  listenerName: '',
  alertsPromptDismissed: false,
}

export const REMINDER_LEAD_OPTIONS = [0, 5, 10, 15, 30] as const

interface PreferencesApi {
  ready: boolean
  settings: Settings
  favorites: Favorites
  reminders: string[]
  alertsStatus: string | null
  updateSettings: (patch: Partial<Settings>) => void
  isFavoritePresenter: (id: string) => boolean
  isFavoriteShow: (slotId: string) => boolean
  toggleFavoritePresenter: (id: string) => void
  toggleFavoriteShow: (slotId: string) => void
  hasReminder: (slotId: string) => boolean
  toggleReminder: (slotId: string) => Promise<boolean>
  setStationAlerts: (enabled: boolean) => Promise<void>
}

const PreferencesContext = createContext<PreferencesApi | null>(null)

function toggleIn(list: string[], id: string) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
}

function promptOpenSettings() {
  Alert.alert(
    'Notifications are off',
    'Allow notifications for JOWI in your phone settings to get show reminders.',
    [
      { text: 'Not now', style: 'cancel' },
      { text: 'Open settings', onPress: () => void Linking.openSettings() },
    ],
  )
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [favorites, setFavorites] = useState<Favorites>({ presenters: [], shows: [] })
  const [reminders, setReminders] = useState<string[]>([])
  const [alertsStatus, setAlertsStatus] = useState<string | null>(null)
  const settingsRef = useRef(settings)
  useEffect(() => {
    settingsRef.current = settings
  }, [settings])

  useEffect(() => {
    void (async () => {
      const [s, f, r] = await Promise.all([
        readJson<Partial<Settings>>(KEYS.settings, {}),
        readJson<Favorites>(KEYS.favorites, { presenters: [], shows: [] }),
        readJson<string[]>(KEYS.reminders, []),
      ])
      const merged = { ...DEFAULT_SETTINGS, ...s }
      setSettings(merged)
      setHapticsEnabled(merged.haptics)
      setFavorites({ presenters: f.presenters ?? [], shows: f.shows ?? [] })
      setReminders(r)
      setReady(true)
      // Re-sync on launch so reminders follow the phone's current time zone.
      void syncShowReminders(r, merged.reminderLead)
      if (merged.stationAlerts) {
        const res = await registerForStationAlerts(true)
        if (!res.ok) setAlertsStatus(res.message)
      }
    })()
  }, [])

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      void writeJson(KEYS.settings, next)
      if (patch.haptics != null) setHapticsEnabled(patch.haptics)
      return next
    })
  }, [])

  // Lead time changed → reschedule every reminder.
  const leadRef = useRef<number | null>(null)
  useEffect(() => {
    if (!ready) return
    if (leadRef.current != null && leadRef.current !== settings.reminderLead) {
      void syncShowReminders(reminders, settings.reminderLead)
    }
    leadRef.current = settings.reminderLead
  }, [ready, settings.reminderLead, reminders])

  const toggleFavoritePresenter = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = { ...prev, presenters: toggleIn(prev.presenters, id) }
      void writeJson(KEYS.favorites, next)
      return next
    })
  }, [])

  const toggleFavoriteShow = useCallback((slotId: string) => {
    setFavorites((prev) => {
      const next = { ...prev, shows: toggleIn(prev.shows, slotId) }
      void writeJson(KEYS.favorites, next)
      return next
    })
  }, [])

  const toggleReminder = useCallback(
    async (slotId: string) => {
      const enabling = !reminders.includes(slotId)
      if (enabling && !(await requestNotificationPermission())) {
        promptOpenSettings()
        return false
      }
      const next = toggleIn(reminders, slotId)
      setReminders(next)
      await writeJson(KEYS.reminders, next)
      await syncShowReminders(next, settingsRef.current.reminderLead)
      return enabling
    },
    [reminders],
  )

  const setStationAlerts = useCallback(
    async (enabled: boolean) => {
      updateSettings({ stationAlerts: enabled, alertsPromptDismissed: true })
      setAlertsStatus(enabled ? 'Connecting…' : null)
      const res = await registerForStationAlerts(enabled)
      if (res.ok) {
        setAlertsStatus(null)
        return
      }
      if (res.reason === 'permission') {
        updateSettings({ stationAlerts: false })
        promptOpenSettings()
        setAlertsStatus(null)
        return
      }
      setAlertsStatus(res.message)
    },
    [updateSettings],
  )

  const value = useMemo<PreferencesApi>(
    () => ({
      ready,
      settings,
      favorites,
      reminders,
      alertsStatus,
      updateSettings,
      isFavoritePresenter: (id) => favorites.presenters.includes(id),
      isFavoriteShow: (slotId) => favorites.shows.includes(slotId),
      toggleFavoritePresenter,
      toggleFavoriteShow,
      hasReminder: (slotId) => reminders.includes(slotId),
      toggleReminder,
      setStationAlerts,
    }),
    [
      ready,
      settings,
      favorites,
      reminders,
      alertsStatus,
      updateSettings,
      toggleFavoritePresenter,
      toggleFavoriteShow,
      toggleReminder,
      setStationAlerts,
    ],
  )

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext)
  if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider')
  return ctx
}
