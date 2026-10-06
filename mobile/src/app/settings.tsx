import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { Linking, StyleSheet, Switch, Text, View } from 'react-native'
import { Button, Card, Notice, Screen, Segmented, Txt } from '../components/ui'
import { REMINDER_LEAD_OPTIONS, usePreferences } from '../context/PreferencesContext'
import { hasNotificationPermission } from '../lib/notifications'
import { colors, fonts, space } from '../theme'

function ToggleRow({
  label,
  detail,
  value,
  onChange,
}: {
  label: string
  detail: string
  value: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.detail}>{detail}</Text>
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ false: 'rgba(255,255,255,0.2)', true: colors.goldDark }}
        thumbColor={value ? colors.gold : '#d1d5db'}
      />
    </View>
  )
}

export default function SettingsScreen() {
  const { settings, updateSettings, setStationAlerts, alertsStatus, reminders } = usePreferences()
  const [permission, setPermission] = useState<boolean | null>(null)

  useEffect(() => {
    void hasNotificationPermission().then(setPermission)
  }, [settings.stationAlerts, reminders.length])

  return (
    <Screen padTop={false}>
      <Txt variant="eyebrow">Notifications</Txt>
      <Card style={{ marginTop: space.sm, paddingVertical: 4 }}>
        <ToggleRow
          label="Station alerts"
          detail="Breaking news, live events and announcements from the studio"
          value={settings.stationAlerts}
          onChange={(v) => void setStationAlerts(v)}
        />
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Show reminders</Text>
            <Text style={styles.detail}>
              {reminders.length} active · manage from the schedule or My JOWI
            </Text>
          </View>
          <Button label="Manage" compact variant="outline" onPress={() => router.push('/my-jowi')} />
        </View>
        <View style={[styles.row, { borderBottomWidth: 0, flexDirection: 'column', alignItems: 'stretch' }]}>
          <Text style={styles.label}>Remind me</Text>
          <View style={{ marginTop: 8 }}>
            <Segmented
              value={String(settings.reminderLead)}
              onChange={(v) => updateSettings({ reminderLead: Number(v) })}
              options={REMINDER_LEAD_OPTIONS.map((m) => ({ value: String(m), label: m === 0 ? 'At start' : `${m} min before` }))}
            />
          </View>
        </View>
      </Card>
      {alertsStatus ? (
        <View style={{ marginTop: space.sm }}>
          <Notice tone="warn">{alertsStatus}</Notice>
        </View>
      ) : null}
      {permission === false && (settings.stationAlerts || reminders.length > 0) ? (
        <View style={{ marginTop: space.sm }}>
          <Notice tone="warn" action={<Button label="Open phone settings" compact variant="outline" onPress={() => void Linking.openSettings()} />}>
            Notifications are blocked for JOWI, so alerts and reminders cannot appear.
          </Notice>
        </View>
      ) : null}

      <Txt variant="eyebrow" style={{ marginTop: space.xl }}>
        Playback
      </Txt>
      <Card style={{ marginTop: space.sm, paddingVertical: 4 }}>
        <ToggleRow
          label="Auto-reconnect"
          detail="Rejoin the live stream automatically after a dropped signal"
          value={settings.autoReconnect}
          onChange={(v) => updateSettings({ autoReconnect: v })}
        />
        <View style={[styles.row, { borderBottomWidth: 0 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Background & lock screen</Text>
            <Text style={styles.detail}>
              JOWI keeps playing with the screen off. Use the notification or lock screen to pause.
            </Text>
          </View>
        </View>
      </Card>

      <Txt variant="eyebrow" style={{ marginTop: space.xl }}>
        Feel
      </Txt>
      <Card style={{ marginTop: space.sm, paddingVertical: 4 }}>
        <ToggleRow
          label="Haptics"
          detail="Gentle vibration on taps, votes and sends"
          value={settings.haptics}
          onChange={(v) => updateSettings({ haptics: v })}
        />
        <View style={[styles.row, { borderBottomWidth: 0 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Name for shoutouts</Text>
            <Text style={styles.detail}>{settings.listenerName || 'Not set — add it on the Interact tab'}</Text>
          </View>
          {settings.listenerName ? (
            <Button label="Clear" compact variant="ghost" onPress={() => updateSettings({ listenerName: '' })} />
          ) : null}
        </View>
      </Card>
    </Screen>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  label: { fontFamily: fonts.bodySemi, fontSize: 16, color: colors.white },
  detail: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 2, lineHeight: 18 },
})
