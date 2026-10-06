import { router } from 'expo-router'
import { View } from 'react-native'
import { PresenterCard } from '../components/PresenterCard'
import { ShowRow } from '../components/ShowRow'
import { Button, Card, Screen, Segmented, Txt } from '../components/ui'
import { REMINDER_LEAD_OPTIONS, usePreferences } from '../context/PreferencesContext'
import { useNowPlaying } from '../hooks/useNowPlaying'
import { findPresenter, findSlot } from '../lib/scheduleClock'
import { colors, space } from '../theme'

export default function MyJowiScreen() {
  const { favorites, reminders, settings, updateSettings } = usePreferences()
  const { current, clock } = useNowPlaying()

  const shows = favorites.shows.map(findSlot).filter((x) => x != null)
  const reminderShows = reminders.map(findSlot).filter((x) => x != null)
  const presenters = favorites.presenters.map(findPresenter).filter((x) => x != null)

  const isLive = (slotId: string, dayKey: string) => dayKey === clock.dayKey && current?.id === slotId

  return (
    <Screen padTop={false}>
      <Txt variant="muted">Your favourite shows, presenters you follow, and show reminders — saved on this phone.</Txt>

      <Txt variant="title" style={{ marginTop: space.xl }}>
        Reminders
      </Txt>
      <Txt variant="small" style={{ marginTop: 4 }}>
        Notify me before a show starts
      </Txt>
      <View style={{ marginTop: space.md }}>
        <Segmented
          value={String(settings.reminderLead)}
          onChange={(v) => updateSettings({ reminderLead: Number(v) })}
          options={REMINDER_LEAD_OPTIONS.map((m) => ({ value: String(m), label: m === 0 ? 'At start' : `${m} min` }))}
        />
      </View>
      {reminderShows.length === 0 ? (
        <Txt variant="muted" style={{ marginTop: space.md }}>
          No reminders yet. Tap the bell next to a show on the schedule.
        </Txt>
      ) : (
        reminderShows.map(({ slot, block }) => (
          <View key={slot.id}>
            <Txt variant="eyebrow" style={{ marginTop: 10, color: colors.muted }}>
              {block.day}
            </Txt>
            <ShowRow slot={slot} isLive={isLive(slot.id, block.dayKey)} />
          </View>
        ))
      )}

      <Txt variant="title" style={{ marginTop: space.xl }}>
        Favourite shows
      </Txt>
      {shows.length === 0 ? (
        <Txt variant="muted" style={{ marginTop: space.sm }}>
          Tap the star next to a show to save it here.
        </Txt>
      ) : (
        shows.map(({ slot, block }) => (
          <View key={slot.id}>
            <Txt variant="eyebrow" style={{ marginTop: 10, color: colors.muted }}>
              {block.day}
            </Txt>
            <ShowRow slot={slot} isLive={isLive(slot.id, block.dayKey)} />
          </View>
        ))
      )}

      <Txt variant="title" style={{ marginTop: space.xl, marginBottom: space.md }}>
        Presenters you follow
      </Txt>
      {presenters.length === 0 ? (
        <Txt variant="muted">Follow presenters to see when they are on air.</Txt>
      ) : (
        <View style={{ gap: 10 }}>
          {presenters.map((p) => (
            <PresenterCard key={p.id} presenter={p} onAir={current?.hostIds.includes(p.id)} />
          ))}
        </View>
      )}

      {shows.length + presenters.length + reminderShows.length === 0 ? (
        <Card tone="gold" style={{ marginTop: space.xl }}>
          <Txt variant="heading">Build your JOWI</Txt>
          <Txt variant="muted" style={{ marginTop: 4 }}>
            Browse the schedule and presenters to start saving favourites.
          </Txt>
          <Button label="Open schedule" compact style={{ marginTop: 12, alignSelf: 'flex-start' }} onPress={() => router.navigate('/schedule')} />
        </Card>
      ) : null}
    </Screen>
  )
}
