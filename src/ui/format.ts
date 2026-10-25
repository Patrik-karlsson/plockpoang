import { HOUR_MS, MINUTE_MS } from '../domain/constants'

const pad = (n: number) => String(n).padStart(2, '0')

const pointsFormat = new Intl.NumberFormat('sv-SE')
const monthFormat = new Intl.DateTimeFormat('sv-SE', { month: 'long', year: 'numeric' })
const weekdayFormat = new Intl.DateTimeFormat('sv-SE', { weekday: 'short' })
const shortMonthFormat = new Intl.DateTimeFormat('sv-SE', { month: 'short' })

export function formatPace(p: number | undefined): string {
  return p === undefined ? '—' : String(Math.round(p))
}

export function formatPoints(n: number): string {
  return pointsFormat.format(n)
}

export function formatDuration(ms: number): string {
  const totalMin = Math.round(ms / MINUTE_MS)
  const h = Math.floor(totalMin / (HOUR_MS / MINUTE_MS))
  const m = totalMin % 60
  if (h === 0) return `${m} min`
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}

export function formatMonth(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return monthFormat.format(new Date(y, m - 1, 1))
}

export function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function formatDate(ts: number): string {
  const d = new Date(ts)
  const strip = (s: string) => s.replace('.', '')
  return `${strip(weekdayFormat.format(d))} ${d.getDate()} ${strip(shortMonthFormat.format(d))}`
}

export function todayKey(now: number): string {
  const d = new Date(now)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function toLocalInput(ts: number): string {
  return `${todayKey(ts)}T${formatTime(ts)}`
}

export function fromLocalInput(v: string): number {
  const [date, time] = v.split('T')
  const [y, mo, d] = date.split('-').map(Number)
  const [h, mi] = time.split(':').map(Number)
  return new Date(y, mo - 1, d, h, mi).getTime()
}

/** Today at HH:MM, or tomorrow if that time has already passed (night shifts). */
export function parsePlannedEnd(hhmm: string, now: number): number | undefined {
  if (!hhmm) return undefined
  const [h, m] = hhmm.split(':').map(Number)
  const d = new Date(now)
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m)
  if (end.getTime() <= now) end.setDate(end.getDate() + 1)
  return end.getTime()
}
