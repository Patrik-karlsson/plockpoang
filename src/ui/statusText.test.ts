import { expect, test } from 'vitest'
import { HOUR_MS, MINUTE_MS } from '../domain/constants'
import { pace } from '../domain/scoring'
import { t } from '../domain/test-helpers'
import { cardDeltaText, monthStatusText } from './statusText'

const H = HOUR_MS
const s = (points: number, activeMs: number) => ({ points, activeMs, pace: pace(points, activeMs) })

test('monthStatusText', () => {
  expect(monthStatusText(s(1860, 8 * H), t(12), t(10))).toBe('Håll 270 p/h idag så når månaden 240')
  expect(monthStatusText(s(2500, 8 * H), t(12), t(10))).toBe('Månaden når maxbonus-takt')
  expect(monthStatusText(s(1860, 8 * H), undefined, t(10))).toBe('60 p till maxbonus-takt för månaden')
  expect(monthStatusText(s(1944, 8 * H), undefined, t(10))).toBe('Månaden på maxbonus-takt, 24 p marginal')
  expect(monthStatusText(s(6, 2 * MINUTE_MS), undefined, t(10))).toBe('Takten visas efter 5 min')
})
test('cardDeltaText', () => {
  expect(cardDeltaText(s(0, 0))).toBe('Inget plock ännu denna månad')
  expect(cardDeltaText(s(1882, 8 * H))).toBe('38 p till maxbonus-takt')
  expect(cardDeltaText(s(2040, 8 * H))).toBe('Maxbonus-takt, 120 p marginal')
})
