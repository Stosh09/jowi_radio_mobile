import {
  PRESENTERS,
  SCHEDULE,
  type DayKey,
  type Presenter,
  type ScheduleBlock,
  type ScheduleSlot,
} from '@shared/schedule'

/** Kenya is UTC+3 all year (no DST), so fixed-offset math is exact. */
const NAIROBI_OFFSET_MIN = 180
const DAY_MIN = 24 * 60
const WEEK_MIN = 7 * DAY_MIN

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

export interface ClockSnapshot {
  dayKey: DayKey
  /** 0 = Sunday … 6 = Saturday, in Nairobi */
  weekday: number
  /** Minutes from midnight in Nairobi (0–1439) */
  minutes: number
  weekdayLabel: string
}

export interface OnAirState {
  clock: ClockSnapshot
  block: ScheduleBlock
  current: ScheduleSlot | null
  upNext: ScheduleSlot | null
  /** Slots that still start later today */
  upcoming: ScheduleSlot[]
  /** 0–1 progress through the current show */
  progress: number
}

export function dayKeyForWeekday(weekday: number): DayKey {
  if (weekday === 6) return 'saturday'
  if (weekday === 0) return 'sunday'
  return 'weekday'
}

/** Nairobi weekdays (0 = Sunday) a schedule block airs on. */
export function weekdaysForDayKey(dayKey: DayKey): number[] {
  if (dayKey === 'saturday') return [6]
  if (dayKey === 'sunday') return [0]
  return [1, 2, 3, 4, 5]
}

export function getNairobiClock(date = new Date()): ClockSnapshot {
  const nairobi = new Date(date.getTime() + NAIROBI_OFFSET_MIN * 60_000)
  const weekday = nairobi.getUTCDay()
  return {
    dayKey: dayKeyForWeekday(weekday),
    weekday,
    minutes: nairobi.getUTCHours() * 60 + nairobi.getUTCMinutes(),
    weekdayLabel: WEEKDAY_LABELS[weekday],
  }
}

export function getScheduleBlock(dayKey: DayKey): ScheduleBlock {
  return SCHEDULE.find((b) => b.dayKey === dayKey) ?? SCHEDULE[0]
}

export function isSlotActive(slot: ScheduleSlot, minutes: number): boolean {
  if (slot.startMinutes < slot.endMinutes) {
    return minutes >= slot.startMinutes && minutes < slot.endMinutes
  }
  return minutes >= slot.startMinutes || minutes < slot.endMinutes
}

function formatClock(totalMinutes: number): string {
  const total = ((totalMinutes % DAY_MIN) + DAY_MIN) % DAY_MIN
  const hours = Math.floor(total / 60)
  const mins = total % 60
  const period = hours >= 12 ? 'PM' : 'AM'
  const h12 = hours % 12 || 12
  return `${h12}:${String(mins).padStart(2, '0')} ${period}`
}

export function formatSlotStart(slot: ScheduleSlot): string {
  return formatClock(slot.startMinutes)
}

export function formatSlotRange(slot: ScheduleSlot): string {
  return `${formatClock(slot.startMinutes)} – ${formatClock(slot.endMinutes)}`
}

function chronological(slots: ScheduleSlot[]): ScheduleSlot[] {
  return [...slots].sort((a, b) => a.startMinutes - b.startMinutes)
}

function slotProgress(slot: ScheduleSlot, minutes: number): number {
  const length = (slot.endMinutes - slot.startMinutes + DAY_MIN) % DAY_MIN || DAY_MIN
  const into = (minutes - slot.startMinutes + DAY_MIN) % DAY_MIN
  return Math.min(1, Math.max(0, into / length))
}

export function resolveOnAir(date = new Date()): OnAirState {
  const clock = getNairobiClock(date)
  const block = getScheduleBlock(clock.dayKey)
  const ordered = chronological(block.slots)

  const current = ordered.find((slot) => isSlotActive(slot, clock.minutes)) ?? null
  const upcoming = ordered.filter(
    (slot) => slot.startMinutes > clock.minutes && slot.id !== current?.id,
  )

  // Later today, or wrap to tomorrow's first slot from tomorrow's block.
  let upNext: ScheduleSlot | null = upcoming[0] ?? null
  if (!upNext) {
    const tomorrow = getScheduleBlock(dayKeyForWeekday((clock.weekday + 1) % 7))
    upNext = chronological(tomorrow.slots).find((s) => s.startMinutes > 0) ?? null
  }

  return {
    clock,
    block,
    current,
    upNext,
    upcoming,
    progress: current ? slotProgress(current, clock.minutes) : 0,
  }
}

export function getTodayHighlights(limit = 4, date = new Date()): ScheduleSlot[] {
  const { current, upcoming, block } = resolveOnAir(date)
  if (current || upcoming.length > 0) {
    return (current ? [current, ...upcoming] : upcoming).slice(0, limit)
  }
  return chronological(block.slots).slice(0, limit)
}

export function findSlot(slotId: string): { slot: ScheduleSlot; block: ScheduleBlock } | null {
  for (const block of SCHEDULE) {
    const slot = block.slots.find((s) => s.id === slotId)
    if (slot) return { slot, block }
  }
  return null
}

export function findPresenter(id: string): Presenter | null {
  return PRESENTERS.find((p) => p.id === id) ?? null
}

export function slotsForPresenter(presenterId: string): { slot: ScheduleSlot; block: ScheduleBlock }[] {
  const out: { slot: ScheduleSlot; block: ScheduleBlock }[] = []
  for (const block of SCHEDULE) {
    for (const slot of block.slots) {
      if (slot.hostIds.includes(presenterId)) out.push({ slot, block })
    }
  }
  return out
}

export function isPresenterOnAir(presenterId: string, date = new Date()): boolean {
  return resolveOnAir(date).current?.hostIds.includes(presenterId) ?? false
}

/** One weekly occurrence of a reminder in the device's local time zone. */
export interface LocalWeeklyTime {
  /** 1 = Sunday … 7 = Saturday (expo-notifications convention) */
  weekday: number
  hour: number
  minute: number
}

/**
 * Convert "Nairobi weekday + minutes − lead" into the phone's local weekly time.
 * Handles leads that cross midnight and listeners outside Kenya.
 */
export function toLocalWeekly(
  nairobiWeekday: number,
  nairobiMinutes: number,
  leadMinutes: number,
  now = new Date(),
): LocalWeeklyTime {
  const localOffset = -now.getTimezoneOffset()
  const nairobiWeekMinute = nairobiWeekday * DAY_MIN + nairobiMinutes - leadMinutes
  const localWeekMinute =
    (((nairobiWeekMinute - NAIROBI_OFFSET_MIN + localOffset) % WEEK_MIN) + WEEK_MIN) % WEEK_MIN
  const dayIndex = Math.floor(localWeekMinute / DAY_MIN)
  const inDay = localWeekMinute % DAY_MIN
  return { weekday: dayIndex + 1, hour: Math.floor(inDay / 60), minute: inDay % 60 }
}

/** Minutes until the next airing of a slot, from now (Nairobi time). */
export function minutesUntilNextAiring(slot: ScheduleSlot, dayKey: DayKey, date = new Date()): number {
  const clock = getNairobiClock(date)
  const nowWeekMinute = clock.weekday * DAY_MIN + clock.minutes
  let best = Number.POSITIVE_INFINITY
  for (const weekday of weekdaysForDayKey(dayKey)) {
    const at = weekday * DAY_MIN + slot.startMinutes
    const delta = (((at - nowWeekMinute) % WEEK_MIN) + WEEK_MIN) % WEEK_MIN
    if (delta < best) best = delta
  }
  return best
}

export function formatCountdown(minutes: number): string {
  if (minutes < 1) return 'starting now'
  if (minutes < 60) return `in ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    const rem = minutes % 60
    return rem ? `in ${hours}h ${rem}m` : `in ${hours}h`
  }
  const days = Math.floor(hours / 24)
  return days === 1 ? 'tomorrow' : `in ${days} days`
}
