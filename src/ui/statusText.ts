import { MIN_PACE_MS } from '../domain/constants'
import { holdToday, monthDelta, type Stats } from '../domain/scoring'

export function monthStatusText(stats: Stats, plannedEndAt: number | undefined, now: number): string {
  if (stats.activeMs < MIN_PACE_MS) return 'Takten visas efter 5 min'
  const hold = holdToday(stats, plannedEndAt, now)
  if (hold?.kind === 'pace') return `Håll ${Math.ceil(hold.requiredPace)} p/h idag så når månaden 240`
  if (hold?.kind === 'reached') return 'Månaden når maxbonus-takt'
  const delta = monthDelta(stats)
  if (delta < 0) return `${Math.ceil(-delta)} p till maxbonus-takt för månaden`
  return `Månaden på maxbonus-takt, ${Math.floor(delta)} p marginal`
}

export function cardDeltaText(stats: Stats): string {
  if (stats.activeMs === 0) return 'Inget plock ännu denna månad'
  if (stats.activeMs < MIN_PACE_MS) return 'Takten visas efter 5 min'
  const delta = monthDelta(stats)
  if (delta < 0) return `${Math.ceil(-delta)} p till maxbonus-takt`
  return `Maxbonus-takt, ${Math.floor(delta)} p marginal`
}
