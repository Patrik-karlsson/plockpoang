import { computeRecords, historyByMonth, sessionSortTime } from '../domain/records'
import { monthKeyOf, monthStats, pace, sessionActiveMs, sessionPoints } from '../domain/scoring'
import type { Session } from '../domain/types'
import { formatDate, formatDuration, formatMonth, formatPace, formatPoints } from './format'

interface Props {
  sessions: Session[]
  now: number
  onOpen(s: Session): void
  onBack(): void
}

export function RecordsScreen({ sessions, now, onOpen, onBack }: Props) {
  const records = computeRecords(sessions, now)
  const groups = historyByMonth(sessions, now)
  const currentKey = monthKeyOf(now)
  const current = monthStats(sessions, currentKey, now)
  const dateOf = (id: string) => {
    const s = sessions.find((x) => x.id === id)
    return s ? formatDate(sessionSortTime(s)) : ''
  }

  const rows: [string, string][] = [
    ['Bästa månad', records.bestMonth ? `${formatMonth(records.bestMonth.key)} · ${formatPace(records.bestMonth.pace)} p/h` : '—'],
    ['Bästa pass', records.bestSessionPace ? `${dateOf(records.bestSessionPace.id)} · ${formatPace(records.bestSessionPace.pace)} p/h` : '—'],
    ['Flest poäng i ett pass', records.mostPoints ? `${dateOf(records.mostPoints.id)} · ${formatPoints(records.mostPoints.points)} p` : '—'],
    ['Maxbonus-månader i rad', `${records.monthStreak.current} (bästa ${records.monthStreak.best})`],
    ['Maxbonus-pass i rad', `${records.sessionStreak.current} (bästa ${records.sessionStreak.best})`],
  ]

  return (
    <main class="screen">
      <div class="screen-head">
        <button class="btn btn-ghost btn-back" onClick={onBack}>
          ← Tillbaka
        </button>
        <h1 class="screen-title">Rekord & historik</h1>
      </div>

      <section class="card">
        <h2 class="card-title">Rekord</h2>
        {current.activeMs > 0 && (
          <p class="month-delta">{`${formatMonth(currentKey)}: ${formatPace(current.pace)} p/h (pågår)`}</p>
        )}
        <div class="records">
          {rows.map(([label, value]) => (
            <div class="record-row" key={label}>
              <span class="muted">{label}</span>
              <span class="record-value">{value}</span>
            </div>
          ))}
        </div>
      </section>

      <section class="history">
        <h2 class="card-title">Historik</h2>
        {groups.length === 0 && <p class="muted">Inga pass ännu.</p>}
        {groups.map((g) => (
          <div class="card history-month" key={g.key}>
            <h3 class="history-head">
              {`${formatMonth(g.key)} · ${formatPace(g.pace)} p/h · ${formatDuration(g.activeMs)} · ${formatPoints(g.points)} p`}
            </h3>
            {g.sessions.map((s) => {
              const ms = sessionActiveMs(s, now)
              const pts = sessionPoints(s)
              return (
                <button class="history-row" key={s.id} onClick={() => onOpen(s)}>
                  <span>
                    {`${formatDate(sessionSortTime(s))} · ${formatDuration(ms)} · ${formatPoints(pts)} p · ${formatPace(pace(pts, ms, 0))} p/h`}
                  </span>
                  {s.source === 'manual' && <span class="tag">manuell</span>}
                </button>
              )
            })}
          </div>
        ))}
      </section>
    </main>
  )
}
