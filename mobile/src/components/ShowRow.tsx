import { Bell, BellRing, Star } from 'lucide-react-native'
import { StyleSheet, Text, View } from 'react-native'
import type { ScheduleSlot } from '@shared/schedule'
import { usePreferences } from '../context/PreferencesContext'
import { haptic } from '../lib/haptics'
import { formatSlotRange } from '../lib/scheduleClock'
import { colors, fonts } from '../theme'
import { Equalizer } from './Equalizer'
import { IconButton, Pill } from './ui'

export function ShowRow({
  slot,
  isLive,
  countdown,
  showActions = true,
}: {
  slot: ScheduleSlot
  isLive?: boolean
  countdown?: string
  showActions?: boolean
}) {
  const { isFavoriteShow, toggleFavoriteShow, hasReminder, toggleReminder } = usePreferences()
  const fav = isFavoriteShow(slot.id)
  const reminder = hasReminder(slot.id)

  return (
    <View style={[styles.row, isLive && styles.live]}>
      <View style={styles.timeCol}>
        <Text style={[styles.time, isLive && { color: colors.gold }]}>{formatSlotRange(slot)}</Text>
        {isLive ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <Pill label="Live" tone="live" />
            <Equalizer active bars={3} height={10} color={colors.live} />
          </View>
        ) : countdown ? (
          <Text style={styles.countdown}>{countdown}</Text>
        ) : null}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.title, isLive && { color: colors.gold }]} numberOfLines={2}>
          {slot.title}
        </Text>
        <Text style={styles.host} numberOfLines={1}>
          {slot.host}
        </Text>
      </View>
      {showActions ? (
        <View style={styles.actions}>
          <IconButton
            icon={Star}
            label={fav ? `Remove ${slot.title} from favourites` : `Favourite ${slot.title}`}
            active={fav}
            size={19}
            onPress={() => toggleFavoriteShow(slot.id)}
          />
          <IconButton
            icon={reminder ? BellRing : Bell}
            label={reminder ? `Turn off reminder for ${slot.title}` : `Remind me before ${slot.title}`}
            active={reminder}
            activeColor={colors.gold}
            size={19}
            onPress={() => {
              void toggleReminder(slot.id).then((on) => {
                if (on) haptic.success()
              })
            }}
          />
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  live: { backgroundColor: 'rgba(232,163,23,0.06)', borderRadius: 8, paddingHorizontal: 8 },
  timeCol: { width: 104 },
  time: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.muted, fontVariant: ['tabular-nums'] },
  countdown: { fontFamily: fonts.body, fontSize: 11, color: colors.gold, marginTop: 3 },
  title: { fontFamily: fonts.bodySemi, fontSize: 16, color: colors.white },
  host: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 1 },
  actions: { flexDirection: 'row', alignItems: 'center' },
})
