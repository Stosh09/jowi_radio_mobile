import { Headphones } from 'lucide-react-native'
import { StyleSheet, View } from 'react-native'
import { useListenerCount } from '../../hooks/useListenerCount'
import { useNowPlaying } from '../../hooks/useNowPlaying'
import { formatSlotRange } from '../../lib/scheduleClock'
import { colors, fonts, radius, space } from '../../theme'
import { LiveBadge } from '../LiveBadge'
import { Txt } from '../ui'

export function ShowStrip() {
  const { current, upNext, progress } = useNowPlaying()
  const listeners = useListenerCount()

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <LiveBadge />
            <Txt variant="eyebrow">On air</Txt>
          </View>
          <Txt variant="heading" style={{ marginTop: 6 }} numberOfLines={1}>
            {current?.title ?? 'JOWI 98.1 FM'}
          </Txt>
          {current ? (
            <Txt variant="small" numberOfLines={1}>
              {current.host} · {formatSlotRange(current)}
            </Txt>
          ) : null}
        </View>
        <View style={styles.listeners}>
          <Headphones size={16} color={colors.gold} />
          <Txt style={styles.count}>{listeners}</Txt>
        </View>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
      </View>
      {upNext ? (
        <Txt variant="small" style={{ marginTop: space.sm }} numberOfLines={1}>
          Up next: <Txt variant="small" style={{ color: colors.white }}>{upNext.title}</Txt> · {formatSlotRange(upNext)}
        </Txt>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: space.lg,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  listeners: {
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.goldSoft,
    borderWidth: 1,
    borderColor: colors.goldLine,
  },
  count: { fontFamily: fonts.bodyBold, color: colors.gold, fontSize: 16, fontVariant: ['tabular-nums'] },
  track: { height: 3, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, marginTop: space.md, overflow: 'hidden' },
  fill: { height: 3, backgroundColor: colors.gold },
})
