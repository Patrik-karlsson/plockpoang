import { expect, test } from 'vitest'
import { HOUR_MS } from './constants'
import { computeRecords, historyByMonth, recordsBroken } from './records'
import { live, manual, t } from './test-helpers'

const H = HOUR_MS
const now = t(12, 0, 15, 12) // current month 2026-12
const pts = (points: number) => [{ kind: 'adjust' as const, points, at: t(7) }]
const A = live({ id: 'A', startedAt: t(6, 0, 1), endedAt: t(8, 0, 1), entries: pts(500) }) // 2 h, 250
const B = live({ id: 'B', startedAt: t(6, 0, 2), endedAt: t(6, 30, 2), entries: pts(200) }) // 0.5 h, not qualifying
const C = live({ id: 'C', startedAt: t(6, 0, 3), endedAt: t(9, 0, 3), entries: pts(690) }) // 3 h, 230
const D = manual({ id: 'D', date: '2026-10-04', activeMs: 4 * H, points: 1040 }) // 260
const E = live({ id: 'E', startedAt: t(6, 0, 5), endedAt: t(8, 0, 5), entries: pts(500) }) // 250

test('session records and streak', () => {
  const r = computeRecords([A, B, C, D, E], now)
  expect(r.bestSessionPace).toEqual({ id: 'D', pace: 260 })
  expect(r.mostPoints).toEqual({ id: 'D', points: 1040 })
  expect(r.sessionStreak).toEqual({ current: 2, best: 2 })
})

test('active session is excluded', () => {
  const active = live({ id: 'X', startedAt: t(6, 0, 6), entries: pts(5000) })
  expect(computeRecords([A, active], t(8, 0, 6)).mostPoints?.id).toBe('A')
})

test('month records use completed qualifying months; gaps are skipped', () => {
  const sessions = [
    manual({ id: 'aug', date: '2026-08-10', activeMs: 10 * H, points: 2300 }), // 230
    manual({ id: 'sep', date: '2026-09-10', activeMs: 10 * H, points: 2450 }), // 245
    manual({ id: 'oct', date: '2026-10-10', activeMs: 9 * H, points: 2250 }), // 250
    manual({ id: 'nov', date: '2026-11-10', activeMs: 5 * H, points: 1500 }), // not qualifying
    manual({ id: 'dec', date: '2026-12-10', activeMs: 10 * H, points: 2600 }), // current month
  ]
  const r = computeRecords(sessions, now)
  expect(r.bestMonth).toEqual({ key: '2026-10', pace: 250 })
  expect(r.monthStreak).toEqual({ current: 2, best: 2 })
})

test('recordsBroken only reports beaten existing records', () => {
  const before = computeRecords([A, C], now)
  expect(recordsBroken(before, computeRecords([A, C, D], now))).toEqual(['Bästa pass', 'Flest poäng i ett pass'])
  expect(recordsBroken(computeRecords([], now), computeRecords([A], now))).toEqual([])
})

test('historyByMonth groups newest first', () => {
  const groups = historyByMonth([D, A, manual({ id: 'S', date: '2026-09-02', activeMs: H, points: 200 })], now)
  expect(groups.map((g) => g.key)).toEqual(['2026-10', '2026-09'])
  expect(groups[0].sessions.map((s) => s.id)).toEqual(['D', 'A'])
  expect(groups[0]).toMatchObject({ points: 1540, activeMs: 6 * H })
})
