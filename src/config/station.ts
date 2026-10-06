export const STATION = {
  name: 'JOWI 98.1 FM',
  shortName: 'JOWI',
  frequency: '98.1 FM',
  tagline: 'jamuomo...',
  streamUrl: 'https://s23.myradiostream.com:20542/listen.mp3',
  logo: '/logo.png',
  heroImage: '/studio-hero.png',
  listeners: 247,
  about: {
    blurb:
      'JOWI 98.1 FM is the voice of the community — music, talk, news, and culture that keeps jamuomo connected.',
    location: 'Kenya',
    founded: '2018',
    email: 'studio@jowi981.fm',
    phone: '+254 700 000 981',
    whatsapp: '254700000981',
  },
  social: {
    facebook: 'https://facebook.com',
    tiktok: 'https://tiktok.com',
    youtube: 'https://youtube.com',
    instagram: 'https://instagram.com',
  },
  presenterPin: 'jowi981',
} as const

export { SCHEDULE, PRESENTERS, SCHEDULE_NOTES } from './schedule'
export type { DayKey, Presenter, ScheduleBlock, ScheduleSlot } from './schedule'

export const AD_PACKAGES = [
  {
    id: 'banner',
    name: 'Listen Banner',
    price: 'KES 15,000 / week',
    priceNote: 'KES 45,000 / month',
    description:
      'Your brand in the sponsored dock on the live listen page — always visible while people stream, above the player controls.',
    perks: [
      'Logo + headline + click-through link',
      'Rotates fairly with other booked banners',
      'Weekly impression summary',
      'Creative refresh mid-campaign included',
    ],
  },
  {
    id: 'spot',
    name: 'Spot Ads',
    price: 'From KES 3,000 / spot',
    priceNote: 'Weekly flights from KES 18,000',
    description:
      '15–30 second commercials between songs and segments. Peak drive slots cost more; off-peak stretches your budget.',
    perks: [
      'Script writing support',
      'Peak (6–9am, 4–7pm) or off-peak',
      'Minimum 7-day flight',
      'Air-check recording on request',
    ],
  },
  {
    id: 'sponsorship',
    name: 'Show Sponsorship',
    price: 'From KES 50,000 / week',
    priceNote: 'Morning Show from KES 75,000 / week',
    description:
      'Own a show with billed opens, closes, and live host mentions — strongest recall with regular listeners.',
    perks: [
      'Named show billboard',
      '2–4 live reads per episode',
      'Logo on schedule page',
      'One social shoutout per week',
    ],
  },
  {
    id: 'campaign',
    name: 'Full Campaign',
    price: 'From KES 150,000',
    priceNote: '4-week starter bundle',
    description:
      'Radio spots + listen banner + show mentions in one plan. Built for launches, promotions, and election or event pushes.',
    perks: [
      'Joint radio + web plan',
      'Producer walkthrough',
      'Priority inventory hold',
      'Dedicated sales contact',
    ],
  },
] as const

/** Fallback if Supabase has no active poll (offline / empty DB). */
export const FALLBACK_POLL = {
  id: 'poll-weekend',
  question: 'What should we play more of this weekend?',
  options: [
    { id: 'afrobeats', label: 'Afrobeats' },
    { id: 'gospel', label: 'Gospel' },
    { id: 'gengetone', label: 'Gengetone' },
    { id: 'rnb', label: 'R&B / Slow jams' },
  ],
} as const

/** @deprecated Use live poll from InteractionContext; kept as FALLBACK_POLL alias. */
export const ACTIVE_POLL = FALLBACK_POLL

export function getStreamUrl(): string {
  return `${STATION.streamUrl}?nocache=${Date.now()}`
}
