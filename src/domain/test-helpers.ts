import { HOUR_MS } from './constants'
import type { Entry, LiveSession, ManualSession } from './types'

/** Local timestamp in 2026; defaults to Oct 20 (clear of the Oct 25 DST change). */
export const t = (h: number, m = 0, d = 20, mo = 10): number => new Date(2026, mo - 1, d, h, m).getTime()

export const live = (p: Partial<LiveSession> = {}): LiveSession => ({
  source: 'live',
  id: 's1',
  type: 'plock',
  startedAt: t(6),
  entries: [],
  pauses: [],
  ...p,
})

export const manual = (p: Partial<ManualSession> = {}): ManualSession => ({
  source: 'manual',
  id: 'm1',
  type: 'plock',
  date: '2026-10-20',
  activeMs: 4 * HOUR_MS,
  points: 900,
  ...p,
})

export const stops = (...kolli: number[]): Entry[] => kolli.map((k) => ({ kind: 'stop', kolli: k, at: t(7) }))
