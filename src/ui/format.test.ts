import { expect, test } from 'vitest'
import { HOUR_MS, MINUTE_MS } from '../domain/constants'
import { t } from '../domain/test-helpers'
import {
  formatDate,
  formatDuration,
  formatMonth,
  formatPace,
  formatPoints,
  formatTime,
  fromLocalInput,
  parsePlannedEnd,
  toLocalInput,
  todayKey,
} from './format'

test('formatPace', () => {
  expect(formatPace(undefined)).toBe('—')
  expect(formatPace(232.6)).toBe('233')
})
test('formatPoints', () => {
  expect(formatPoints(14592).replace(/\s/g, ' ')).toBe('14 592')
})
test('formatDuration', () => {
  expect(formatDuration(100 * MINUTE_MS)).toBe('1 h 40 min')
  expect(formatDuration(45 * MINUTE_MS)).toBe('45 min')
  expect(formatDuration(2 * HOUR_MS)).toBe('2 h')
})
test('formatMonth', () => {
  expect(formatMonth('2026-10')).toBe('oktober 2026')
})
test('formatTime / todayKey / formatDate', () => {
  expect(formatTime(t(6, 5))).toBe('06:05')
  expect(todayKey(t(6, 5))).toBe('2026-10-20')
  expect(formatDate(t(6, 5))).toBe('tis 20 okt')
})
test('local input round trip', () => {
  expect(toLocalInput(t(6, 5))).toBe('2026-10-20T06:05')
  expect(fromLocalInput('2026-10-20T06:05')).toBe(t(6, 5))
})
test('parsePlannedEnd handles night shifts', () => {
  expect(parsePlannedEnd('14:00', t(6))).toBe(t(14))
  expect(parsePlannedEnd('06:00', t(22))).toBe(t(6, 0, 21))
  expect(parsePlannedEnd('', t(6))).toBeUndefined()
})
