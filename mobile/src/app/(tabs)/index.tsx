import Slider from '@react-native-community/slider'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { BellRing, Headphones, MessageCircle, Share2, Volume1, Volume2, X } from 'lucide-react-native'
import { useCallback, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { PRESENTERS, STATION } from '@shared/station'
import { AdDock } from '../../components/AdDock'
import { Equalizer } from '../../components/Equalizer'
import { LiveBadge } from '../../components/LiveBadge'
import { PlayButton } from '../../components/PlayButton'
import { PresenterCard } from '../../components/PresenterCard'
import { ShowRow } from '../../components/ShowRow'
import { Button, Card, Notice, Screen, SectionHeader, Txt } from '../../components/ui'
import { useInteraction } from '../../context/InteractionContext'
import { usePlayer } from '../../context/PlayerContext'
import { usePreferences } from '../../context/PreferencesContext'
import { useNowPlaying } from '../../hooks/useNowPlaying'
import { shareListening, whatsappStudio } from '../../lib/contact'
import { formatSlotStart, getTodayHighlights } from '../../lib/scheduleClock'
import { colors, fonts, radius, space } from '../../theme'

export default function ListenScreen() {
  const insets = useSafeAreaInsets()
  const player = usePlayer()
  const { current, upNext, block, progress, clock } = useNowPlaying()
  const { refresh } = useInteraction()
  const { settings, favorites, setStationAlerts, updateSettings, isFavoriteShow } = usePreferences()
  const [refreshing, setRefreshing] = useState(false)

  const highlights = getTodayHighlights(5)
  const favouritesToday = block.slots.filter((s) => isFavoriteShow(s.id))
  const followedOnAir = current?.hostIds.filter((id) => favorites.presenters.includes(id)) ?? []

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refresh()
    setRefreshing(false)
  }, [refresh])

  return (
    <Screen padTop={false} contentStyle={{ paddingHorizontal: 0 }} onRefresh={onRefresh} refreshing={refreshing}>
      {/* Hero */}
      <View style={styles.hero}>
        <Image source={require('../../../assets/studio-hero.png')} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition={{ top: '28%' }} />
        <LinearGradient
          colors={['rgba(0,0,0,0.82)', 'rgba(0,0,0,0.7)', colors.bg]}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['rgba(232,163,23,0.18)', 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.6 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={[styles.heroInner, { paddingTop: insets.top + space.md }]}>
          <View style={styles.heroTop}>
            <LiveBadge />
            <Text style={styles.onAirText}>On air now</Text>
            <View style={styles.listeners} accessibilityLabel={`${player.listeners} people listening`}>
              <Headphones size={14} color={colors.muted} />
              <Text style={styles.listenersText}>{player.listeners}</Text>
            </View>
          </View>

          <View style={styles.brand}>
            <Image source={require('../../../assets/logo.png')} style={styles.logo} contentFit="contain" />
            <View style={{ flex: 1 }}>
              <Text style={styles.shortName}>{STATION.shortName}</Text>
              <Text style={styles.frequency}>{STATION.frequency}</Text>
              <Txt variant="script">{STATION.tagline}</Txt>
            </View>
          </View>

          <View style={{ marginTop: space.xl }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Txt variant="eyebrow" style={{ color: colors.muted }}>
                Now playing
              </Txt>
              <Equalizer active={player.isPlaying} bars={4} height={12} />
            </View>
            <Text style={styles.showTitle} numberOfLines={2}>
              {current?.title ?? 'JOWI Live'}
            </Text>
            <Txt variant="muted" numberOfLines={1}>
              with {current?.host ?? 'The booth'}
              {current ? `  ·  ${current.time}` : ''}
            </Txt>
            {followedOnAir.length > 0 ? (
              <Txt variant="small" style={{ color: colors.gold, marginTop: 4 }}>
                ★ A presenter you follow is on air
              </Txt>
            ) : null}
            {current ? (
              <View style={styles.showProgress} accessibilityLabel={`${Math.round(progress * 100)} percent through the show`}>
                <View style={[styles.showProgressFill, { width: `${Math.round(progress * 100)}%` }]} />
              </View>
            ) : null}
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            <View style={styles.timerRow}>
              <Text style={styles.timerLabel}>{player.isPlaying ? 'Live for' : 'Tap to listen live'}</Text>
              <Text style={styles.timer}>{player.isPlaying ? player.elapsed : '--:--:--'}</Text>
            </View>

            <View style={{ alignItems: 'center' }}>
              <PlayButton isPlaying={player.isPlaying} isLoading={player.isLoading} onPress={player.toggle} />
            </View>

            {player.error ? (
              <Notice tone="error" action={<Button label="Retry" compact variant="outline" onPress={player.reconnect} />}>
                {player.error}
              </Notice>
            ) : null}

            <View style={styles.volumeRow}>
              <Volume1 size={18} color={colors.muted} />
              <Slider
                style={{ flex: 1, height: 36 }}
                minimumValue={0}
                maximumValue={1}
                value={player.volume}
                onValueChange={player.setVolume}
                minimumTrackTintColor={colors.gold}
                maximumTrackTintColor="rgba(255,255,255,0.18)"
                thumbTintColor={colors.gold}
                accessibilityLabel="Volume"
              />
              <Volume2 size={18} color={colors.muted} />
            </View>

            <View style={styles.actionRow}>
              <Button
                label="Share"
                icon={Share2}
                variant="outline"
                compact
                style={{ flex: 1 }}
                onPress={() => void shareListening(current?.title)}
              />
              <Button
                label="Request"
                icon={MessageCircle}
                variant="outline"
                compact
                style={{ flex: 1 }}
                onPress={() => router.navigate('/interact')}
              />
              <Button
                label="WhatsApp"
                variant="outline"
                compact
                style={{ flex: 1 }}
                onPress={() => void whatsappStudio(`Hi ${STATION.shortName}! Listening to ${current?.title ?? 'the show'} — `)}
              />
            </View>

            <Text style={styles.upNext} numberOfLines={2}>
              {upNext
                ? `Up next: ${upNext.title} with ${upNext.host} · ${formatSlotStart(upNext)}`
                : `Live on ${STATION.name}`}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ paddingHorizontal: space.lg, gap: space.xl }}>
        <AdDock />

        {!settings.stationAlerts && !settings.alertsPromptDismissed ? (
          <Card tone="gold">
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <BellRing size={22} color={colors.gold} />
              <View style={{ flex: 1 }}>
                <Txt variant="heading">Never miss your show</Txt>
                <Txt variant="muted" style={{ marginTop: 4 }}>
                  Turn on station alerts for breaking news and live events, then tap the bell on any show for a reminder.
                </Txt>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                  <Button label="Turn on" compact onPress={() => void setStationAlerts(true)} />
                  <Button label="Not now" compact variant="ghost" onPress={() => updateSettings({ alertsPromptDismissed: true })} />
                </View>
              </View>
              <Pressable accessibilityLabel="Dismiss" hitSlop={10} onPress={() => updateSettings({ alertsPromptDismissed: true })}>
                <X size={18} color={colors.muted} />
              </Pressable>
            </View>
          </Card>
        ) : null}

        <View>
          <SectionHeader
            eyebrow={`Today on air · ${block.day}`}
            title={current ? 'On now & coming up' : 'Coming up today'}
            subtitle={`East Africa Time · it's ${clock.weekdayLabel} ${String(Math.floor(clock.minutes / 60)).padStart(2, '0')}:${String(clock.minutes % 60).padStart(2, '0')} in Nairobi`}
          />
          {highlights.map((slot) => (
            <ShowRow key={slot.id} slot={slot} isLive={current?.id === slot.id} />
          ))}
          <Button label="Full schedule" variant="ghost" style={{ alignSelf: 'flex-start', marginTop: 4 }} onPress={() => router.navigate('/schedule')} />
        </View>

        {favouritesToday.length > 0 ? (
          <View>
            <SectionHeader eyebrow="Your favourites" title="On today" />
            {favouritesToday.map((slot) => (
              <ShowRow key={slot.id} slot={slot} isLive={current?.id === slot.id} />
            ))}
          </View>
        ) : null}

        <View>
          <SectionHeader eyebrow="The booth" title="Meet the presenters" />
          <View style={{ gap: 10 }}>
            {PRESENTERS.slice(0, 3).map((p) => (
              <PresenterCard key={p.id} presenter={p} onAir={current?.hostIds.includes(p.id)} />
            ))}
          </View>
          <Button label="All presenters" variant="ghost" style={{ alignSelf: 'flex-start', marginTop: 4 }} onPress={() => router.navigate('/presenters')} />
        </View>

        <Card tone="gold">
          <Txt variant="title">Talk to the studio</Txt>
          <Txt variant="muted" style={{ marginTop: 6 }}>
            Send shoutouts, request songs, and vote in live polls — presenters see it in the booth.
          </Txt>
          <Button label="Open interact" style={{ marginTop: 14, alignSelf: 'flex-start' }} onPress={() => router.navigate('/interact')} />
        </Card>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  hero: { overflow: 'hidden' },
  heroInner: { paddingHorizontal: space.lg, paddingBottom: space.xl },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  onAirText: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  listeners: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 5 },
  listenersText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.muted, fontVariant: ['tabular-nums'] },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: space.xl },
  logo: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: 'rgba(232,163,23,0.5)',
  },
  shortName: { fontFamily: fonts.display, fontSize: 44, lineHeight: 44, color: colors.white, letterSpacing: -1 },
  frequency: { fontFamily: fonts.display, fontSize: 22, lineHeight: 26, color: colors.gold, textTransform: 'uppercase' },
  showTitle: {
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 32,
    color: colors.white,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  showProgress: { height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.12)', marginTop: 10, overflow: 'hidden' },
  showProgressFill: { height: 3, backgroundColor: colors.gold },
  controls: {
    marginTop: space.xl,
    padding: space.lg,
    gap: space.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  timerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timerLabel: { fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 1.6, color: colors.muted, textTransform: 'uppercase' },
  timer: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.gold, fontVariant: ['tabular-nums'] },
  volumeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionRow: { flexDirection: 'row', gap: 8 },
  upNext: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, lineHeight: 17 },
})
