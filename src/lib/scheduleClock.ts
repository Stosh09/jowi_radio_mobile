import {
  SCHEDULE,
  type DayKey,
  type ScheduleBlock,
  type ScheduleSlot,
} from '../config/schedule'

const NAIROBI = 'Africa/Nairobi'

export interface ClockSnapshot {
  dayKey: DayKey
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
}

function partValue(parts: Intl.DateTimeFormatPart[], type: string): string {
  return parts.find((p) => p.type === type)?.value ?? ''
}

/** Current calendar/time in Africa/Nairobi (EAT). */
export function getNairobiClock(date = new Date()): ClockSnapshot {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: NAIROBI,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)

  const weekday = partValue(parts, 'weekday')
  const hour = Number(partValue(parts, 'hour'))
  const minute = Number(partValue(parts, 'minute'))

  let dayKey: DayKey = 'weekday'
  if (weekday === 'Sat') dayKey = 'saturday'
  else if (weekday === 'Sun') dayKey = 'sunday'

  return {
    dayKey,
    minutes: hour * 60 + minute,
    weekdayLabel: weekday,
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

export function formatSlotStart(slot: ScheduleSlot): string {
  const total = slot.startMinutes % (24 * 60)
  const hours = Math.floor(total / 60)
  const mins = total % 60
  const period = hours >= 12 ? 'PM' : 'AM'
  const h12 = hours % 12 || 12
  const mm = String(mins).padStart(2, '0')
  return `${h12}:${mm} ${period}`
}

function chronologicalOrder(slots: ScheduleSlot[]): ScheduleSlot[] {
  return [...slots].sort((a, b) => a.startMinutes - b.startMinutes)
}

export function resolveOnAir(date = new Date()): OnAirState {
  const clock = getNairobiClock(date)
  const block = getScheduleBlock(clock.dayKey)
  const ordered = chronologicalOrder(block.slots)

  const current = ordered.find((slot) => isSlotActive(slot, clock.minutes)) ?? null

  const upcoming = ordered.filter(
    (slot) => slot.startMinutes > clock.minutes && slot.id !== current?.id,
  )

  // Later today, or wrap to the next morning slot (e.g. after midnight Express → Wuok Chieng')
  const upNext =
    upcoming[0] ??
    ordered.find((slot) => slot.id !== current?.id) ??
    null

  return { clock, block, current, upNext, upcoming }
}

export function getTodayHighlights(limit = 4, date = new Date()): ScheduleSlot[] {
  const { current, upcoming, block } = resolveOnAir(date)
  if (current || upcoming.length > 0) {
    const list = current ? [current, ...upcoming] : upcoming
    return list.slice(0, limit)
  }
  return chronologicalOrder(block.slots).slice(0, limit)
}
