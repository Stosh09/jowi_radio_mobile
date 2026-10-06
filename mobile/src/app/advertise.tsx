import { Image } from 'expo-image'
import { Check, Mail, Phone, Play } from 'lucide-react-native'
import { StyleSheet, Text, View } from 'react-native'
import type { BannerAd } from '@shared/banners'
import { AD_PACKAGES, STATION } from '@shared/station'
import { AdDock } from '../components/AdDock'
import { BrandIcon } from '../components/SocialIcons'
import { Button, Card, Screen, Txt } from '../components/ui'
import { callStudio, emailStudio, whatsappStudio } from '../lib/contact'
import { colors, fonts, radius, space } from '../theme'

const MOCK_BANNER: BannerAd = {
  id: 'mock-your-brand',
  active: true,
  advertiser: 'Your Business Name',
  headline: 'Your offer reaches listeners here',
  tagline: 'Always visible on the live listen screen',
  ctaLabel: 'Learn more',
  href: '',
  weight: 1,
}

const SUBJECT = `Advertising inquiry — ${STATION.name}`

function Perks({ perks }: { perks: readonly string[] }) {
  return (
    <View style={{ gap: 6, marginTop: 12 }}>
      {perks.map((perk) => (
        <View key={perk} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
          <Check size={16} color={colors.gold} style={{ marginTop: 2 }} />
          <Txt variant="body" style={{ flex: 1, fontSize: 15 }}>
            {perk}
          </Txt>
        </View>
      ))}
    </View>
  )
}

function PlacementMockup() {
  return (
    <View>
      <Text style={styles.mockLabel}>Mockup · Listen screen placement</Text>
      <View style={styles.phone}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, opacity: 0.85 }}>
          <Image source={require('../../assets/logo.png')} style={styles.mockLogo} contentFit="contain" />
          <View>
            <Text style={styles.mockBrand}>
              {STATION.shortName} <Text style={{ color: colors.gold }}>{STATION.frequency}</Text>
            </Text>
            <Text style={styles.mockSub}>Now playing · live show</Text>
          </View>
        </View>
        <View style={styles.mockBar}>
          <View style={styles.mockBarFill} />
        </View>
        <View style={styles.mockPlay}>
          <Play size={18} color={colors.black} fill={colors.black} />
        </View>
        <Text style={styles.mockHere}>Your ad sits here</Text>
        <AdDock preview={MOCK_BANNER} />
      </View>
      <Txt variant="small" style={{ textAlign: 'center', marginTop: 8 }}>
        Shown below the player on every listen session — web and app
      </Txt>
    </View>
  )
}

export default function AdvertiseScreen() {
  const banner = AD_PACKAGES.find((p) => p.id === 'banner')
  const others = AD_PACKAGES.filter((p) => p.id !== 'banner')

  return (
    <Screen padTop={false}>
      <Txt variant="eyebrow">Grow with us</Txt>
      <Txt variant="display" style={{ marginTop: 6 }}>
        Advertise on JOWI
      </Txt>
      <Txt variant="muted" style={{ marginTop: 6 }}>
        Reach local listeners on air, on the website and in the app. Community-station starting prices in KES — final
        quotes depend on dates, length and peak demand.
      </Txt>

      {banner ? (
        <Card tone="gold" style={{ marginTop: space.lg }}>
          <Txt variant="eyebrow">Featured · Digital</Txt>
          <Txt variant="title" style={{ marginTop: 6 }}>
            {banner.name}
          </Txt>
          <Text style={styles.price}>{banner.price}</Text>
          <Txt variant="small">{banner.priceNote}</Txt>
          <Txt variant="muted" style={{ marginTop: 8 }}>
            {banner.description}
          </Txt>
          <Perks perks={banner.perks} />
          <Button
            label="Book listen banner"
            style={{ marginTop: space.lg }}
            onPress={() => void emailStudio(SUBJECT, 'I would like to book the Listen Banner.\n\nBusiness:\nDates:\nBudget:')}
          />
        </Card>
      ) : null}

      <View style={{ marginTop: space.xl }}>
        <PlacementMockup />
      </View>

      <Txt variant="title" style={{ marginTop: space.xl }}>
        On-air & campaign packages
      </Txt>
      <Txt variant="muted" style={{ marginTop: 4 }}>
        Pair a listen banner with spots or sponsorship for the strongest local push.
      </Txt>
      <View style={{ gap: 12, marginTop: space.md }}>
        {others.map((pkg) => (
          <Card key={pkg.id}>
            <Txt variant="heading" style={{ fontSize: 20 }}>
              {pkg.name}
            </Txt>
            <Text style={[styles.price, { fontSize: 18 }]}>{pkg.price}</Text>
            <Txt variant="small">{pkg.priceNote}</Txt>
            <Txt variant="muted" style={{ marginTop: 8 }}>
              {pkg.description}
            </Txt>
            <Perks perks={pkg.perks} />
          </Card>
        ))}
      </View>

      <Card tone="gold" style={{ marginTop: space.xl }}>
        <Txt variant="title">Request a media kit</Txt>
        <Txt variant="muted" style={{ marginTop: 6 }}>
          Send your brand, budget window and preferred dates. Sales confirms inventory and sends artwork specs (logo PNG +
          short headline).
        </Txt>
        <View style={{ gap: 10, marginTop: space.lg }}>
          <Button label="Email advertising team" icon={Mail} onPress={() => void emailStudio(SUBJECT)} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button label="Call" icon={Phone} variant="outline" style={{ flex: 1 }} onPress={() => void callStudio()} />
            <Button
              label="WhatsApp"
              variant="outline"
              style={{ flex: 1 }}
              onPress={() => void whatsappStudio(`Hi ${STATION.shortName} sales — I'd like to advertise. `)}
            />
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}>
          <BrandIcon name="whatsapp" size={12} color={colors.muted} />
          <Txt variant="small">{STATION.about.phone} · office hours</Txt>
        </View>
      </Card>
    </Screen>
  )
}

const styles = StyleSheet.create({
  price: { fontFamily: fonts.bodySemi, fontSize: 22, color: colors.gold, marginTop: 6 },
  mockLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    letterSpacing: 1.8,
    color: colors.muted,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 8,
  },
  phone: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: colors.panel,
    padding: space.lg,
    gap: 12,
  },
  mockLogo: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white },
  mockBrand: { fontFamily: fonts.display, fontSize: 17, color: colors.white },
  mockSub: { fontFamily: fonts.body, fontSize: 11, color: colors.muted },
  mockBar: { height: 5, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  mockBarFill: { width: '40%', height: 5, backgroundColor: colors.gold },
  mockPlay: {
    alignSelf: 'center',
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockHere: { fontFamily: fonts.bodySemi, fontSize: 9, letterSpacing: 1.6, color: colors.gold, textTransform: 'uppercase' },
})
