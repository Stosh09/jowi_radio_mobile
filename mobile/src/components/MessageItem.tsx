import { Clock, Mic } from 'lucide-react-native'
import { StyleSheet, Text, View } from 'react-native'
import type { InteractionMessage } from '../context/InteractionContext'
import { colors, fonts } from '../theme'

export function timeAgo(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime())
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return new Date(iso).toLocaleDateString()
}

export function MessageItem({ message }: { message: InteractionMessage }) {
  return (
    <View style={styles.item}>
      <View style={styles.meta}>
        <Text style={[styles.kind, { color: message.kind === 'request' ? colors.accent : colors.gold }]}>
          {message.kind}
        </Text>
        <Text style={styles.dot}>·</Text>
        <Text style={styles.metaText} numberOfLines={1}>
          {message.mine ? `${message.name} (you)` : message.name}
        </Text>
        <Text style={styles.dot}>·</Text>
        <Text style={styles.metaText}>{timeAgo(message.createdAt)}</Text>
      </View>
      {message.song ? <Text style={styles.song}>{message.song}</Text> : null}
      <Text style={styles.text}>{message.text}</Text>
      {message.pending ? (
        <View style={styles.status}>
          <Clock size={12} color={colors.warn} />
          <Text style={[styles.statusText, { color: colors.warn }]}>Waiting for signal — sends automatically</Text>
        </View>
      ) : message.mine && message.highlighted ? (
        <View style={styles.status}>
          <Mic size={12} color={colors.gold} />
          <Text style={[styles.statusText, { color: colors.gold }]}>Picked for air by the booth!</Text>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  item: { paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  kind: { fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase' },
  dot: { color: colors.muted, fontSize: 11 },
  metaText: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8 },
  song: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.white, marginTop: 4 },
  text: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.muted, marginTop: 3 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  statusText: { fontFamily: fonts.bodyMedium, fontSize: 12 },
})
