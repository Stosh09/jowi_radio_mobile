export interface BannerAd {
  id: string
  /** Set false to pull the creative without deleting it */
  active: boolean
  advertiser: string
  headline: string
  tagline: string
  ctaLabel: string
  /** Destination when the banner is clicked */
  href: string
  /** Optional image (logo or product shot). Leave empty for text-only creative. */
  imageUrl?: string
  /** Higher weight = shown more often when several ads are active */
  weight: number
  /** Inclusive start (ISO date). Omit for always-on while active. */
  startsAt?: string
  /** Inclusive end (ISO date). Omit for no end date. */
  endsAt?: string
}

/**
 * Paid listen-page banner creatives.
 * Flip `active: true` when a real booking starts — dock hides when none are active.
 */
export const BANNER_ADS: BannerAd[] = [
  {
    id: 'demo-mama-shop',
    active: false,
    advertiser: 'Mama Njeri Fresh Mart',
    headline: 'Fresh produce every morning',
    tagline: 'Market Street · Open 6am–7pm · Mention JOWI for 10% off today',
    ctaLabel: 'Visit store',
    href: 'https://wa.me/254700000981?text=Hi%20Mama%20Njeri%20-%20saw%20you%20on%20JOWI',
    weight: 2,
    startsAt: '2026-08-01',
    endsAt: '2026-09-30',
  },
  {
    id: 'demo-auto-care',
    active: false,
    advertiser: 'Town Auto Care',
    headline: 'Service your ride this week',
    tagline: 'Oil change + wash package · Book before Friday',
    ctaLabel: 'Book now',
    href: 'https://wa.me/254700000981?text=Hi%20Town%20Auto%20Care%20-%20saw%20you%20on%20JOWI',
    weight: 1,
    startsAt: '2026-08-01',
    endsAt: '2026-10-31',
  },
]

function inFlight(ad: BannerAd, now = new Date()): boolean {
  if (!ad.active) return false
  if (ad.startsAt && now < new Date(`${ad.startsAt}T00:00:00`)) return false
  if (ad.endsAt && now > new Date(`${ad.endsAt}T23:59:59`)) return false
  return true
}

export function getActiveBanners(now = new Date()): BannerAd[] {
  return BANNER_ADS.filter((ad) => inFlight(ad, now))
}

/** Weighted pick for rotation across page loads / intervals */
export function pickBanner(ads: BannerAd[]): BannerAd | null {
  if (ads.length === 0) return null
  const total = ads.reduce((sum, ad) => sum + Math.max(1, ad.weight), 0)
  let ticket = Math.random() * total
  for (const ad of ads) {
    ticket -= Math.max(1, ad.weight)
    if (ticket <= 0) return ad
  }
  return ads[ads.length - 1] ?? null
}
