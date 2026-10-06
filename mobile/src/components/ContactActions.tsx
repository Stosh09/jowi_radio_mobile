import { Mail, MessageSquare, Phone } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { callStudio, emailStudio, smsStudio, whatsappStudio } from '../lib/contact'
import { haptic } from '../lib/haptics'
import { colors, fonts, radius } from '../theme'
import { BrandIcon } from './SocialIcons'

function Action({ label, icon, onPress, primary }: { label: string; icon: ReactNode; onPress: () => void; primary?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        haptic.press()
        onPress()
      }}
      style={({ pressed }) => [
        styles.action,
        primary && { backgroundColor: colors.gold, borderColor: colors.gold },
        pressed && { opacity: 0.8 },
      ]}
    >
      {icon}
      <Text style={[styles.label, primary && { color: colors.black }]}>{label}</Text>
    </Pressable>
  )
}

/** One-tap ways to reach the studio line. */
export function ContactActions() {
  return (
    <View style={styles.grid}>
      <Action
        primary
        label="WhatsApp"
        icon={<BrandIcon name="whatsapp" size={22} color={colors.black} />}
        onPress={() => void whatsappStudio()}
      />
      <Action label="Call" icon={<Phone size={22} color={colors.gold} />} onPress={() => void callStudio()} />
      <Action label="SMS" icon={<MessageSquare size={22} color={colors.gold} />} onPress={() => void smsStudio()} />
      <Action label="Email" icon={<Mail size={22} color={colors.gold} />} onPress={() => void emailStudio()} />
    </View>
  )
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: 10 },
  action: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: 'rgba(21,25,30,0.75)',
  },
  label: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.white, letterSpacing: 0.4 },
})
