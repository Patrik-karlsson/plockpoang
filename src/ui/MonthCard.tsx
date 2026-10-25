import { paceLevel, type Stats } from '../domain/scoring'
import { formatDuration, formatMonth, formatPace, formatPoints } from './format'
import { cardDeltaText } from './statusText'

interface Props {
  stats: Stats
  monthKey: string
}

export function MonthCard({ stats, monthKey }: Props) {
  return (
    <section class="card month-card" data-level={paceLevel(stats.pace)}>
      <h2 class="card-title">{formatMonth(monthKey)}</h2>
      <div class="month-pace">
        <span class="meter-value">{formatPace(stats.pace)}</span>
        <span class="meter-unit">p/h</span>
      </div>
      <p class="muted">
        {formatDuration(stats.activeMs)} · {formatPoints(stats.points)} p
      </p>
      <p class="month-delta">{cardDeltaText(stats)}</p>
    </section>
  )
}
