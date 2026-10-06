import { useEffect, useMemo } from 'react'
import { Animated, Easing, View } from 'react-native'
import { colors } from '../theme'

const DURATIONS = [620, 880, 540, 760, 680]

export function Equalizer({
  active,
  bars = 4,
  height = 16,
  color = colors.gold,
}: {
  active: boolean
  bars?: number
  height?: number
  color?: string
}) {
  const values = useMemo(() => Array.from({ length: bars }, () => new Animated.Value(0.35)), [bars])

  useEffect(() => {
    if (!active) {
      values.forEach((v) => v.setValue(0.35))
      return
    }
    const loops = values.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, {
            toValue: 1,
            duration: DURATIONS[i % DURATIONS.length],
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(v, {
            toValue: 0.3,
            duration: DURATIONS[(i + 2) % DURATIONS.length],
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ),
    )
    loops.forEach((l) => l.start())
    return () => loops.forEach((l) => l.stop())
  }, [active, values])

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, height }} accessibilityElementsHidden>
      {values.map((v, i) => (
        <Animated.View
          key={i}
          style={{
            width: 3,
            height,
            borderRadius: 2,
            backgroundColor: color,
            transform: [{ translateY: height / 2 }, { scaleY: v }, { translateY: -height / 2 }],
          }}
        />
      ))}
    </View>
  )
}
