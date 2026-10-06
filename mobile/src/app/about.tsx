import { Mail, MapPin, Phone } from 'lucide-react-native'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { STATION } from '@shared/station'
import { ContactActions } from '../components/ContactActions'
import { SocialRow } from '../components/SocialIcons'
import { Card, Screen, Txt } from '../components/ui'
import { callStudio, emailStudio } from '../lib/contact'
import { colors, fonts, space } from '../theme'

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  )
}

export default function AboutScreen() {
  return (
    <Screen padTop={false}>
      <Txt variant="eyebrow">Our story</Txt>
      <Txt variant="display" style={{ marginTop: 6 }}>
        About {STATION.shortName}
      </Txt>
      <Txt variant="body" style={{ marginTop: space.md, fontSize: 17, lineHeight: 26, color: colors.muted }}>
        {STATION.about.blurb}
      </Txt>

      <View style={styles.facts}>
        <Fact label="Frequency" value={STATION.frequency} />
        <Fact label="Based in" value={STATION.about.location} />
        <Fact label="On air since" value={STATION.about.founded} />
      </View>

      <Txt variant="title" style={{ marginTop: space.xl }}>
        Contact the studio
      </Txt>
      <View style={{ marginTop: space.md }}>
        <ContactActions />
      </View>

      <Card style={{ marginTop: space.lg, gap: 14 }}>
        <Pressable onPress={() => void emailStudio()} style={styles.line} accessibilityRole="link">
          <Mail size={18} color={colors.gold} />
          <Text style={styles.lineText}>{STATION.about.email}</Text>
        </Pressable>
        <Pressable onPress={() => void callStudio()} style={styles.line} accessibilityRole="link">
          <Phone size={18} color={colors.gold} />
          <Text style={styles.lineText}>{STATION.about.phone}</Text>
        </Pressable>
        <View style={styles.line}>
          <MapPin size={18} color={colors.gold} />
          <Text style={styles.lineText}>{STATION.about.location}</Text>
        </View>
      </Card>

      <Txt variant="eyebrow" style={{ marginTop: space.xl, marginBottom: space.md }}>
        Follow us
      </Txt>
      <SocialRow />
    </Screen>
  )
}

const styles = StyleSheet.create({
  facts: { flexDirection: 'row', gap: 12, marginTop: space.xl },
  fact: { flex: 1, borderTopWidth: 2, borderTopColor: colors.gold, paddingTop: 10 },
  factLabel: { fontFamily: fonts.bodySemi, fontSize: 10, letterSpacing: 1.4, color: colors.muted, textTransform: 'uppercase' },
  factValue: { fontFamily: fonts.display, fontSize: 18, color: colors.white, marginTop: 4 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lineText: { fontFamily: fonts.body, fontSize: 16, color: colors.ink },
})
