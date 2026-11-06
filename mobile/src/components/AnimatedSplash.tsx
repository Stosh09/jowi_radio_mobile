import { useEffect, useMemo, useRef, useState } from 'react'
import { AccessibilityInfo, Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native'
import Svg, { Circle, Defs, Ellipse, LinearGradient, Stop, SvgXml } from 'react-native-svg'
import { LAYERS, VIEWBOX } from '../jowiLayers'

const BULL_BROWN = '#4a0f07'; // sampled from the bull's mane and horns, lightened slightly
const BLUE = '#054165';
const RED = '#a60716';
const DUST_FILL = '#d8c9b2';
// Broadcast pulses: gradient rings that radiate out from the badge, staggered, looping until the app is ready.
const PULSES = [
  { id: 'gA', from: '#ff8a1f', to: '#b3111f', width: 6, delay: 0, x1: 0, y1: 0, x2: 1, y2: 1 },
  { id: 'gB', from: '#ffd76e', to: '#ff7a1a', width: 4, delay: 600, x1: 1, y1: 0, x2: 0, y2: 1 },
  { id: 'gC', from: '#1d78b8', to: '#7fdcff', width: 3, delay: 1200, x1: 0, y1: 1, x2: 1, y2: 0 },
] as const;
const PULSE_MS = 1800;
const PULSE_START = 1000; // lines up with the mic lighting up
const PULSE_SCALE = 1.55;
const MIN_MS = 1900; // minimum on-screen time from mount, so the intro always plays
const CAP_MS = 6000; // hard cap: a slow load never traps the user here
const FADE_MS = 250;

/** Four dust puffs near the hooves, in logo units (see docs/jowi-splash-preview.html). */
const DUSTS = [
  { cx: 105, cy: 281, rx: 14, ry: 7 },
  { cx: 170, cy: 283, rx: 12, ry: 6 },
  { cx: 330, cy: 283, rx: 12, ry: 6 },
  { cx: 392, cy: 281, rx: 14, ry: 7 },
] as const;

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

  // Reduced motion: skip slide, toss, squash and pulses; show the final logo for a moment.
  const [reduce, setReduce] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((on) => { if (alive) setReduce(on); })
      .catch(() => { if (alive) setReduce(false); });
    return () => { alive = false; };
  }, []);

  const v = useMemo(() => {
    const t = () => new Animated.Value(0);
    return { disc: t(), ring: t(), ringRed: t(), slide: t(), squash: t(), head: t(), tail: t(), mic: t(), wl: t(), wr: t(), t981: t(), jam: t(), dust: t(), loop: t(), out: new Animated.Value(1) };
  }, []);
  const started = useRef(false);
  const fading = useRef(false);
  const t0Ref = useRef(0);
  const pulse = useMemo(() => PULSES.map(() => new Animated.Value(0)), []);

  // Pulse rings loop while waiting for the app (skipped for reduced motion).
  useEffect(() => {
    if (reduce !== false) return; // wait for the accessibility answer; never run when on
    const loops = pulse.map((p, i) =>
      Animated.sequence([
        Animated.delay(PULSE_START + PULSES[i].delay),
        Animated.loop(Animated.timing(p, { toValue: 1, duration: PULSE_MS, easing: Easing.bezier(0.15, 0.6, 0.3, 1), useNativeDriver: true })),
      ]),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [reduce, pulse]);

  useEffect(() => {
    if (reduce === null || started.current) return;
    started.current = true;
    if (reduce) {
      // Static final frame: everything in its resting state, nothing moving.
      v.disc.setValue(1);
      v.ring.setValue(1);
      v.ringRed.setValue(1);
      v.slide.setValue(1);
      v.squash.setValue(0);
      v.head.setValue(0);
      v.tail.setValue(0);
      v.dust.setValue(1); // dust opacity maps to 0 at the end of its puff
      v.mic.setValue(1);
      v.wl.setValue(1);
      v.wr.setValue(1);
      v.t981.setValue(1);
      v.jam.setValue(1);
      return;
    }
    const tm = (val: Animated.Value, to: number, duration: number, delay: number, easing = Easing.out(Easing.cubic)) =>
      Animated.timing(val, { toValue: to, duration, delay, easing, useNativeDriver: val === v.ring || val === v.ringRed ? false : true });
    Animated.parallel([
      tm(v.disc, 1, 450, 0),
      tm(v.ring, 1, 600, 0), // blue ring draws first…
      tm(v.ringRed, 1, 600, 50), // …red follows 50ms behind
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
  }, [reduce, v]);

  const fadeOut = () => {
    if (fading.current) return;
    fading.current = true;
    Animated.timing(v.out, { toValue: 0, duration: FADE_MS, useNativeDriver: true }).start(() => onFinish());
  };

  // Mount clock + hard cap, no matter what the network does.
  useEffect(() => {
    t0Ref.current = Date.now();
    const cap = setTimeout(fadeOut, CAP_MS);
    return () => clearTimeout(cap);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Once ready, leave after the minimum 1.9s from mount (so the intro always plays).
  useEffect(() => {
    if (!ready) return;
    const wait = Math.max(0, MIN_MS - (Date.now() - t0Ref.current));
    const id = setTimeout(fadeOut, wait);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  /** One tan dust puff: scales from its own centre and rises 10 logo units while fading. */
  const dustPuff = (d: (typeof DUSTS)[number], i: number) => {
    const px = d.cx * k - S / 2;
    const py = d.cy * k - S / 2;
    return (
      <Animated.View
        key={`dust-${i}`}
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: v.dust.interpolate({ inputRange: [0, 1], outputRange: [0.85, 0] }),
            transform: [
              { translateX: px },
              { translateY: py },
              { scale: v.dust.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1.5] }) },
              { translateY: v.dust.interpolate({ inputRange: [0, 1], outputRange: [0, -10 * k] }) },
              { translateX: -px },
              { translateY: -py },
            ],
          },
        ]}
      >
        <Svg width={S} height={S} viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}>
          <Ellipse cx={d.cx} cy={d.cy} rx={d.rx} ry={d.ry} fill={DUST_FILL} />
        </Svg>
      </Animated.View>
    );
  };

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
          <AnimatedCircle cx={222.4} cy={218} r={200.5} stroke={RED} strokeWidth={3} fill="none" strokeDasharray={C2} strokeDashoffset={v.ringRed.interpolate({ inputRange: [0, 1], outputRange: [C2, 0] })} rotation={-90} origin="222.4, 218" />
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
          {DUSTS.map(dustPuff)}
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
