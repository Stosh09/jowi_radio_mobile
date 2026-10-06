import { LinearGradient } from 'expo-linear-gradient'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useRef, useState } from 'react'
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type ImageSourcePropType,
} from 'react-native'
import { haptic } from '../lib/haptics'
import { colors } from '../theme'

/** Layer rectangles in the 442px logo circle (see assets/splash). */
const SRC = 442
const FACE_R = 209.5
const FACE_INSET = SRC / 2 - FACE_R
const LAYERS = {
  bull: { left: 69, top: 105, width: 215, height: 166 },
  mic: { left: 296, top: 105, width: 66, height: 166 },
  wordmark: { left: 54, top: 277, width: 336, height: 61 },
  tagline: { left: 78, top: 337, width: 290, height: 42 },
} as const
/** Native splash: imageWidth 240 in app.json, disc drawn at 64% of the image. */
const NATIVE_DISC = 240 * 0.64

const IMAGES = {
  disc: require('../../assets/splash/disc.png') as ImageSourcePropType,
  bull: require('../../assets/splash/bull.png') as ImageSourcePropType,
  mic: require('../../assets/splash/mic.png') as ImageSourcePropType,
  wordmark: require('../../assets/splash/wordmark.png') as ImageSourcePropType,
  tagline: require('../../assets/splash/tagline.png') as ImageSourcePropType,
}

const native = { useNativeDriver: true } as const
const timing = (value: Animated.Value, toValue: number, duration: number, easing = Easing.out(Easing.cubic)) =>
  Animated.timing(value, { toValue, duration, easing, ...native })

/**
 * Brand intro over the native splash: the bull gallops into the ring, the mic drops,
 * the wordmark rises and "jamuomo…" writes itself in. Tap to skip.
 */
export function AnimatedSplash({ ready, onFinish }: { ready: boolean; onFinish: () => void }) {
  const { width, height } = useWindowDimensions()
  const D = Math.min(width * 0.74, height * 0.42, 320)
  const s = D / SRC
  const face = FACE_R * 2 * s

  const [v] = useState(() => ({
    disc: new Animated.Value(NATIVE_DISC / D),
    halo: new Animated.Value(0),
    bullX: new Animated.Value(-1),
    gallop: new Animated.Value(0),
    amp: new Animated.Value(1),
    squash: new Animated.Value(1),
    dust: new Animated.Value(0),
    ring: new Animated.Value(0),
    mic: new Animated.Value(0),
    word: new Animated.Value(0),
    tagline: new Animated.Value(0),
    pulse: new Animated.Value(1),
    exit: new Animated.Value(0),
  }))
  const [introDone, setIntroDone] = useState(false)
  const startedRef = useRef(false)
  const exitingRef = useRef(false)
  const introRef = useRef<Animated.CompositeAnimation | null>(null)

  const showAll = () => {
    v.disc.setValue(1)
    v.halo.setValue(1)
    v.bullX.setValue(0)
    v.amp.setValue(0)
    v.mic.setValue(1)
    v.word.setValue(1)
    v.tagline.setValue(1)
  }

  const start = async () => {
    if (startedRef.current) return
    startedRef.current = true
    await SplashScreen.hideAsync().catch(() => {})
    if (await AccessibilityInfo.isReduceMotionEnabled()) {
      showAll()
      setTimeout(() => setIntroDone(true), 700)
      return
    }

    const gallop = Animated.loop(timing(v.gallop, 1, 210, Easing.linear), { iterations: 5 })
    const intro = Animated.sequence([
      Animated.parallel([
        Animated.spring(v.disc, { toValue: 1, friction: 7, tension: 60, ...native }),
        timing(v.halo, 1, 500),
      ]),
      Animated.parallel([
        timing(v.bullX, 0, 950),
        gallop,
        Animated.sequence([Animated.delay(550), timing(v.amp, 0, 400, Easing.inOut(Easing.quad))]),
      ]),
      Animated.parallel([
        Animated.sequence([timing(v.squash, 0.92, 90), Animated.spring(v.squash, { toValue: 1, friction: 4, ...native })]),
        timing(v.dust, 1, 650),
        timing(v.ring, 1, 700),
        Animated.sequence([
          Animated.delay(80),
          Animated.spring(v.mic, { toValue: 1, friction: 5, tension: 80, ...native }),
        ]),
        Animated.sequence([Animated.delay(240), timing(v.word, 1, 380)]),
        Animated.sequence([Animated.delay(480), timing(v.tagline, 1, 560, Easing.inOut(Easing.quad))]),
      ]),
      Animated.sequence([timing(v.pulse, 1.06, 180), timing(v.pulse, 1, 260, Easing.inOut(Easing.quad))]),
    ])
    introRef.current = intro
    setTimeout(() => haptic.tap(), 300 + 950)
    intro.start(() => setIntroDone(true))
  }

  const exit = () => {
    if (exitingRef.current) return
    exitingRef.current = true
    timing(v.exit, 1, 380, Easing.in(Easing.quad)).start(() => onFinish())
  }

  useEffect(() => {
    if (introDone && ready) exit()
  })

  const skip = () => {
    introRef.current?.stop()
    showAll()
    setIntroDone(true)
  }

  const pos = (key: keyof typeof LAYERS) => {
    const r = LAYERS[key]
    return {
      position: 'absolute' as const,
      left: (r.left - FACE_INSET) * s,
      top: (r.top - FACE_INSET) * s,
      width: r.width * s,
      height: r.height * s,
    }
  }

  const bob = Animated.multiply(v.gallop.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 0] }), v.amp)
  const bullBox = pos('bull')
  const taglineBox = pos('tagline')

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.root, { opacity: v.exit.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}
      onLayout={() => void start()}
      accessible
      accessibilityLabel="JOWI 98.1 FM"
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={skip} accessibilityRole="button" accessibilityHint="Skip intro">
        <LinearGradient
          colors={['#3D1E07', colors.splashBg, '#170A02']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.center}>
          {[1.95, 1.6, 1.28].map((k, i) => (
            <Animated.View
              key={k}
              style={[
                styles.halo,
                {
                  width: D * k,
                  height: D * k,
                  borderRadius: (D * k) / 2,
                  opacity: Animated.multiply(v.halo, [0.05, 0.08, 0.12][i]),
                },
              ]}
            />
          ))}

          <Animated.View
            style={{
              width: D,
              height: D,
              transform: [
                { scale: Animated.multiply(v.disc, v.pulse) },
                { scale: v.exit.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) },
              ],
            }}
          >
            <Animated.View
              style={[
                styles.ringPulse,
                {
                  width: D,
                  height: D,
                  borderRadius: D / 2,
                  opacity: v.ring.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 0.8, 0] }),
                  transform: [{ scale: v.ring.interpolate({ inputRange: [0, 1], outputRange: [1, 1.22] }) }],
                },
              ]}
            />
            <Image source={IMAGES.disc} style={{ width: D, height: D }} fadeDuration={0} />

            <View
              style={{
                position: 'absolute',
                left: FACE_INSET * s,
                top: FACE_INSET * s,
                width: face,
                height: face,
                borderRadius: face / 2,
                overflow: 'hidden',
              }}
            >
              {[0.2, 0.5, 0.78].map((fx, i) => (
                <Animated.View
                  key={fx}
                  style={[
                    styles.dust,
                    {
                      left: bullBox.left + bullBox.width * fx - D * 0.045,
                      top: bullBox.top + bullBox.height - D * 0.035,
                      width: D * 0.09,
                      height: D * 0.045,
                      borderRadius: D * 0.045,
                      opacity: v.dust.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.35 - i * 0.06, 0] }),
                      transform: [
                        { translateX: v.dust.interpolate({ inputRange: [0, 1], outputRange: [0, -18 - i * 6] }) },
                        { scale: v.dust.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.6] }) },
                      ],
                    },
                  ]}
                />
              ))}

              <Animated.Image
                source={IMAGES.bull}
                fadeDuration={0}
                style={[
                  bullBox,
                  {
                    transform: [
                      { translateX: v.bullX.interpolate({ inputRange: [-1, 0], outputRange: [-(bullBox.left + bullBox.width + 8), 0] }) },
                      { translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [0, -D * 0.07] }) },
                      { rotate: bob.interpolate({ inputRange: [0, 1], outputRange: ['1deg', '-6deg'] }) },
                      { translateY: bullBox.height / 2 },
                      { scaleY: v.squash },
                      { translateY: -bullBox.height / 2 },
                    ],
                  },
                ]}
              />

              <Animated.Image
                source={IMAGES.mic}
                fadeDuration={0}
                style={[
                  pos('mic'),
                  {
                    opacity: v.mic.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
                    transform: [{ translateY: v.mic.interpolate({ inputRange: [0, 1], outputRange: [-D * 0.35, 0] }) }],
                  },
                ]}
              />

              <Animated.Image
                source={IMAGES.wordmark}
                fadeDuration={0}
                style={[
                  pos('wordmark'),
                  {
                    opacity: v.word,
                    transform: [{ translateY: v.word.interpolate({ inputRange: [0, 1], outputRange: [D * 0.06, 0] }) }],
                  },
                ]}
              />

              <Image source={IMAGES.tagline} fadeDuration={0} style={taglineBox} />
              <Animated.View
                style={[
                  taglineBox,
                  styles.wipe,
                  {
                    transform: [
                      { translateX: v.tagline.interpolate({ inputRange: [0, 1], outputRange: [0, taglineBox.width + 4] }) },
                    ],
                  },
                ]}
              />
            </View>
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  root: { zIndex: 100, elevation: 100, backgroundColor: colors.splashBg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', backgroundColor: colors.brandOrange },
  ringPulse: { position: 'absolute', borderWidth: 3, borderColor: colors.brandOrange },
  dust: { position: 'absolute', backgroundColor: colors.brandBrown },
  wipe: { backgroundColor: colors.white },
})
