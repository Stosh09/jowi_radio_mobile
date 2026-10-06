import Constants from 'expo-constants'
import { Image } from 'expo-image'
import { router, type Href } from 'expo-router'
import { ChevronRight, Info, Lock, Megaphone, Settings, Star, type LucideIcon } from 'lucide-react-native'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { STATION } from '@shared/station'
import { ContactActions } from '../../components/ContactActions'
import { SocialRow } from '../../components/SocialIcons'
import { Screen, Txt } from '../../components/ui'
import { usePreferences } from '../../context/PreferencesContext'
import { usePresenterAuth } from '../../context/PresenterAuthContext'
import { colors, fonts, radius, space } from '../../theme'

function Row({ icon: Icon, label, detail, href }: { icon: LucideIcon; label: string; detail?: string; href: Href }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => router.push(href)}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.panel }]}
    >
      <View style={styles.rowIcon}>
        <Icon size={18} color={colors.gold} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {detail ? <Text style={styles.rowDetail}>{detail}</Text> : null}
      </View>
      <ChevronRight size={18} color={colors.muted} />
    </Pressable>
  )
}

export default function MoreScreen() {
  const { favorites, reminders } = usePreferences()
  const { isPresenter } = usePresenterAuth()
  const saved = favorites.shows.length + favorites.presenters.length

  return (
    <Screen>
      <View style={styles.brand}>
        <Image source={require('../../../assets/logo.png')} style={styles.logo} contentFit="contain" />
        <View>
          <Txt variant="title">{STATION.name}</Txt>
          <Txt variant="script">{STATION.tagline}</Txt>
        </View>
      </View>

      <View style={styles.group}>
        <Row
          icon={Star}
          label="My JOWI"
          detail={`${saved} favourite${saved === 1 ? '' : 's'} · ${reminders.length} reminder${reminders.length === 1 ? '' : 's'}`}
          href="/my-jowi"
        />
        <Row icon={Info} label="About & contact" detail="Our story, studio line" href="/about" />
        <Row icon={Megaphone} label="Advertise with us" detail="Rate card & listen banner" href="/advertise" />
        <Row icon={Settings} label="Settings" detail="Notifications, playback, haptics" href="/settings" />
      </View>

      <Txt variant="eyebrow" style={{ marginTop: space.xl, marginBottom: space.md }}>
        Reach the studio
      </Txt>
      <ContactActions />

      <Txt variant="eyebrow" style={{ marginTop: space.xl, marginBottom: space.md }}>
        Follow JOWI
      </Txt>
      <SocialRow />

      <View style={[styles.group, { marginTop: space.xl }]}>
        <Row
          icon={Lock}
          label="Presenter booth"
          detail={isPresenter ? 'Signed in · news, inbox, poll, alerts' : 'Staff only — studio PIN'}
          href="/booth"
        />
      </View>

      <Txt variant="small" style={{ textAlign: 'center', marginTop: space.xl }}>
        {STATION.name} · v{Constants.expoConfig?.version ?? '1.0.0'}
      </Txt>
    </Screen>
  )
}

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: space.xl },
  logo: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.white },
  group: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, overflow: 'hidden', backgroundColor: 'rgba(21,25,30,0.75)' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { fontFamily: fonts.bodySemi, fontSize: 16, color: colors.white },
  rowDetail: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 1 },
})
