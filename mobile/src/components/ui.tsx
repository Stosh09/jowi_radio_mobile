import type { LucideIcon } from 'lucide-react-native'
import { forwardRef, type ReactNode } from 'react'
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableProps,
  type ScrollViewProps,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { haptic } from '../lib/haptics'
import { colors, fonts, radius, space } from '../theme'

type TxtVariant = 'display' | 'title' | 'heading' | 'body' | 'muted' | 'small' | 'eyebrow' | 'script' | 'mono'

const txtStyles: Record<TxtVariant, TextStyle> = {
  display: { fontFamily: fonts.display, fontSize: 34, lineHeight: 36, color: colors.white, textTransform: 'uppercase', letterSpacing: -0.6 },
  title: { fontFamily: fonts.display, fontSize: 24, lineHeight: 28, color: colors.white, textTransform: 'uppercase', letterSpacing: -0.4 },
  heading: { fontFamily: fonts.displayBold, fontSize: 18, lineHeight: 22, color: colors.white, textTransform: 'uppercase', letterSpacing: -0.2 },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 23, color: colors.ink },
  muted: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.muted },
  small: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.muted },
  eyebrow: { fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 2.2, color: colors.gold, textTransform: 'uppercase' },
  script: { fontFamily: fonts.script, fontSize: 24, lineHeight: 26, color: colors.gold },
  mono: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.gold, fontVariant: ['tabular-nums'] },
}

export function Txt({ variant = 'body', style, ...rest }: TextProps & { variant?: TxtVariant }) {
  return <Text {...rest} style={[txtStyles[variant], style]} />
}

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger'

interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  label: string
  variant?: ButtonVariant
  icon?: LucideIcon
  loading?: boolean
  compact?: boolean
  block?: boolean
  style?: StyleProp<ViewStyle>
}

export function Button({
  label,
  variant = 'primary',
  icon: Icon,
  loading,
  compact,
  block,
  disabled,
  style,
  onPress,
  ...rest
}: ButtonProps) {
  const fg = variant === 'primary' ? colors.black : variant === 'danger' ? colors.error : colors.white
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      onPress={(e) => {
        haptic.tap()
        onPress?.(e)
      }}
      style={({ pressed }) => [
        styles.btn,
        compact && styles.btnCompact,
        block && styles.btnBlock,
        variant === 'primary' && { backgroundColor: pressed ? colors.goldDark : colors.gold },
        variant === 'outline' && [styles.btnOutline, pressed && { borderColor: colors.goldLine }],
        variant === 'danger' && [styles.btnOutline, { borderColor: 'rgba(252,165,165,0.35)' }],
        variant === 'ghost' && pressed && { backgroundColor: 'rgba(255,255,255,0.06)' },
        (disabled || loading) && { opacity: 0.55 },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : Icon ? (
        <Icon size={compact ? 15 : 18} color={fg} />
      ) : null}
      <Text
        style={[
          styles.btnLabel,
          compact && { fontSize: 12 },
          { color: variant === 'ghost' ? colors.gold : fg },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  )
}

export function IconButton({
  icon: Icon,
  label,
  onPress,
  active,
  activeColor = colors.gold,
  size = 20,
  style,
}: {
  icon: LucideIcon
  label: string
  onPress: () => void
  active?: boolean
  activeColor?: string
  size?: number
  style?: StyleProp<ViewStyle>
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      hitSlop={8}
      onPress={() => {
        haptic.tap()
        onPress()
      }}
      style={({ pressed }) => [styles.iconBtn, pressed && { backgroundColor: 'rgba(255,255,255,0.08)' }, style]}
    >
      <Icon
        size={size}
        color={active ? activeColor : colors.muted}
        fill={active ? activeColor : 'transparent'}
      />
    </Pressable>
  )
}

export function Card({
  children,
  style,
  tone = 'default',
}: {
  children: ReactNode
  style?: StyleProp<ViewStyle>
  tone?: 'default' | 'gold' | 'live' | 'flat'
}) {
  return (
    <View
      style={[
        styles.card,
        tone === 'gold' && { borderColor: colors.goldLine, backgroundColor: colors.goldSoft },
        tone === 'live' && { borderColor: 'rgba(229,57,53,0.4)', backgroundColor: colors.liveSoft },
        tone === 'flat' && { backgroundColor: 'rgba(0,0,0,0.3)' },
        style,
      ]}
    >
      {children}
    </View>
  )
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1 }}>
        {eyebrow ? <Txt variant="eyebrow">{eyebrow}</Txt> : null}
        <Txt variant="title" style={{ marginTop: eyebrow ? 6 : 0 }}>
          {title}
        </Txt>
        {subtitle ? (
          <Txt variant="muted" style={{ marginTop: 6 }}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {action}
    </View>
  )
}

export function Notice({
  tone = 'info',
  children,
  action,
}: {
  tone?: 'info' | 'warn' | 'error' | 'success'
  children: ReactNode
  action?: ReactNode
}) {
  const palette = {
    info: { bg: colors.goldSoft, border: colors.goldLine, fg: colors.gold },
    warn: { bg: colors.warnSoft, border: 'rgba(245,158,11,0.4)', fg: colors.warn },
    error: { bg: colors.liveSoft, border: 'rgba(229,57,53,0.4)', fg: colors.error },
    success: { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.35)', fg: colors.success },
  }[tone]
  return (
    <View style={[styles.notice, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      <Text style={[styles.noticeText, { color: palette.fg }]}>{children}</Text>
      {action}
    </View>
  )
}

export const Field = forwardRef<TextInput, TextInputProps & { label: string; hint?: string }>(
  function Field({ label, hint, style, multiline, ...rest }, ref) {
    return (
      <View style={{ marginTop: space.md }}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <TextInput
          ref={ref}
          placeholderTextColor="rgba(154,163,173,0.6)"
          selectionColor={colors.gold}
          cursorColor={colors.gold}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          style={[styles.input, multiline && { minHeight: 96, paddingTop: 10 }, style]}
          {...rest}
        />
        {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
      </View>
    )
  },
)

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; badge?: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.segmented}>
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => {
              haptic.tap()
              onChange(opt.value)
            }}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text style={[styles.segmentLabel, active && { color: colors.black }]}>{opt.label}</Text>
            {opt.badge ? (
              <Text style={[styles.segmentBadge, active && { color: colors.black }]}>{opt.badge}</Text>
            ) : null}
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

export const BOTTOM_CHROME = 32

export function Screen({
  children,
  onRefresh,
  refreshing = false,
  padTop = true,
  contentStyle,
  ...rest
}: ScrollViewProps & {
  onRefresh?: () => void
  refreshing?: boolean
  padTop?: boolean
  contentStyle?: StyleProp<ViewStyle>
}) {
  const insets = useSafeAreaInsets()
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={[
        { paddingHorizontal: space.lg, paddingTop: padTop ? insets.top + space.lg : space.lg, paddingBottom: BOTTOM_CHROME },
        contentStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.gold}
            colors={[colors.gold]}
            progressBackgroundColor={colors.card}
          />
        ) : undefined
      }
      {...rest}
    >
      {children}
    </ScrollView>
  )
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: colors.line }, style]} />
}

export function Pill({ label, tone = 'gold' }: { label: string; tone?: 'gold' | 'live' | 'muted' | 'accent' }) {
  const bg = { gold: colors.gold, live: colors.live, muted: 'rgba(255,255,255,0.1)', accent: colors.accent }[tone]
  const fg = tone === 'gold' ? colors.black : tone === 'muted' ? colors.muted : colors.white
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.pillText, { color: fg }]}>{label}</Text>
    </View>
  )
}

export function Initials({ name, size = 52 }: { name: string; size?: number }) {
  const initials = name
    .split(/[\s/]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.goldSoft,
        borderWidth: 1,
        borderColor: colors.goldLine,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontFamily: fonts.display, color: colors.gold, fontSize: size * 0.36 }}>{initials}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: radius.sm,
    minHeight: 46,
  },
  btnCompact: { paddingHorizontal: 12, paddingVertical: 8, minHeight: 36 },
  btnBlock: { alignSelf: 'stretch' },
  btnOutline: { borderWidth: 1, borderColor: colors.lineStrong },
  btnLabel: { fontFamily: fonts.bodyBold, fontSize: 14, letterSpacing: 0.8, textTransform: 'uppercase' },
  iconBtn: { padding: 8, borderRadius: radius.pill },
  card: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: 'rgba(21,25,30,0.75)',
    borderRadius: radius.md,
    padding: space.lg,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', gap: space.md, marginBottom: space.md },
  notice: { borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  noticeText: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  fieldLabel: { fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 1.4, color: colors.muted, textTransform: 'uppercase' },
  fieldHint: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 4 },
  input: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.white,
    fontFamily: fonts.body,
    fontSize: 16,
  },
  segmented: { gap: 8, paddingVertical: 2 },
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  segmentActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  segmentLabel: { fontFamily: fonts.bodySemi, fontSize: 13, letterSpacing: 0.6, color: colors.muted, textTransform: 'uppercase' },
  segmentBadge: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.live },
  pill: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start' },
  pillText: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
})
