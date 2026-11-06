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
      'JOWI 98.1 FM is a Dholuo community radio station broadcasting from Kisumu — music, talk, news, and culture that keeps jamuomo connected.',
    location: 'Kisumu, Kenya',
    founded: '2019',
    story: [
      "JOWI means buffalo — in Luo lore the symbol of strength, courage and endurance — and jamuomo is the greeting that carries it across the airwaves. Broadcasting in Dholuo from Kisumu, JOWI 98.1 FM reaches listeners across Nyanza: Kisumu, Homa Bay, Siaya, Migori, Kisii and Nyamira.",
      "The station began in April 2019 in Siaya as Ratego Radio, and in November 2022 it was reborn as Jowi FM — moving to Kisumu and growing its signal across the region. The lineup runs from dawn to dawn: Wuok Chieng' at first light, mid-morning talk on Jowi Tiyo, Kamata Pozi, Jamuomo Drive, Tipo Mbaka after dark, and the overnight Jowi Express — with rhumba, benga, reggae, afrobeats and gospel in between.",
      'Community first: news you can trust, health and governance conversations that matter, and edutainment in the language of home. The conversation runs both ways, too — shout out, request a song, vote in the polls, or just listen live from the app.',
    ],
    email: 'studio@jowi981.fm',
    phone: '+254 750 499 077',
    whatsapp: '254141396517',
  },
  leadership: {
    name: 'Mwalimu Odhiambo Makowiti',
    role: 'Managing Director / CEO',
    bio: "Guides JOWI 98.1 FM as Managing Director and CEO — setting the station's vision and keeping it rooted in the community. Listeners know his voice too: he hosts Tipo Mbaka weeknights, 8pm to midnight.",
    photo: null as string | null, // e.g. '/leadership/makowiti.png' when the photo arrives
  },
  social: {
    facebook: 'https://www.facebook.com/share/1A8AeywT59/',
    tiktok: 'https://www.tiktok.com/@jowi.98.1.fm',
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
