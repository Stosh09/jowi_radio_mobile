import { useEffect, useState } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import { colors, fonts } from '../theme'

export function LiveBadge({ label = 'Live' }: { label?: string }) {
  const [pulse] = useState(() => new Animated.Value(1))

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.35, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [pulse])

  return (
    <View style={styles.badge} accessibilityLabel="On air live">
      <Animated.View style={[styles.dot, { opacity: pulse }]} />
      <Text style={styles.text}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.live,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.white },
  text: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1.6, color: colors.white, textTransform: 'uppercase' },
})
