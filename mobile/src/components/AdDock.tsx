import { Image } from 'expo-image'
import { ExternalLink } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { getActiveBanners, pickBanner, type BannerAd } from '@shared/banners'
import { openExternal } from '../lib/contact'
import { haptic } from '../lib/haptics'
import { colors, fonts, radius } from '../theme'

const ROTATE_MS = 12_000

/** Sponsored strip on the listen screen. Renders nothing when no booking is in flight. */
export function AdDock({ preview }: { preview?: BannerAd }) {
  const [ad, setAd] = useState<BannerAd | null>(() => preview ?? pickBanner(getActiveBanners()))

  useEffect(() => {
    if (preview) return
    if (getActiveBanners().length <= 1) return
    const id = setInterval(() => setAd(pickBanner(getActiveBanners())), ROTATE_MS)
    return () => clearInterval(id)
  }, [preview])

  if (!ad) return null

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`Sponsored: ${ad.advertiser}. ${ad.headline}`}
      onPress={() => {
        if (preview) return
        haptic.tap()
        void openExternal(ad.href)
      }}
      style={({ pressed }) => [styles.wrap, pressed && { backgroundColor: colors.panel }]}
    >
      <Text style={styles.adTag}>Ad</Text>
      {ad.imageUrl ? (
        <Image source={{ uri: ad.imageUrl }} style={styles.thumb} contentFit="cover" />
      ) : (
        <View style={[styles.thumb, styles.thumbText]}>
          <Text style={styles.initials}>{ad.advertiser.slice(0, 2).toUpperCase()}</Text>
        </View>
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.advertiser} numberOfLines={1}>
          {ad.advertiser}
        </Text>
        <Text style={styles.headline} numberOfLines={1}>
          {ad.headline}
        </Text>
        <Text style={styles.tagline} numberOfLines={1}>
          {ad.tagline}
        </Text>
      </View>
      <View style={styles.cta}>
        <Text style={styles.ctaText}>{ad.ctaLabel}</Text>
        <ExternalLink size={11} color={colors.black} />
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.goldLine,
    backgroundColor: colors.card,
  },
  adTag: { fontFamily: fonts.bodySemi, fontSize: 9, letterSpacing: 1.8, color: colors.muted, textTransform: 'uppercase' },
  thumb: { width: 44, height: 44, borderRadius: radius.sm },
  thumbText: {
    backgroundColor: colors.goldSoft,
    borderWidth: 1,
    borderColor: colors.goldLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontFamily: fonts.display, fontSize: 13, color: colors.gold },
  advertiser: { fontFamily: fonts.body, fontSize: 11, color: colors.muted },
  headline: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.white },
  tagline: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.gold,
    borderRadius: radius.sm,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  ctaText: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 0.6, color: colors.black, textTransform: 'uppercase' },
})
