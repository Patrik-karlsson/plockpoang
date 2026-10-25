import { BONUS_MAX, QUALIFYING_MONTH_MS, QUALIFYING_SESSION_MS } from './constants'
import { monthKey, monthKeyOf, pace, sessionActiveMs, sessionPoints, totals, type Stats } from './scoring'
import type { Session } from './types'

export interface Streak {
  current: number
  best: number
}

export interface Records {
  bestMonth?: { key: string; pace: number }
  bestSessionPace?: { id: string; pace: number }
  mostPoints?: { id: string; points: number }
  monthStreak: Streak
  sessionStreak: Streak
}

export interface MonthGroup extends Stats {
  key: string
  sessions: Session[]
}

export function sessionSortTime(s: Session): number {
  if (s.source === 'live') return s.startedAt
  const [y, m, d] = s.date.split('-').map(Number)
  return new Date(y, m - 1, d).getTime()
}

function finished(sessions: Session[]): Session[] {
  return sessions
    .filter((s) => s.source === 'manual' || s.endedAt !== undefined)
    .sort((a, b) => sessionSortTime(a) - sessionSortTime(b))
}

function streak(paces: number[]): Streak {
  let current = 0
  let best = 0
  for (const p of paces) {
    current = p >= BONUS_MAX ? current + 1 : 0
    best = Math.max(best, current)
  }
  return { current, best }
}

function groupByMonth(sessions: Session[]): Map<string, Session[]> {
  const groups = new Map<string, Session[]>()
  for (const s of sessions) {
    const key = monthKey(s)
    groups.set(key, [...(groups.get(key) ?? []), s])
  }
  return groups
}

export function computeRecords(sessions: Session[], now: number): Records {
  const done = finished(sessions)
  const records: Records = { monthStreak: { current: 0, best: 0 }, sessionStreak: { current: 0, best: 0 } }

  const qualifyingPaces: number[] = []
  for (const s of done) {
    const points = sessionPoints(s)
    const activeMs = sessionActiveMs(s, now)
    if (!records.mostPoints || points > records.mostPoints.points) records.mostPoints = { id: s.id, points }
    const p = pace(points, activeMs, 0)
    if (activeMs < QUALIFYING_SESSION_MS || p === undefined) continue
    qualifyingPaces.push(p)
    if (!records.bestSessionPace || p > records.bestSessionPace.pace) records.bestSessionPace = { id: s.id, pace: p }
  }
  records.sessionStreak = streak(qualifyingPaces)

  const currentKey = monthKeyOf(now)
  const monthPaces: number[] = []
  const months = [...groupByMonth(done).entries()].filter(([key]) => key < currentKey).sort(([a], [b]) => a.localeCompare(b))
  for (const [key, group] of months) {
    const stats = totals(group, now)
    if (stats.activeMs < QUALIFYING_MONTH_MS || stats.pace === undefined) continue
    monthPaces.push(stats.pace)
    if (!records.bestMonth || stats.pace > records.bestMonth.pace) records.bestMonth = { key, pace: stats.pace }
  }
  records.monthStreak = streak(monthPaces)

  return records
}

export function recordsBroken(before: Records, after: Records): string[] {
  const broken: string[] = []
  if (before.bestSessionPace && after.bestSessionPace && after.bestSessionPace.pace > before.bestSessionPace.pace) {
    broken.push('Bästa pass')
  }
  if (before.mostPoints && after.mostPoints && after.mostPoints.points > before.mostPoints.points) {
    broken.push('Flest poäng i ett pass')
  }
  if (before.sessionStreak.best > 0 && after.sessionStreak.best > before.sessionStreak.best) {
    broken.push('Längsta maxbonus-svit')
  }
  return broken
}

export function historyByMonth(sessions: Session[], now: number): MonthGroup[] {
  return [...groupByMonth(finished(sessions)).entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, group]) => ({ key, ...totals(group, now), sessions: [...group].reverse() }))
}
