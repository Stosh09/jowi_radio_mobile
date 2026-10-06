import { Stack } from 'expo-router'
import { LogOut } from 'lucide-react-native'
import { useState } from 'react'
import { Alert, View } from 'react-native'
import { BoothInbox } from '../components/booth/BoothInbox'
import { BoothLogin } from '../components/booth/BoothLogin'
import { BoothPoll } from '../components/booth/BoothPoll'
import { NewsBoard } from '../components/booth/NewsBoard'
import { ShowStrip } from '../components/booth/ShowStrip'
import { StationAlerts } from '../components/booth/StationAlerts'
import { IconButton, Notice, Screen, Segmented, Txt } from '../components/ui'
import { useInteraction } from '../context/InteractionContext'
import { NewsProvider, useNews } from '../context/NewsContext'
import { usePresenterAuth } from '../context/PresenterAuthContext'
import { space } from '../theme'

type Section = 'news' | 'inbox' | 'poll' | 'alerts'

function BoothDesk() {
  const { hasAuthSession, boothEmail, logout } = usePresenterAuth()
  const news = useNews()
  const interaction = useInteraction()
  const [section, setSection] = useState<Section>('news')
  const [refreshing, setRefreshing] = useState(false)

  const flagged = interaction.messages.filter((m) => m.highlighted && !m.pending).length
  const inboxCount = interaction.messages.filter((m) => !m.pending).length

  const refresh = async () => {
    setRefreshing(true)
    await Promise.all([news.refresh(), interaction.refresh()])
    setRefreshing(false)
  }

  const confirmLogout = () =>
    Alert.alert('Sign out of the booth?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void logout() },
    ])

  return (
    <>
      <Stack.Screen
        options={{ headerRight: () => <IconButton icon={LogOut} label="Sign out" onPress={confirmLogout} /> }}
      />
      <Screen padTop={false} onRefresh={() => void refresh()} refreshing={refreshing} contentStyle={{ gap: space.lg }}>
        <ShowStrip />
        {!hasAuthSession ? (
          <Notice tone="warn">
            {`PIN session only. News text, inbox and polls work; attachments and station alerts need the booth Auth user (${boothEmail}).`}
          </Notice>
        ) : null}
        <Segmented
          value={section}
          onChange={setSection}
          options={[
            { value: 'news', label: 'News', badge: news.live.length ? String(news.live.length) : undefined },
            { value: 'inbox', label: 'Inbox', badge: inboxCount ? String(flagged ? `${flagged}/${inboxCount}` : inboxCount) : undefined },
            { value: 'poll', label: 'Poll' },
            { value: 'alerts', label: 'Alerts' },
          ]}
        />
        {section === 'news' ? <NewsBoard /> : null}
        {section === 'inbox' ? <BoothInbox /> : null}
        {section === 'poll' ? <BoothPoll /> : null}
        {section === 'alerts' ? <StationAlerts /> : null}
      </Screen>
    </>
  )
}

export default function BoothScreen() {
  const { isPresenter } = usePresenterAuth()

  if (!isPresenter) {
    return (
      <Screen padTop={false} contentStyle={{ gap: space.lg }}>
        <View>
          <Txt variant="eyebrow">Studio only</Txt>
          <Txt variant="title" style={{ marginTop: 6 }}>
            Booth desk
          </Txt>
          <Txt variant="muted" style={{ marginTop: 6 }}>
            Read news on air, pick listener messages, run polls and send station alerts — right from your phone.
          </Txt>
        </View>
        <BoothLogin />
      </Screen>
    )
  }

  return (
    <NewsProvider>
      <BoothDesk />
    </NewsProvider>
  )
}
