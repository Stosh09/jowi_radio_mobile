import { Check } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useInteraction } from '../context/InteractionContext'
import { haptic } from '../lib/haptics'
import { colors, fonts, radius } from '../theme'
import { Card, Notice, Txt } from './ui'

export function PollCard() {
  const { activePoll, votes, myVote, totalVotes, vote, backendReady } = useInteraction()
  const [error, setError] = useState<string | null>(null)

  if (!backendReady) {
    return <Txt variant="muted">Live poll is unavailable until the studio connection is set up.</Txt>
  }
  if (!activePoll) {
    return (
      <Card tone="flat">
        <Txt variant="eyebrow">Live poll</Txt>
        <Txt variant="muted" style={{ marginTop: 6 }}>
          No live poll right now — check back during the show.
        </Txt>
      </Card>
    )
  }

  return (
    <Card tone="flat">
      <Txt variant="eyebrow">Live poll</Txt>
      <Txt variant="heading" style={{ marginTop: 6, fontSize: 20, lineHeight: 24 }}>
        {activePoll.question}
      </Txt>
      <View style={{ marginTop: 14, gap: 10 }}>
        {activePoll.options.map((option) => {
          const count = votes[option.id] ?? 0
          const pct = totalVotes ? Math.round((count / totalVotes) * 100) : 0
          const selected = myVote === option.id
          return (
            <Pressable
              key={option.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={`${option.label}, ${pct} percent`}
              onPress={async () => {
                haptic.press()
                setError(null)
                const res = await vote(option.id)
                if (!res.ok) setError(res.error ?? 'Vote failed')
                else haptic.success()
              }}
              style={[styles.option, selected && styles.optionSelected]}
            >
              <View style={[styles.fill, { width: `${pct}%` }]} />
              <View style={styles.optionRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  {selected ? <Check size={16} color={colors.gold} /> : null}
                  <Text style={styles.optionLabel} numberOfLines={2}>
                    {option.label}
                  </Text>
                </View>
                <Text style={styles.optionPct}>
                  {pct}% · {count}
                </Text>
              </View>
            </Pressable>
          )
        })}
      </View>
      <Txt variant="small" style={{ marginTop: 12 }}>
        {totalVotes} vote{totalVotes === 1 ? '' : 's'} so far{myVote ? ' · thanks for voting — tap to change' : ''}
      </Txt>
      {error ? (
        <View style={{ marginTop: 10 }}>
          <Notice tone="warn">{error}</Notice>
        </View>
      ) : null}
    </Card>
  )
}

const styles = StyleSheet.create({
  option: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.sm,
    overflow: 'hidden',
    minHeight: 48,
    justifyContent: 'center',
  },
  optionSelected: { borderColor: colors.gold, backgroundColor: 'rgba(232,163,23,0.08)' },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: 'rgba(232,163,23,0.2)' },
  optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  optionLabel: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.white, flexShrink: 1 },
  optionPct: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.muted, fontVariant: ['tabular-nums'] },
})
