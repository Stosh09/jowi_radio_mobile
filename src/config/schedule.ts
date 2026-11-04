/**
 * JOWI 98.1 FM — official program lineup & presenters
 *
 * Times are stored in 24-hour minutes from midnight (0–1440) so we can
 * later compute “now playing” / “up next” without parsing display strings.
 * Overnight slots (e.g. 00:00–05:00) wrap past midnight.
 *
 * Lineup confirmed by the station — remaining gaps flagged in SCHEDULE_NOTES.
 */

export type DayKey = 'weekday' | 'saturday' | 'sunday'

export interface ScheduleSlot {
  /** Stable id for keys / future APIs */
  id: string
  title: string
  /** Display string, e.g. "05:00 – 10:00" */
  time: string
  /** Minutes from midnight (0 = 00:00, 300 = 05:00) */
  startMinutes: number
  endMinutes: number
  /** Presenter display name(s); may include co-hosts joined with " & " */
  host: string
  /** Presenter ids from PRESENTERS */
  hostIds: string[]
}

export interface ScheduleBlock {
  day: string
  dayKey: DayKey
  slots: ScheduleSlot[]
}

export interface Presenter {
  id: string
  name: string
  role: string
  show: string
  /** Short bio — placeholder until station supplies copy */
  bio: string
}

/** Convert "HH:MM" (24h) → minutes from midnight */
function hm(hours: number, minutes = 0): number {
  return hours * 60 + minutes
}

export const SCHEDULE_NOTES = [
  'Overnight “00:00 – 05:00” slots wrap past midnight (Jowi Express / Jowi Sunday Express).',
  'Saturday has a 1-hour gap 13:00 – 14:00 between Tago Extra and Paw Tuke — confirm what airs (e.g. news / automation).',
  'Sunday has a 1-hour gap 19:00 – 20:00 between Hema Mar Geno and Jowi Benga — confirm what airs.',
  'Weekday Wuok Chieng’ is co-hosted by Duncan Mcandiwo & Jared Ojwang.',
  'Weekend overnight host recorded as “Levinta Nyamigori” on both nights (lineup listed “Levinter” on Sunday).',
  'Tagline “jamuomo…” matches the Jamuomo Drive show name (not “jamuama”).',
] as const

export const SCHEDULE: ScheduleBlock[] = [
  {
    day: 'Weekdays (Mon–Fri)',
    dayKey: 'weekday',
    slots: [
      {
        id: 'weekday-wuok-chieng',
        title: "Wuok Chieng'",
        time: '05:00 – 10:00',
        startMinutes: hm(5),
        endMinutes: hm(10),
        host: 'Duncan Mcandiwo & Jared Ojwang',
        hostIds: ['duncan-mcandiwo', 'jared-ojwang'],
      },
      {
        id: 'weekday-jowi-tiyo',
        title: 'Jowi Tiyo',
        time: '10:00 – 13:00',
        startMinutes: hm(10),
        endMinutes: hm(13),
        host: 'Mercyline Akinyi Ogweno',
        hostIds: ['mercyline-akinyi-ogweno'],
      },
      {
        id: 'weekday-kamata-pozi',
        title: 'Kamata Pozi Show',
        time: '13:00 – 16:00',
        startMinutes: hm(13),
        endMinutes: hm(16),
        host: 'Javanly Joseph Onyango',
        hostIds: ['javanly-onyango'],
      },
      {
        id: 'weekday-jamuomo-drive',
        title: 'Jamuomo Drive',
        time: '16:00 – 20:00',
        startMinutes: hm(16),
        endMinutes: hm(20),
        host: 'Mercy Auma Okuto',
        hostIds: ['mercy-okuto'],
      },
      {
        id: 'weekday-tipo-mbaka',
        title: 'Tipo Mbaka',
        time: '20:00 – 00:00',
        startMinutes: hm(20),
        endMinutes: hm(24),
        host: 'Mwalimu Odhiambo Makowiti',
        hostIds: ['mwalimu-odhiambo-mcowiti'],
      },
      {
        id: 'weekday-jowi-express',
        title: 'Jowi Express',
        time: '00:00 – 05:00',
        startMinutes: hm(0),
        endMinutes: hm(5),
        host: 'Molly Nyasuba',
        hostIds: ['molly-nyasuba'],
      },
    ],
  },
  {
    day: 'Saturday',
    dayKey: 'saturday',
    slots: [
      {
        id: 'sat-sabato-moguedhi',
        title: 'Sabato Moguedhi',
        time: '05:00 – 10:00',
        startMinutes: hm(5),
        endMinutes: hm(10),
        host: 'Dupreez Okoth',
        hostIds: ['dupree-okoth'],
      },
      {
        id: 'sat-tago-extra',
        title: 'Tago Extra',
        time: '10:00 – 13:00',
        startMinutes: hm(10),
        endMinutes: hm(13),
        host: 'Elfas Guya',
        hostIds: ['elfas-guya'],
      },
      // Gap: 13:00 – 14:00 (see SCHEDULE_NOTES)
      {
        id: 'sat-paw-tuke',
        title: 'Paw Tuke',
        time: '14:00 – 18:00',
        startMinutes: hm(14),
        endMinutes: hm(18),
        host: 'Raymond Jowi',
        hostIds: ['raymond-jowi'],
      },
      {
        id: 'sat-rhumba-mix',
        title: 'Rhumba Mix',
        time: '18:00 – 20:00',
        startMinutes: hm(18),
        endMinutes: hm(20),
        host: 'Javanly Onyango',
        hostIds: ['javanly-onyango'],
      },
      {
        id: 'sat-abila',
        title: 'Abila',
        time: '20:00 – 00:00',
        startMinutes: hm(20),
        endMinutes: hm(24),
        host: 'Jared Ojwang',
        hostIds: ['jared-ojwang'],
      },
      {
        id: 'sat-jowi-express',
        title: 'Jowi Express',
        time: '00:00 – 05:00',
        startMinutes: hm(0),
        endMinutes: hm(5),
        host: 'Levinta Nyamigori',
        hostIds: ['levinta-nyamigori'],
      },
    ],
  },
  {
    day: 'Sunday',
    dayKey: 'sunday',
    slots: [
      {
        id: 'sun-hera-nyasaye',
        title: 'Hera Nyasaye',
        time: '05:00 – 10:00',
        startMinutes: hm(5),
        endMinutes: hm(10),
        host: 'Raymond Jowi',
        hostIds: ['raymond-jowi'],
      },
      {
        id: 'sun-mbak-keny',
        title: 'Mbak Keny',
        time: '10:00 – 13:00',
        startMinutes: hm(10),
        endMinutes: hm(13),
        host: 'Molly Nyasuba',
        hostIds: ['molly-nyasuba'],
      },
      {
        id: 'sun-i-and-i-reggae',
        title: 'I and I Reggae Show',
        time: '13:00 – 16:00',
        startMinutes: hm(13),
        endMinutes: hm(16),
        host: 'Linet Nyasiaya',
        hostIds: ['linet-nyasiaya'],
      },
      {
        id: 'sun-hema-mar-geno',
        title: 'Hema Mar Geno',
        time: '16:00 – 19:00',
        startMinutes: hm(16),
        endMinutes: hm(19),
        host: 'Duncan Mcandiwo',
        hostIds: ['duncan-mcandiwo'],
      },
      // Gap: 19:00 – 20:00 (see SCHEDULE_NOTES)
      {
        id: 'sun-jowi-benga',
        title: 'Jowi Benga',
        time: '20:00 – 00:00',
        startMinutes: hm(20),
        endMinutes: hm(24),
        host: 'Felix Leja',
        hostIds: ['felix-leja'],
      },
      {
        id: 'sun-jowi-sunday-express',
        title: 'Jowi Sunday Express',
        time: '00:00 – 05:00',
        startMinutes: hm(0),
        endMinutes: hm(5),
        host: 'Levinta Nyamigori',
        hostIds: ['levinta-nyamigori'],
      },
    ],
  },
]

export const PRESENTERS: Presenter[] = [
  {
    id: 'duncan-mcandiwo',
    name: 'Duncan Mcandiwo',
    role: 'Weekday & Sunday host',
    show: "Wuok Chieng' · Hema Mar Geno",
    bio: 'Over a decade experience. Creator of Hema Mar Geno (Tent of Hope). Expert in radio adverts, jingles, promos and sweepers.',
  },
  {
    id: 'jared-ojwang',
    name: 'Jared Ojwang',
    role: 'Weekday & Saturday host',
    show: "Wuok Chieng' · Abila",
    bio: 'Seasoned journalist of wit and authority. Bold, assertive and fearless in tackling hard topics on social and political impact, justice and accountability. Known for provocative humor in news and continuity, and a champion for the downtrodden and voiceless.',
  },
  {
    id: 'mercyline-akinyi-ogweno',
    name: 'Mercyline Akinyi Ogweno',
    role: 'Weekday mid-morning host',
    show: 'Jowi Tiyo',
    bio: 'Professional broadcast journalist dedicated to credible journalism and public accountability. Focus on health, governance and community development.',
  },
  {
    id: 'javanly-onyango',
    name: 'Javanly Joseph Onyango',
    role: 'Weekday & Saturday host',
    show: 'Kamata Pozi Show · Rhumba Mix',
    bio: 'Prominent broadcast media professional and On-Air Personality skilled in audio and video editing and communication.',
  },
  {
    id: 'mercy-okuto',
    name: 'Mercy Auma Okuto',
    role: 'Drive-time host',
    show: 'Jamuomo Drive',
    bio: 'Passionate, hardworking, trustworthy and responsible media professional committed to telling authentic stories, amplifying community voices, and using media to inform, inspire, and create positive impact.',
  },
  {
    id: 'mwalimu-odhiambo-mcowiti',
    name: 'Mwalimu Odhiambo Makowiti',
    role: 'Weekday evening host',
    show: 'Tipo Mbaka',
    bio: 'Believes communication must achieve a cause. Specializes in development communication and social mobilization.',
  },
  {
    id: 'molly-nyasuba',
    name: 'Molly Nyasuba',
    role: 'Weekday overnight & Sunday host',
    show: 'Jowi Express · Mbak Keny',
    bio: "Overnight voice of Jowi Express on weekdays and host of Sunday's Mbak Keny.",
  },
  {
    id: 'dupree-okoth',
    name: 'Dupreez Okoth',
    role: 'Saturday morning host',
    show: 'Sabato Moguedhi',
    bio: 'Dedicated Kenyan journalist with a professional background in voice-over, video and audio auditing, radio and TV production, field reporting, customer care and public relations. A news presenter with a passion for agriculture and politics.',
  },
  {
    id: 'elfas-guya',
    name: 'Elfas Guya',
    role: 'Saturday host',
    show: 'Tago Extra',
    bio: "Hosts Saturday's Tago Extra late-morning block.",
  },
  {
    id: 'raymond-jowi',
    name: 'Raymond Jowi',
    role: 'Weekend host',
    show: 'Paw Tuke · Hera Nyasaye',
    bio: 'Kenyan journalist and media communications professional with a growing footprint in radio, digital journalism and community storytelling.',
  },
  {
    id: 'levinta-nyamigori',
    name: 'Levinta Nyamigori',
    role: 'Weekend overnight host',
    show: 'Jowi Express · Jowi Sunday Express',
    bio: 'Hosts the weekend overnight Jowi Express and Jowi Sunday Express.',
  },
  {
    id: 'linet-nyasiaya',
    name: 'Linet Nyasiaya',
    role: 'Sunday afternoon host',
    show: 'I and I Reggae Show',
    bio: "Presents the I and I Reggae Show on Sunday afternoons.",
  },
  {
    id: 'felix-leja',
    name: 'Felix Leja',
    role: 'Sunday night host',
    show: 'Jowi Benga',
    bio: 'Passionate and dedicated journalist with a strong interest in news anchoring, current affairs, community stories, and human-interest journalism. Committed to delivering accurate, balanced, and credible information while giving a voice to communities.',
  },
]
