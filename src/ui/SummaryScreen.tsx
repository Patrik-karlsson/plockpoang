import { useEffect, useState } from 'preact/hooks'
import { BONUS_MAX } from '../domain/constants'
import { computeRecords, recordsBroken } from '../domain/records'
import { monthKey, monthStats, pace, sessionActiveMs, sessionCounts, sessionPoints } from '../domain/scoring'
import { deleteSession, editTimes, upsertSession } from '../domain/session'
import type { LiveSession, StoredState } from '../domain/types'
import { formatDuration, formatPace, formatPoints, formatTime, fromLocalInput, toLocalInput } from './format'
import { PAUSE_LABELS } from './labels'
import type { Update } from './nav'

interface Props {
  state: StoredState
  id: string
  now: number
  update: Update
  onClose(): void
}

export function SummaryScreen({ state, id, now, update, onClose }: Props) {
  const session = state.sessions.find((s): s is LiveSession => s.id === id && s.source === 'live')
  const [start, setStart] = useState(session ? toLocalInput(session.startedAt) : '')
  const [end, setEnd] = useState(session ? toLocalInput(session.endedAt ?? now) : '')
  const [error, setError] = useState<string>()

  const others = state.sessions.filter((s) => s.id !== id)
  const points = session ? sessionPoints(session) : 0
  const activeMs = session ? sessionActiveMs(session, now) : 0
  const sessionPace = pace(points, activeMs, 0)
  const key = session ? monthKey(session) : ''
  const before = monthStats(others, key, now)
  const after = monthStats(state.sessions, key, now)

  const celebrations: string[] = []
  if (sessionPace !== undefined && sessionPace >= BONUS_MAX) celebrations.push('Maxbonus-pass!')
  if ((before.pace ?? 0) < BONUS_MAX && after.pace !== undefined && after.pace >= BONUS_MAX) {
    celebrations.push('Månaden är på maxbonus-takt!')
  }
  for (const name of recordsBroken(computeRecords(others, now), computeRecords(state.sessions, now))) {
    celebrations.push(`Nytt rekord: ${name}`)
  }
  const celebrate = celebrations.length > 0

  useEffect(() => {
    if (celebrate) navigator.vibrate?.([60, 40, 60])
  }, [])

  if (!session) return null
  const { stops, kolli } = sessionCounts(session)

  const saveTimes = () => {
    if (!start || !end) return setError('Ange både start och slut')
    const from = fromLocalInput(start)
    const to = fromLocalInput(end)
    if (from >= to) return setError('Sluttiden måste vara efter starttiden')
    setError(undefined)
    update((s) => upsertSession(s, editTimes(session, from, to)))
  }

  const remove = () => {
    if (!window.confirm('Ta bort passet?')) return
    update((s) => deleteSession(s, id))
    onClose()
  }

  return (
    <main class="screen">
      {celebrate && (
        <div class="celebration">
          {celebrations.map((c) => (
            <p key={c}>{c}</p>
          ))}
        </div>
      )}
      <section class="card">
        <h2 class="card-title">Passet</h2>
        <div class="month-pace">
          <span class="meter-value">{formatPace(sessionPace)}</span>
          <span class="meter-unit">p/h</span>
        </div>
        <dl class="facts">
          <dt>Poäng</dt>
          <dd>{formatPoints(points)}</dd>
          <dt>Stopp</dt>
          <dd>{stops}</dd>
          <dt>Kolli</dt>
          <dd>{kolli}</dd>
          <dt>Tid</dt>
          <dd>{formatDuration(activeMs)}</dd>
        </dl>
        <p class="month-delta">
          Månaden: {formatPace(before.pace)} → {formatPace(after.pace)} p/h
        </p>
      </section>

      {session.pauses.length > 0 && (
        <section class="card">
          <h2 class="card-title">Pauser (anmäl till teamledaren)</h2>
          <ul class="plain-list">
            {session.pauses.map((p) => (
              <li key={p.start}>
                {PAUSE_LABELS[p.reason]} {formatTime(p.start)}–{p.end === undefined ? '' : formatTime(p.end)}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section class="card form">
        <h2 class="card-title">Ändra tider</h2>
        <label class="field">
          <span>Start</span>
          <input type="datetime-local" value={start} onInput={(e) => setStart(e.currentTarget.value)} />
        </label>
        <label class="field">
          <span>Slut</span>
          <input type="datetime-local" value={end} onInput={(e) => setEnd(e.currentTarget.value)} />
        </label>
        {error && <p class="error">{error}</p>}
        <button class="btn" onClick={saveTimes}>
          Spara tider
        </button>
      </section>

      <div class="actions">
        <button class="btn btn-primary btn-big" onClick={onClose}>
          Klar
        </button>
        <button class="btn btn-ghost btn-danger" onClick={remove}>
          Ta bort pass
        </button>
      </div>
    </main>
  )
}
