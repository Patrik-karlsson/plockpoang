import { expect, test } from 'vitest'
import { HOUR_MS } from './constants'
import {
  activeSession,
  addStop,
  createManual,
  deleteSession,
  editTimes,
  endSession,
  isPaused,
  pauseSession,
  resumeSession,
  setTotal,
  startSession,
  undo,
  upsertSession,
  validateManual,
} from './session'
import { live, manual, stops, t } from './test-helpers'

test('startSession', () => {
  expect(startSession(t(6), 'a', t(14))).toEqual({
    source: 'live', id: 'a', type: 'plock', startedAt: t(6), plannedEndAt: t(14), entries: [], pauses: [],
  })
})

test('addStop appends without mutating and validates kolli', () => {
  const s = live()
  const s2 = addStop(s, 1, t(7))
  expect(s2.entries).toEqual([{ kind: 'stop', kolli: 1, at: t(7) }])
  expect(s.entries).toEqual([])
  expect(() => addStop(s, 0, t(7))).toThrow(RangeError)
  expect(() => addStop(s, 1.5, t(7))).toThrow(RangeError)
})

test('setTotal stores the difference as an adjustment', () => {
  const s = live({ entries: stops(1, 2) }) // 5 p
  expect(setTotal(s, 20, t(8)).entries.at(-1)).toEqual({ kind: 'adjust', points: 15, at: t(8) })
  expect(setTotal(s, 3, t(8)).entries.at(-1)).toEqual({ kind: 'adjust', points: -2, at: t(8) })
  expect(setTotal(s, 5, t(8))).toBe(s)
  expect(() => setTotal(s, -1, t(8))).toThrow(RangeError)
})

test('undo removes the last entry; no-op when empty', () => {
  expect(undo(live({ entries: stops(1, 2) })).entries).toEqual(stops(1))
  expect(undo(live()).entries).toEqual([])
})

test('pause and resume', () => {
  const p = pauseSession(live(), 'mote', t(8))
  expect(isPaused(p)).toBe(true)
  expect(pauseSession(p, 'annat', t(9))).toBe(p)
  const r = resumeSession(p, t(8, 20))
  expect(r.pauses).toEqual([{ start: t(8), end: t(8, 20), reason: 'mote' }])
  expect(isPaused(r)).toBe(false)
  expect(resumeSession(r, t(9))).toBe(r)
})

test('endSession closes an open pause', () => {
  const s = endSession(pauseSession(live(), 'olycka', t(9)), t(10))
  expect(s.endedAt).toBe(t(10))
  expect(s.pauses[0].end).toBe(t(10))
})

test('editTimes clips pauses to the new range', () => {
  const s = live({
    endedAt: t(14),
    pauses: [
      { start: t(6, 30), end: t(7), reason: 'mote' },
      { start: t(13), end: t(13, 45), reason: 'systemfel' },
    ],
  })
  const e = editTimes(s, t(7), t(13, 30))
  expect([e.startedAt, e.endedAt]).toEqual([t(7), t(13, 30)])
  expect(e.pauses).toEqual([{ start: t(13), end: t(13, 30), reason: 'systemfel' }])
  expect(() => editTimes(s, t(14), t(14))).toThrow(RangeError)
})

test('validateManual', () => {
  const ok = { date: '2026-10-20', activeMs: 4 * HOUR_MS, points: 900 }
  expect(validateManual(ok, '2026-10-25')).toBeUndefined()
  expect(validateManual({ ...ok, date: '2026-10-26' }, '2026-10-25')).toBe('Datumet kan inte vara i framtiden')
  expect(validateManual({ ...ok, activeMs: 0 }, '2026-10-25')).toBe('Plocktiden måste vara mer än 0')
  expect(validateManual({ ...ok, activeMs: 17 * HOUR_MS }, '2026-10-25')).toBe('Plocktiden kan vara högst 16 h')
  expect(validateManual({ ...ok, points: -1 }, '2026-10-25')).toBe('Poängen måste vara ett heltal, 0 eller mer')
  expect(validateManual({ ...ok, points: 1.5 }, '2026-10-25')).toBe('Poängen måste vara ett heltal, 0 eller mer')
})

test('createManual', () => {
  expect(createManual({ date: '2026-10-20', activeMs: HOUR_MS, points: 250 }, 'm9')).toEqual({
    source: 'manual', id: 'm9', type: 'plock', date: '2026-10-20', activeMs: HOUR_MS, points: 250,
  })
})

test('state helpers', () => {
  const st = { version: 1 as const, sessions: [live({ id: 'x', endedAt: t(10) }), live({ id: 'y' })] }
  expect(activeSession(st)?.id).toBe('y')
  const replaced = upsertSession(st, live({ id: 'y', endedAt: t(11) })).sessions[1]
  expect(replaced.source === 'live' && replaced.endedAt).toBe(t(11))
  expect(upsertSession(st, manual({ id: 'z' })).sessions).toHaveLength(3)
  expect(deleteSession(st, 'x').sessions.map((s) => s.id)).toEqual(['y'])
})
