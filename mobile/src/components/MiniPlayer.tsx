import { Image } from 'expo-image'
import { router } from 'expo-router'
import { Pause, Play, RotateCw } from 'lucide-react-native'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { STATION } from '@shared/station'
import { usePlayer } from '../context/PlayerContext'
import { useNowPlaying } from '../hooks/useNowPlaying'
import { colors, fonts, radius } from '../theme'
import { Equalizer } from './Equalizer'

export function MiniPlayer() {
  const { isPlaying, isLoading, toggle, reconnect, error, elapsed } = usePlayer()
  const { current, progress } = useNowPlaying()

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open the live player"
      onPress={() => router.navigate('/')}
      style={styles.wrap}
    >
      <View style={[styles.progress, { width: `${Math.round(progress * 100)}%` }]} />
      <Image source={require('../../assets/logo.png')} style={styles.logo} contentFit="contain" />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Equalizer active={isPlaying} bars={3} height={10} />
          <Text style={styles.kicker} numberOfLines={1}>
            {error ? 'Reconnecting' : isPlaying ? `Live · ${elapsed}` : `${STATION.frequency} · Live now`}
          </Text>
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {current?.title ?? `${STATION.shortName} Live`}
        </Text>
        <Text style={styles.host} numberOfLines={1}>
          {error ?? `with ${current?.host ?? 'The booth'}`}
        </Text>
      </View>
      {error ? (
        <Pressable accessibilityLabel="Retry stream" hitSlop={10} onPress={reconnect} style={styles.btn}>
          <RotateCw size={20} color={colors.black} />
        </Pressable>
      ) : (
        <Pressable
          accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
          hitSlop={10}
          onPress={toggle}
          style={styles.btn}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.black} />
          ) : isPlaying ? (
            <Pause size={20} color={colors.black} fill={colors.black} />
          ) : (
            <Play size={20} color={colors.black} fill={colors.black} style={{ marginLeft: 2 }} />
          )}
        </Pressable>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 10,
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: 'rgba(28,34,41,0.97)',
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  progress: { position: 'absolute', left: 0, top: 0, height: 2, backgroundColor: colors.gold },
  logo: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.white },
  kicker: { fontFamily: fonts.bodySemi, fontSize: 10, letterSpacing: 1.4, color: colors.gold, textTransform: 'uppercase' },
  title: { fontFamily: fonts.displayBold, fontSize: 15, color: colors.white, textTransform: 'uppercase' },
  host: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
