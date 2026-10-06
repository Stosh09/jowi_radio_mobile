import { router } from 'expo-router'
import { ChevronRight, Star } from 'lucide-react-native'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { Presenter } from '@shared/schedule'
import { usePreferences } from '../context/PreferencesContext'
import { colors, fonts, radius } from '../theme'
import { IconButton, Initials, Pill } from './ui'

export function PresenterCard({ presenter, onAir }: { presenter: Presenter; onAir?: boolean }) {
  const { isFavoritePresenter, toggleFavoritePresenter } = usePreferences()
  const fav = isFavoritePresenter(presenter.id)

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${presenter.name}, ${presenter.role}`}
      onPress={() => router.push({ pathname: '/presenter/[id]', params: { id: presenter.id } })}
      style={({ pressed }) => [styles.card, onAir && styles.onAir, pressed && { backgroundColor: colors.panel }]}
    >
      <Initials name={presenter.name} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={styles.name} numberOfLines={1}>
            {presenter.name}
          </Text>
          {onAir ? <Pill label="On air" tone="live" /> : null}
        </View>
        <Text style={styles.role} numberOfLines={1}>
          {presenter.role}
        </Text>
        <Text style={styles.show} numberOfLines={1}>
          {presenter.show}
        </Text>
      </View>
      <IconButton
        icon={Star}
        label={fav ? `Unfollow ${presenter.name}` : `Follow ${presenter.name}`}
        active={fav}
        onPress={() => toggleFavoritePresenter(presenter.id)}
      />
      <ChevronRight size={18} color={colors.muted} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: 'rgba(21,25,30,0.75)',
  },
  onAir: { borderColor: colors.goldLine, backgroundColor: colors.goldSoft },
  name: { fontFamily: fonts.displayBold, fontSize: 16, color: colors.white, textTransform: 'uppercase', flexShrink: 1 },
  role: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.gold, marginTop: 2 },
  show: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 1 },
})
