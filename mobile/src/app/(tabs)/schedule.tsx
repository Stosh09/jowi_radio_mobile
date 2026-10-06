import { router } from 'expo-router'
import { BellRing } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { View } from 'react-native'
import { SCHEDULE, type DayKey } from '@shared/station'
import { LiveBadge } from '../../components/LiveBadge'
import { ShowRow } from '../../components/ShowRow'
import { Button, Card, Screen, Segmented, Txt } from '../../components/ui'
import { usePreferences } from '../../context/PreferencesContext'
import { useNowPlaying } from '../../hooks/useNowPlaying'
import { formatCountdown, minutesUntilNextAiring } from '../../lib/scheduleClock'
import { colors, space } from '../../theme'

const TABS: { key: DayKey; label: string }[] = [
  { key: 'weekday', label: 'Weekdays' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
]

export default function ScheduleScreen() {
  const { current, clock } = useNowPlaying()
  const { reminders, settings } = usePreferences()
  const [selected, setSelected] = useState<DayKey | null>(null)
  const activeKey = selected ?? clock.dayKey
  const isToday = activeKey === clock.dayKey

  const block = useMemo(() => SCHEDULE.find((b) => b.dayKey === activeKey) ?? SCHEDULE[0], [activeKey])
  const slots = useMemo(() => [...block.slots].sort((a, b) => a.startMinutes - b.startMinutes), [block])

  return (
    <Screen>
      <Txt variant="eyebrow">Program guide</Txt>
      <Txt variant="display" style={{ marginTop: 6 }}>
        Schedule
      </Txt>
      <Txt variant="muted" style={{ marginTop: 6 }}>
        Official JOWI 98.1 FM line-up. Times are East Africa Time (Nairobi). Tap the star to favourite a show, the bell for a reminder.
      </Txt>

      {current ? (
        <Card tone="gold" style={{ marginTop: space.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <LiveBadge label="Live now" />
            <Txt variant="mono">{current.time}</Txt>
          </View>
          <Txt variant="title" style={{ marginTop: 8 }}>
            {current.title}
          </Txt>
          <Txt variant="muted">with {current.host}</Txt>
        </Card>
      ) : null}

      <View style={{ marginTop: space.lg }}>
        <Segmented
          value={activeKey}
          onChange={setSelected}
          options={TABS.map((t) => ({
            value: t.key,
            label: t.label,
            badge: t.key === clock.dayKey && t.key !== activeKey ? 'Today' : undefined,
          }))}
        />
      </View>

      <Txt variant="heading" style={{ color: colors.gold, marginTop: space.lg, marginBottom: 4 }}>
        {block.day}
      </Txt>
      {slots.map((slot) => {
        const live = isToday && current?.id === slot.id
        const mins = minutesUntilNextAiring(slot, block.dayKey)
        return (
          <ShowRow
            key={slot.id}
            slot={slot}
            isLive={live}
            countdown={!live && mins < 24 * 60 ? formatCountdown(mins) : undefined}
          />
        )
      })}

      <Card style={{ marginTop: space.xl }}>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
          <BellRing size={20} color={colors.gold} />
          <View style={{ flex: 1 }}>
            <Txt variant="body">
              {reminders.length > 0
                ? `${reminders.length} show reminder${reminders.length === 1 ? '' : 's'} on · ${
                    settings.reminderLead ? `${settings.reminderLead} min before` : 'at start time'
                  }`
                : 'Tap the bell on any show to get a reminder before it starts.'}
            </Txt>
            <Button
              label="My JOWI & reminder settings"
              variant="ghost"
              compact
              style={{ alignSelf: 'flex-start', marginTop: 4, paddingHorizontal: 0 }}
              onPress={() => router.push('/my-jowi')}
            />
          </View>
        </View>
      </Card>
    </Screen>
  )
}
