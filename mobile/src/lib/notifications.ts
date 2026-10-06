import Constants from 'expo-constants'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { STATION } from '@shared/station'
import { colors } from '../theme'
import { findSlot, formatSlotStart, toLocalWeekly, weekdaysForDayKey } from './scheduleClock'
import { supabase } from './supabase'

export const CHANNELS = {
  reminders: 'reminders',
  broadcasts: 'broadcasts',
} as const

const REMINDER_PREFIX = 'reminder:'

let configured = false

/** Call once at startup: foreground presentation + Android channels. */
export async function configureNotifications() {
  if (configured) return
  configured = true

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  })

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNELS.reminders, {
      name: 'Show reminders',
      description: 'A heads-up before your favourite JOWI shows start',
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: colors.gold,
      vibrationPattern: [0, 200, 120, 200],
    })
    await Notifications.setNotificationChannelAsync(CHANNELS.broadcasts, {
      name: 'Station alerts',
      description: 'Breaking news, live events and announcements from the studio',
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: colors.gold,
    })
  }
}

export async function hasNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync()
  return status === 'granted'
}

export async function requestNotificationPermission(): Promise<boolean> {
  await configureNotifications()
  const existing = await Notifications.getPermissionsAsync()
  if (existing.status === 'granted') return true
  if (!existing.canAskAgain) return false
  const next = await Notifications.requestPermissionsAsync()
  return next.status === 'granted'
}

/**
 * Replace all scheduled show reminders with the given set.
 * Re-run on launch so reminders follow the phone's current time zone.
 */
export async function syncShowReminders(slotIds: string[], leadMinutes: number): Promise<number> {
  await configureNotifications()

  const scheduled = await Notifications.getAllScheduledNotificationsAsync()
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith(REMINDER_PREFIX))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  )

  if (slotIds.length === 0) return 0
  if (!(await hasNotificationPermission())) return 0

  let count = 0
  for (const slotId of slotIds) {
    const found = findSlot(slotId)
    if (!found) continue
    const { slot, block } = found
    const when = leadMinutes > 0 ? `starts in ${leadMinutes} min` : 'is starting now'

    for (const weekday of weekdaysForDayKey(block.dayKey)) {
      const local = toLocalWeekly(weekday, slot.startMinutes, leadMinutes)
      await Notifications.scheduleNotificationAsync({
        identifier: `${REMINDER_PREFIX}${slot.id}:${weekday}`,
        content: {
          title: `${slot.title} ${when}`,
          body: `With ${slot.host} at ${formatSlotStart(slot)} on ${STATION.name}. Tap to listen live.`,
          data: { url: '/', kind: 'reminder', slotId: slot.id, autoplay: true },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: local.weekday,
          hour: local.hour,
          minute: local.minute,
          channelId: CHANNELS.reminders,
        },
      })
      count += 1
    }
  }
  return count
}

function easProjectId(): string | undefined {
  const fromConfig = Constants.expoConfig?.extra?.eas?.projectId as string | undefined
  return fromConfig ?? Constants.easConfig?.projectId
}

export type PushRegistration =
  | { ok: true; token: string }
  | { ok: false; reason: 'simulator' | 'permission' | 'no-project' | 'no-backend' | 'error'; message: string }

/** Get this phone's Expo push token and store it (opted in or out) in Supabase. */
export async function registerForStationAlerts(enabled: boolean): Promise<PushRegistration> {
  if (!Device.isDevice) {
    return { ok: false, reason: 'simulator', message: 'Push alerts need a real phone.' }
  }
  if (enabled && !(await requestNotificationPermission())) {
    return { ok: false, reason: 'permission', message: 'Notifications are turned off for JOWI in phone settings.' }
  }
  const projectId = easProjectId()
  if (!projectId) {
    return {
      ok: false,
      reason: 'no-project',
      message: 'Station alerts activate once the app is linked to EAS (run `eas init`).',
    }
  }
  if (!supabase) {
    return { ok: false, reason: 'no-backend', message: 'Station alerts need the Supabase connection.' }
  }

  try {
    await configureNotifications()
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId })
    const { error } = await supabase.rpc('register_push_token', {
      p_token: token,
      p_platform: Platform.OS,
      p_enabled: enabled,
    })
    if (error) {
      return { ok: false, reason: 'error', message: error.message }
    }
    return { ok: true, token }
  } catch (err) {
    return { ok: false, reason: 'error', message: err instanceof Error ? err.message : String(err) }
  }
}
