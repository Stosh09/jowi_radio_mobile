import { Pause, Play } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Animated, Pressable, StyleSheet, View } from 'react-native'
import { colors } from '../theme'

export function PlayButton({
  isPlaying,
  isLoading,
  onPress,
  size = 88,
}: {
  isPlaying: boolean
  isLoading: boolean
  onPress: () => void
  size?: number
}) {
  const [glow] = useState(() => new Animated.Value(0))

  useEffect(() => {
    if (!isPlaying) {
      glow.setValue(0)
      return
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [isPlaying, glow])

  const label = isLoading ? 'Connecting' : isPlaying ? 'Pause live stream' : 'Play live stream'
  const iconSize = size * 0.38

  return (
    <View style={{ width: size * 1.35, height: size * 1.35, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ring,
          {
            width: size * 1.35,
            height: size * 1.35,
            borderRadius: size,
            opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.45] }),
            transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.05] }) }],
          },
        ]}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={({ pressed }) => [
          styles.button,
          { width: size, height: size, borderRadius: size / 2 },
          pressed && { transform: [{ scale: 0.96 }], backgroundColor: colors.goldDark },
        ]}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.black} />
        ) : isPlaying ? (
          <Pause size={iconSize} color={colors.black} fill={colors.black} />
        ) : (
          <Play size={iconSize} color={colors.black} fill={colors.black} style={{ marginLeft: size * 0.06 }} />
        )}
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  ring: { position: 'absolute', backgroundColor: colors.gold },
  button: {
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: colors.gold,
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
  },
})
