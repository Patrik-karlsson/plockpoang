import { BONUS_MAX, BONUS_START } from '../domain/constants'
import { paceLevel } from '../domain/scoring'
import { formatPace } from './format'

const GAUGE_MIN = 120
const GAUGE_MAX = 260

const pct = (p: number) => (Math.min(Math.max(p, GAUGE_MIN), GAUGE_MAX) - GAUGE_MIN) / (GAUGE_MAX - GAUGE_MIN) * 100

interface Props {
  monthPace: number | undefined
  sessionPace: number | undefined
}

export function PaceMeter({ monthPace, sessionPace }: Props) {
  const level = paceLevel(monthPace)
  return (
    <section class="meter" data-level={level}>
      <div class="meter-figures">
        <div class="meter-main">
          <span class="meter-label">MÅNAD</span>
          <span class="meter-num">
            <span class="meter-value">{formatPace(monthPace)}</span>
            <span class="meter-unit">p/h</span>
          </span>
        </div>
        <div class="meter-side">
          <span class="meter-label">IDAG</span>
          <span class="meter-num">
            <span class="meter-value meter-value-small">{formatPace(sessionPace)}</span>
            <span class="meter-unit">p/h</span>
          </span>
        </div>
      </div>
      <div class="gauge" aria-hidden="true">
        <div class="gauge-zone" style={{ left: `${pct(BONUS_START)}%`, width: `${pct(BONUS_MAX) - pct(BONUS_START)}%` }} />
        <div class="gauge-fill" style={{ width: `${monthPace === undefined ? 0 : pct(monthPace)}%` }} />
        <div class="gauge-tick" style={{ left: `${pct(BONUS_START)}%` }} />
        <div class="gauge-tick gauge-tick-max" style={{ left: `${pct(BONUS_MAX)}%` }} />
      </div>
      <div class="gauge-scale" aria-hidden="true">
        <span style={{ left: `${pct(BONUS_START)}%` }}>{BONUS_START}</span>
        <span style={{ left: `${pct(BONUS_MAX)}%` }}>{BONUS_MAX}</span>
      </div>
      {level === 'bonus' && <span class="badge">Bonuszon</span>}
      {level === 'max' && <span class="badge badge-gold">Maxbonus</span>}
    </section>
  )
}
