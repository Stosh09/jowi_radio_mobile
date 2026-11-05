import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop, SvgXml } from 'react-native-svg';
import { LAYERS, VIEWBOX } from '../jowiLayers';

const BULL_BROWN = '#4a0f07'; // sampled from the bull's mane and horns, lightened slightly
const BLUE = '#054165';
const RED = '#a60716';
// Broadcast pulses: gradient rings that radiate out from the badge, staggered, looping until the app is ready.
const PULSES = [
  { id: 'gA', from: '#ff8a1f', to: '#b3111f', width: 6, delay: 0, x1: 0, y1: 0, x2: 1, y2: 1 },
  { id: 'gB', from: '#ffd76e', to: '#ff7a1a', width: 4, delay: 600, x1: 1, y1: 0, x2: 0, y2: 1 },
  { id: 'gC', from: '#1d78b8', to: '#7fdcff', width: 3, delay: 1200, x1: 0, y1: 1, x2: 1, y2: 0 },
] as const;
const PULSE_MS = 1800;
const PULSE_START = 1000; // lines up with the mic lighting up
const PULSE_SCALE = 1.55;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  /** Set true when fonts/data are ready; the splash then fades out and calls onDone. */
  ready: boolean;
  onFinish: () => void;
  /** Called once the first frame is on screen, so you can hide the native splash. */
  onLayout?: () => void;
};

export function AnimatedSplash({ ready, onFinish, onLayout }: Props) {
  const { width } = useWindowDimensions();
  const S = Math.min(width * 0.86, 420);
  const k = S / VIEWBOX;

  const v = useMemo(() => {
    const t = () => new Animated.Value(0);
    return { disc: t(), ring: t(), slide: t(), squash: t(), head: t(), tail: t(), mic: t(), wl: t(), wr: t(), t981: t(), jam: t(), dust: t(), loop: t(), out: new Animated.Value(1) };
  }, []);
  const started = useRef(false);
  const pulse = useMemo(() => PULSES.map(() => new Animated.Value(0)), []);
  useEffect(() => {
    const loops = pulse.map((p, i) =>
      Animated.sequence([
        Animated.delay(PULSE_START + PULSES[i].delay),
        Animated.loop(Animated.timing(p, { toValue: 1, duration: PULSE_MS, easing: Easing.bezier(0.15, 0.6, 0.3, 1), useNativeDriver: true })),
      ]),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [pulse]);

  const tm = (val: Animated.Value, to: number, duration: number, delay: number, easing = Easing.out(Easing.cubic)) =>
    Animated.timing(val, { toValue: to, duration, delay, easing, useNativeDriver: val === v.ring ? false : true });

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    Animated.parallel([
      tm(v.disc, 1, 450, 0),
      tm(v.ring, 1, 600, 0),
      tm(v.slide, 1, 550, 300, Easing.out(Easing.back(1.1))),
      tm(v.squash, 1, 250, 750),
      tm(v.head, 1, 500, 800, Easing.inOut(Easing.quad)),
      tm(v.tail, 1, 500, 850, Easing.inOut(Easing.quad)),
      tm(v.dust, 1, 500, 780),
      tm(v.mic, 1, 350, 1000),
      tm(v.wl, 1, 400, 1050, Easing.out(Easing.back(1.3))),
      tm(v.wr, 1, 400, 1100, Easing.out(Easing.back(1.3))),
      tm(v.t981, 1, 350, 1300, Easing.out(Easing.back(1.4))),
      tm(v.jam, 1, 400, 1500),
    ]).start(() => {
      // Keep the mic and waves breathing until the app is ready.
      Animated.loop(
        Animated.sequence([
          Animated.timing(v.loop, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(v.loop, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      ).start();
    });
  }, [v]);

  useEffect(() => {
    if (!ready) return;
    // Let the sequence finish its core beats (~1.9s from mount) before leaving.
    const id = setTimeout(() => {
      Animated.timing(v.out, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => onFinish());
    }, 1900);
    return () => clearTimeout(id);
  }, [ready, onFinish, v]);

  // Rotate around a pivot given in logo coordinates.
  const pivot = (val: Animated.Value, px: number, py: number, deg: number[], ins: number[]) => {
    const cx = px * k - S / 2;
    const cy = py * k - S / 2;
    return [
      { translateX: cx },
      { translateY: cy },
      { rotate: val.interpolate({ inputRange: ins, outputRange: deg.map((d) => `${d}deg`) }) },
      { translateX: -cx },
      { translateY: -cy },
    ];
  };

  const layer = (name: keyof typeof LAYERS, style: any = {}) => (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <SvgXml xml={LAYERS[name]} width={S} height={S} />
    </Animated.View>
  );

  const C1 = 2 * Math.PI * 212;
  const C2 = 2 * Math.PI * 200.5;
  const loopGlow = v.loop.interpolate({ inputRange: [0, 1], outputRange: [1, 0.72] });
  const waveLoop = v.loop.interpolate({ inputRange: [0, 1], outputRange: [1, 0.75] });

  return (
    <Animated.View style={[styles.root, { opacity: v.out }]} onLayout={onLayout}>
      {/* pulse rings live in their own oversized layer so they are not clipped by the badge box */}
      {PULSES.map((p, i) => (
        <Animated.View
          key={p.id}
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: S * PULSE_SCALE,
            height: S * PULSE_SCALE,
            opacity: pulse[i].interpolate({ inputRange: [0, 0.001, 1], outputRange: [0, 0.95, 0] }),
            transform: [{ scale: pulse[i].interpolate({ inputRange: [0, 1], outputRange: [1 / PULSE_SCALE, 1] }) }],
          }}>
          <Svg width="100%" height="100%" viewBox={`${222 - (VIEWBOX / 2) * PULSE_SCALE} ${218 - (VIEWBOX / 2) * PULSE_SCALE} ${VIEWBOX * PULSE_SCALE} ${VIEWBOX * PULSE_SCALE}`}>
            <Defs>
              <LinearGradient id={p.id} x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2}>
                <Stop offset="0" stopColor={p.from} />
                <Stop offset="1" stopColor={p.to} />
              </LinearGradient>
            </Defs>
            <Circle cx={222} cy={218} r={220 * PULSE_SCALE} fill="none" stroke={`url(#${p.id})`} strokeWidth={p.width * PULSE_SCALE} />
          </Svg>
        </Animated.View>
      ))}
      <View style={{ width: S, height: S }}>
        {/* disc + rings */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: v.disc, transform: [{ scale: v.disc.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }] }]}>
          <Svg width={S} height={S} viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}>
            <Circle cx={221.8} cy={217.5} r={217.5} fill="#fff" />
          </Svg>
        </Animated.View>
        <Svg width={S} height={S} viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`} style={StyleSheet.absoluteFill}>
          <AnimatedCircle cx={222.4} cy={218} r={200.5} stroke={RED} strokeWidth={3} fill="none" strokeDasharray={C2} strokeDashoffset={v.ring.interpolate({ inputRange: [0, 1], outputRange: [C2, 0] })} rotation={-90} origin="222.4, 218" />
          <AnimatedCircle cx={221.3} cy={217} r={212} stroke={BLUE} strokeWidth={11} fill="none" strokeDasharray={C1} strokeDashoffset={v.ring.interpolate({ inputRange: [0, 1], outputRange: [C1, 0] })} rotation={-90} origin="221.3, 217" />
        </Svg>

        {/* buffalo: slides in as one piece, squashes on landing */}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: v.slide.interpolate({ inputRange: [0, 0.05, 1], outputRange: [0, 1, 1] }),
              transform: [
                { translateX: v.slide.interpolate({ inputRange: [0, 1], outputRange: [-210 * k, 0] }) },
                { translateY: (285 - 223) * k },
                { scaleX: v.squash.interpolate({ inputRange: [0, 0.4, 1], outputRange: [1, 1.03, 1] }) },
                { scaleY: v.squash.interpolate({ inputRange: [0, 0.4, 1], outputRange: [1, 0.965, 1] }) },
                { translateY: -(285 - 223) * k },
              ],
            },
          ]}>
          {layer('ground')}
          {layer('tail', { transform: pivot(v.tail, 350, 165, [0, 12, -8, 0], [0, 0.4, 0.75, 1]) })}
          {layer('body')}
          {layer('head', { transform: pivot(v.head, 150, 135, [0, 6, -7, 0], [0, 0.35, 0.7, 1]) })}
          {layer('mic', { opacity: Animated.multiply(v.mic, loopGlow) })}
        </Animated.View>

        {/* waves ripple out from the mic, then breathe */}
        {layer('wavesL', { opacity: v.wl, transform: [{ scaleY: Animated.multiply(v.wl.interpolate({ inputRange: [0, 1], outputRange: [0.15, 1] }), waveLoop) }] })}
        {layer('wavesR', { opacity: v.wr, transform: [{ scaleY: Animated.multiply(v.wr.interpolate({ inputRange: [0, 1], outputRange: [0.15, 1] }), waveLoop) }] })}

        {layer('text981', { opacity: v.t981, transform: [{ scale: v.t981.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] })}
        {layer('textJamuomo', { opacity: v.jam, transform: [{ translateY: v.jam.interpolate({ inputRange: [0, 1], outputRange: [8 * k, 0] }) }] })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, backgroundColor: BULL_BROWN, alignItems: 'center', justifyContent: 'center' },
});
