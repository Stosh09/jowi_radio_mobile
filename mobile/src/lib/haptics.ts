import * as Haptics from 'expo-haptics'

let enabled = true

export function setHapticsEnabled(next: boolean) {
  enabled = next
}

export const haptic = {
  tap() {
    if (enabled) void Haptics.selectionAsync().catch(() => undefined)
  },
  press() {
    if (enabled) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined)
  },
  success() {
    if (enabled) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined)
    }
  },
  warn() {
    if (enabled) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined)
    }
  },
}
