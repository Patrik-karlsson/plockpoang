import { BONUS_MAX, BONUS_START, HOUR_MS, MIN_PACE_MS, MINUTE_MS } from './constants'
import type { LiveSession, Session } from './types'

export interface Stats {
  points: number
  activeMs: number
  pace: number | undefined
}

export type HoldToday = { kind: 'reached' } | { kind: 'pace'; requiredPace: number }

export type PaceLevel = 'unknown' | 'below' | 'bonus' | 'max'

export function sessionPoints(s: Session): number {
  if (s.source === 'manual') return s.points
  return s.entries.reduce((sum, e) => sum + (e.kind === 'stop' ? e.kolli + 1 : e.points), 0)
}

export function sessionActiveMs(s: Session, now: number): number {
  if (s.source === 'manual') return s.activeMs
  const end = s.endedAt ?? now
  const paused = s.pauses.reduce((sum, p) => sum + ((p.end ?? end) - p.start), 0)
  return end - s.startedAt - paused
}

export function sessionCounts(s: LiveSession): { stops: number; kolli: number } {
  let stops = 0
  let kolli = 0
  for (const e of s.entries) {
    if (e.kind === 'stop') {
      stops++
      kolli += e.kolli
    }
  }
  return { stops, kolli }
}

export function pace(points: number, activeMs: number, minMs = MIN_PACE_MS): number | undefined {
  if (activeMs <= 0 || activeMs < minMs) return undefined
  return points / (activeMs / HOUR_MS)
}

export function monthKeyOf(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function monthKey(s: Session): string {
  return s.source === 'manual' ? s.date.slice(0, 7) : monthKeyOf(s.startedAt)
}

export function totals(sessions: Session[], now: number): Stats {
  let points = 0
  let activeMs = 0
  for (const s of sessions) {
    points += sessionPoints(s)
    activeMs += sessionActiveMs(s, now)
  }
  return { points, activeMs, pace: pace(points, activeMs) }
}

export function monthStats(sessions: Session[], key: string, now: number): Stats {
  return totals(
    sessions.filter((s) => s.type === 'plock' && monthKey(s) === key),
    now,
  )
}

/** Positive is margin above max-bonus pace, negative is distance to it. */
export function monthDelta(stats: Stats): number {
  return stats.points - BONUS_MAX * (stats.activeMs / HOUR_MS)
}

export function holdToday(stats: Stats, plannedEndAt: number | undefined, now: number): HoldToday | undefined {
  if (plannedEndAt === undefined || plannedEndAt - now < MINUTE_MS) return undefined
  const remainingH = (plannedEndAt - now) / HOUR_MS
  const needed = BONUS_MAX * (stats.activeMs / HOUR_MS + remainingH) - stats.points
  if (needed <= 0) return { kind: 'reached' }
  return { kind: 'pace', requiredPace: needed / remainingH }
}

export function paceLevel(p: number | undefined): PaceLevel {
  if (p === undefined) return 'unknown'
  if (p >= BONUS_MAX) return 'max'
  if (p >= BONUS_START) return 'bonus'
  return 'below'
}
