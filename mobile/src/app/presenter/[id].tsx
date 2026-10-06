import { Stack, useLocalSearchParams } from 'expo-router'
import { Star } from 'lucide-react-native'
import { View } from 'react-native'
import { LiveBadge } from '../../components/LiveBadge'
import { ShowRow } from '../../components/ShowRow'
import { Button, Card, Initials, Screen, Txt } from '../../components/ui'
import { usePlayer } from '../../context/PlayerContext'
import { usePreferences } from '../../context/PreferencesContext'
import { useNowPlaying } from '../../hooks/useNowPlaying'
import { shareListening } from '../../lib/contact'
import { findPresenter, slotsForPresenter } from '../../lib/scheduleClock'
import { colors, space } from '../../theme'

export default function PresenterScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const presenter = findPresenter(id)
  const { current, clock } = useNowPlaying()
  const { isFavoritePresenter, toggleFavoritePresenter } = usePreferences()
  const { play, isPlaying } = usePlayer()

  if (!presenter) {
    return (
      <Screen padTop={false}>
        <Txt variant="muted">That presenter could not be found.</Txt>
      </Screen>
    )
  }

  const onAir = current?.hostIds.includes(presenter.id) ?? false
  const fav = isFavoritePresenter(presenter.id)
  const shows = slotsForPresenter(presenter.id)

  return (
    <Screen padTop={false}>
      <Stack.Screen options={{ title: presenter.name }} />
      <View style={{ alignItems: 'center', marginTop: space.md }}>
        <Initials name={presenter.name} size={96} />
        <Txt variant="display" style={{ marginTop: space.md, textAlign: 'center', fontSize: 28, lineHeight: 32 }}>
          {presenter.name}
        </Txt>
        <Txt variant="body" style={{ color: colors.gold, marginTop: 4 }}>
          {presenter.role}
        </Txt>
        {onAir ? (
          <View style={{ marginTop: 10 }}>
            <LiveBadge label="On air now" />
          </View>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: space.lg }}>
        <Button
          label={fav ? 'Following' : 'Follow'}
          icon={Star}
          variant={fav ? 'outline' : 'primary'}
          style={{ flex: 1 }}
          onPress={() => toggleFavoritePresenter(presenter.id)}
        />
        {onAir ? (
          <Button
            label={isPlaying ? 'Listening' : 'Listen live'}
            variant="outline"
            style={{ flex: 1 }}
            onPress={() => (isPlaying ? void shareListening(current?.title) : play())}
          />
        ) : null}
      </View>

      <Card style={{ marginTop: space.lg }}>
        <Txt variant="eyebrow">About</Txt>
        <Txt variant="body" style={{ marginTop: 8 }}>
          {presenter.bio}
        </Txt>
      </Card>

      <Txt variant="title" style={{ marginTop: space.xl, marginBottom: 4 }}>
        Shows
      </Txt>
      <Txt variant="small" style={{ marginBottom: 6 }}>
        Tap the bell to be reminded before each show.
      </Txt>
      {shows.map(({ slot, block }) => (
        <View key={slot.id}>
          <Txt variant="eyebrow" style={{ marginTop: 10, color: colors.muted }}>
            {block.day}
          </Txt>
          <ShowRow slot={slot} isLive={block.dayKey === clock.dayKey && current?.id === slot.id} />
        </View>
      ))}
    </Screen>
  )
}
