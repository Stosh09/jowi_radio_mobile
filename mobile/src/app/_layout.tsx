import { Caveat_600SemiBold } from '@expo-google-fonts/caveat/600SemiBold'
import { Outfit_400Regular } from '@expo-google-fonts/outfit/400Regular'
import { Outfit_500Medium } from '@expo-google-fonts/outfit/500Medium'
import { Outfit_600SemiBold } from '@expo-google-fonts/outfit/600SemiBold'
import { Outfit_700Bold } from '@expo-google-fonts/outfit/700Bold'
import { Syne_700Bold } from '@expo-google-fonts/syne/700Bold'
import { Syne_800ExtraBold } from '@expo-google-fonts/syne/800ExtraBold'
import { useFonts } from 'expo-font'
import * as Notifications from 'expo-notifications'
import { router, Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import * as SystemUI from 'expo-system-ui'
import { useEffect, useRef, useState } from 'react'
import { View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AnimatedSplash } from '../components/AnimatedSplash'
import { OfflineBanner } from '../components/OfflineBanner'
import { InteractionProvider } from '../context/InteractionContext'
import { PlayerProvider, usePlayer } from '../context/PlayerContext'
import { PreferencesProvider } from '../context/PreferencesContext'
import { PresenterAuthProvider } from '../context/PresenterAuthContext'
import { configureNotifications } from '../lib/notifications'
import { colors, fonts } from '../theme'

void SplashScreen.preventAutoHideAsync()
SplashScreen.setOptions({ duration: 200, fade: true })
void SystemUI.setBackgroundColorAsync(colors.bg)
void configureNotifications()

/** Tapping a reminder or station alert opens the right screen (and can start the stream). */
function useNotificationRouting() {
  const player = usePlayer()
  const playerRef = useRef(player)
  useEffect(() => {
    playerRef.current = player
  }, [player])

  useEffect(() => {
    function handle(response: Notifications.NotificationResponse | null) {
      const data = response?.notification.request.content.data as
        | { url?: unknown; autoplay?: unknown }
        | undefined
      if (!data) return
      if (typeof data.url === 'string') router.navigate(data.url as never)
      if (data.autoplay === true && !playerRef.current.wantsAudio) playerRef.current.play()
    }

    handle(Notifications.getLastNotificationResponse())
    Notifications.clearLastNotificationResponse()
    const sub = Notifications.addNotificationResponseReceivedListener(handle)
    return () => sub.remove()
  }, [])
}

function AppStack() {
  useNotificationRouting()

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <OfflineBanner />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.gold,
          headerTitleStyle: { fontFamily: fonts.displayBold, color: colors.white },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="presenter/[id]" options={{ title: 'Presenter' }} />
        <Stack.Screen name="about" options={{ title: 'About JOWI' }} />
        <Stack.Screen name="advertise" options={{ title: 'Advertise' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        <Stack.Screen name="my-jowi" options={{ title: 'My JOWI' }} />
        <Stack.Screen name="booth" options={{ title: 'Booth desk' }} />
      </Stack>
    </View>
  )
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Syne_700Bold,
    Syne_800ExtraBold,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Caveat_600SemiBold,
  })

  const [introDone, setIntroDone] = useState(false)
  const ready = fontsLoaded || Boolean(fontError)

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {ready ? (
        <PreferencesProvider>
          <PlayerProvider>
            <PresenterAuthProvider>
              <InteractionProvider>
                <AppStack />
              </InteractionProvider>
            </PresenterAuthProvider>
          </PlayerProvider>
        </PreferencesProvider>
      ) : null}
      {!introDone ? <AnimatedSplash ready={ready} onFinish={() => setIntroDone(true)} /> : null}
    </SafeAreaProvider>
  )
}
