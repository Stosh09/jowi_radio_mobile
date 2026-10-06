/**
 * JOWI 98.1 FM — official program lineup & presenters
 *
 * Times are stored in 24-hour minutes from midnight (0–1440) so we can
 * later compute “now playing” / “up next” without parsing display strings.
 * Overnight slots (e.g. 00:00–05:00) wrap past midnight.
 *
 * Open questions flagged in SCHEDULE_NOTES below — confirm before going live.
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
  /** Presenter display name(s); may include co-hosts joined with " / " */
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
  'Overnight “12:00 – 5:00” slots are treated as midnight → 05:00 (Jowi Express).',
  'Shows ending “12:00 pm” after evening slots (Tipo Mbaka, Tao Ma Lando, Ajawa 254) are treated as midnight, not noon.',
  'Saturday Tago Extra is listed as 9:15–11:00 with no am/pm; assumed morning (09:15–11:00).',
  'Sunday has a 1-hour gap between Hema Mar Geno (ends 19:00) and Ajawa 254 (starts 20:00) — confirm if intentional or missing a show.',
  'Jowi Express hosts listed as Nyatanga / Nyasiaya (weekday & overnight).',
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
        host: 'Duncan Mcandiwo',
        hostIds: ['duncan-mcandiwo'],
      },
      {
        id: 'weekday-ratego-tiyo',
        title: 'Ratego Tiyo',
        time: '10:00 – 13:00',
        startMinutes: hm(10),
        endMinutes: hm(13),
        host: 'Susan Oloo',
        hostIds: ['susan-oloo'],
      },
      {
        id: 'weekday-kamata-pozi',
        title: 'Kamata Pozi Show',
        time: '13:00 – 16:00',
        startMinutes: hm(13),
        endMinutes: hm(16),
        host: 'Javanly Onyango',
        hostIds: ['javanly-onyango'],
      },
      {
        id: 'weekday-jamuomo-drive',
        title: 'Jamuomo Drive',
        time: '16:00 – 20:00',
        startMinutes: hm(16),
        endMinutes: hm(20),
        host: 'Mercy Okuto',
        hostIds: ['mercy-okuto'],
      },
      {
        id: 'weekday-tipo-mbaka',
        title: 'Tipo Mbaka',
        time: '20:00 – 00:00',
        startMinutes: hm(20),
        endMinutes: hm(24),
        host: 'Mwalimu Odhiambo Mcowiti',
        hostIds: ['mwalimu-odhiambo-mcowiti'],
      },
      {
        id: 'weekday-jowi-express',
        title: 'Jowi Express',
        time: '00:00 – 05:00',
        startMinutes: hm(0),
        endMinutes: hm(5),
        host: 'Nyatanga / Nyasiaya',
        hostIds: ['nyatanga', 'nyasiaya'],
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
        time: '05:00 – 09:00',
        startMinutes: hm(5),
        endMinutes: hm(9),
        host: 'Duncan Mcandiwo',
        hostIds: ['duncan-mcandiwo'],
      },
      {
        id: 'sat-tago-extra',
        title: 'Tago Extra',
        time: '09:15 – 11:00',
        startMinutes: hm(9, 15),
        endMinutes: hm(11),
        host: 'Elfas Guya',
        hostIds: ['elfas-guya'],
      },
      {
        id: 'sat-tangawizi',
        title: 'Tangawizi Special',
        time: '11:00 – 14:00',
        startMinutes: hm(11),
        endMinutes: hm(14),
        host: 'Nyatanga',
        hostIds: ['nyatanga'],
      },
      {
        id: 'sat-paw-tuke',
        title: 'Paw Tuke',
        time: '14:00 – 17:00',
        startMinutes: hm(14),
        endMinutes: hm(17),
        host: 'Raymond Jowi',
        hostIds: ['raymond-jowi'],
      },
      {
        id: 'sat-pur-gi-ohala',
        title: 'Pur Gi Ohala',
        time: '17:00 – 21:00',
        startMinutes: hm(17),
        endMinutes: hm(21),
        host: 'Dupree Okoth',
        hostIds: ['dupree-okoth'],
      },
      {
        id: 'sat-tao-ma-lando',
        title: 'Tao Ma Lando',
        time: '21:00 – 00:00',
        startMinutes: hm(21),
        endMinutes: hm(24),
        host: 'Felix Leja',
        hostIds: ['felix-leja'],
      },
      {
        id: 'sat-jowi-express',
        title: 'Jowi Express',
        time: '00:00 – 05:00',
        startMinutes: hm(0),
        endMinutes: hm(5),
        host: 'Nyatanga / Nyasiaya',
        hostIds: ['nyatanga', 'nyasiaya'],
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
        host: 'Nyasiaya',
        hostIds: ['nyasiaya'],
      },
      {
        id: 'sun-kamata-pozi-extra',
        title: 'Kamata Pozi Extra',
        time: '13:00 – 16:00',
        startMinutes: hm(13),
        endMinutes: hm(16),
        host: 'Javanly Onyango',
        hostIds: ['javanly-onyango'],
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
        id: 'sun-ajawa-254',
        title: 'Ajawa 254',
        time: '20:00 – 00:00',
        startMinutes: hm(20),
        endMinutes: hm(24),
        host: 'Felix Leja',
        hostIds: ['felix-leja'],
      },
      {
        id: 'sun-jowi-express',
        title: 'Jowi Express',
        time: '00:00 – 05:00',
        startMinutes: hm(0),
        endMinutes: hm(5),
        host: 'Nyatanga / Nyasiaya',
        hostIds: ['nyatanga', 'nyasiaya'],
      },
    ],
  },
]

export const PRESENTERS: Presenter[] = [
  {
    id: 'duncan-mcandiwo',
    name: 'Duncan Mcandiwo',
    role: 'Weekday & weekend host',
    show: "Wuok Chieng' · Sabato Moguedhi · Hema Mar Geno",
    bio: 'Leads the early weekday wake-up, Saturday morning Sabato Moguedhi, and Sunday’s Hema Mar Geno.',
  },
  {
    id: 'susan-oloo',
    name: 'Susan Oloo',
    role: 'Weekday mid-morning host',
    show: 'Ratego Tiyo',
    bio: 'Hosts Ratego Tiyo on weekdays from mid-morning into early afternoon.',
  },
  {
    id: 'javanly-onyango',
    name: 'Javanly Onyango',
    role: 'Weekday & Sunday afternoon host',
    show: 'Kamata Pozi Show · Kamata Pozi Extra',
    bio: 'The voice of Kamata Pozi on weekdays and Kamata Pozi Extra on Sundays.',
  },
  {
    id: 'mercy-okuto',
    name: 'Mercy Okuto',
    role: 'Drive-time host',
    show: 'Jamuomo Drive',
    bio: 'Steers Jamuomo Drive through the weekday evening commute.',
  },
  {
    id: 'mwalimu-odhiambo-mcowiti',
    name: 'Mwalimu Odhiambo Mcowiti',
    role: 'Weekday evening host',
    show: 'Tipo Mbaka',
    bio: 'Hosts Tipo Mbaka on weekday evenings into midnight.',
  },
  {
    id: 'nyatanga',
    name: 'Nyatanga',
    role: 'Overnight & weekend host',
    show: 'Jowi Express · Tangawizi Special',
    bio: 'Co-hosts overnight Jowi Express and presents Saturday’s Tangawizi Special.',
  },
  {
    id: 'nyasiaya',
    name: 'Nyasiaya',
    role: 'Overnight & Sunday host',
    show: 'Jowi Express · Mbak Keny',
    bio: 'Co-hosts overnight Jowi Express and presents Sunday’s Mbak Keny.',
  },
  {
    id: 'elfas-guya',
    name: 'Elfas Guya',
    role: 'Saturday host',
    show: 'Tago Extra',
    bio: 'Hosts Saturday’s Tago Extra mid-morning block.',
  },
  {
    id: 'raymond-jowi',
    name: 'Raymond Jowi',
    role: 'Weekend host',
    show: 'Paw Tuke · Hera Nyasaye',
    bio: 'Presents Saturday’s Paw Tuke and Sunday morning’s Hera Nyasaye.',
  },
  {
    id: 'dupree-okoth',
    name: 'Dupree Okoth',
    role: 'Saturday evening host',
    show: 'Pur Gi Ohala',
    bio: 'Hosts Pur Gi Ohala on Saturday evenings.',
  },
  {
    id: 'felix-leja',
    name: 'Felix Leja',
    role: 'Weekend late host',
    show: 'Tao Ma Lando · Ajawa 254',
    bio: 'Hosts Saturday’s Tao Ma Lando and Sunday night’s Ajawa 254.',
  },
]
