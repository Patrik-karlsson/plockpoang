import { expect, test } from 'vitest'
import { HOUR_MS, MINUTE_MS } from './constants'
import {
  holdToday,
  monthDelta,
  monthKey,
  monthStats,
  pace,
  paceLevel,
  sessionActiveMs,
  sessionCounts,
  sessionPoints,
} from './scoring'
import { live, manual, stops, t } from './test-helpers'

const H = HOUR_MS

test('sessionPoints sums kolli+1 per stop plus adjustments', () => {
  const s = live({ entries: [...stops(1, 2, 5), { kind: 'adjust', points: -3, at: t(8) }] })
  expect(sessionPoints(s)).toBe(8)
  expect(sessionPoints(manual({ points: 500 }))).toBe(500)
})

test('sessionActiveMs subtracts closed pauses', () => {
  const s = live({ endedAt: t(10), pauses: [{ start: t(7), end: t(7, 30), reason: 'mote' }] })
  expect(sessionActiveMs(s, t(12))).toBe(3.5 * H)
})

test('open pause counts until now while active', () => {
  const s = live({ pauses: [{ start: t(9), reason: 'systemfel' }] })
  expect(sessionActiveMs(s, t(10))).toBe(3 * H)
})

test('open pause on an ended session counts until endedAt', () => {
  const s = live({ endedAt: t(10), pauses: [{ start: t(9, 30), reason: 'annat' }] })
  expect(sessionActiveMs(s, t(12))).toBe(3.5 * H)
})

test('manual active time is stored value', () => {
  expect(sessionActiveMs(manual({ activeMs: 2 * H }), t(12))).toBe(2 * H)
})

test('sessionCounts', () => {
  expect(sessionCounts(live({ entries: stops(1, 2, 5) }))).toEqual({ stops: 3, kolli: 8 })
})

test('pace', () => {
  expect(pace(480, 2 * H)).toBe(240)
  expect(pace(10, 4 * MINUTE_MS)).toBeUndefined()
  expect(pace(10, 4 * MINUTE_MS, 0)).toBe(150)
  expect(pace(0, 0, 0)).toBeUndefined()
})

test('monthKey uses local start date, across month boundary', () => {
  expect(monthKey(live({ startedAt: t(23, 30, 31, 10) }))).toBe('2026-10')
  expect(monthKey(live({ startedAt: t(0, 30, 1, 11) }))).toBe('2026-11')
  expect(monthKey(manual({ date: '2026-09-30' }))).toBe('2026-09')
})

test('monthStats combines live and manual sessions of that month only', () => {
  const sessions = [
    manual({ id: 'a', date: '2026-10-01', activeMs: 4 * H, points: 900 }),
    live({ id: 'b', endedAt: t(10), entries: [{ kind: 'adjust', points: 960, at: t(9) }] }),
    manual({ id: 'c', date: '2026-09-30', activeMs: 4 * H, points: 1000 }),
  ]
  expect(monthStats(sessions, '2026-10', t(12))).toEqual({ points: 1860, activeMs: 8 * H, pace: 232.5 })
})

test('active session crossing midnight stays in its start month', () => {
  const s = live({ startedAt: t(23, 0, 31, 10), entries: [{ kind: 'adjust', points: 480, at: t(0, 30, 1, 11) }] })
  const now = t(1, 0, 1, 11)
  expect(monthStats([s], '2026-10', now)).toEqual({ points: 480, activeMs: 2 * H, pace: 240 })
  expect(monthStats([s], '2026-11', now).pace).toBeUndefined()
})

test('monthDelta', () => {
  expect(monthDelta({ points: 1860, activeMs: 8 * H, pace: 232.5 })).toBe(-60)
})

test('holdToday', () => {
  const stats = { points: 1860, activeMs: 8 * H, pace: 232.5 }
  expect(holdToday(stats, t(12), t(10))).toEqual({ kind: 'pace', requiredPace: 270 })
  expect(holdToday({ ...stats, points: 2500 }, t(12), t(10))).toEqual({ kind: 'reached' })
  expect(holdToday(stats, t(9), t(10))).toBeUndefined()
  expect(holdToday(stats, undefined, t(10))).toBeUndefined()
  expect(holdToday(stats, t(10) + 30_000, t(10))).toBeUndefined() // < 1 min left
})

test('paceLevel', () => {
  expect(paceLevel(undefined)).toBe('unknown')
  expect(paceLevel(204.9)).toBe('below')
  expect(paceLevel(205)).toBe('bonus')
  expect(paceLevel(239.9)).toBe('bonus')
  expect(paceLevel(240)).toBe('max')
})
