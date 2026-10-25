import { monthKey, monthStats, pace, sessionActiveMs, sessionCounts, sessionPoints } from '../domain/scoring'
import { addStop, endSession, undo, upsertSession } from '../domain/session'
import type { LiveSession } from '../domain/types'
import { formatPoints } from './format'
import type { Go, Update } from './nav'
import { PaceMeter } from './PaceMeter'
import { monthStatusText } from './statusText'
import type { StoredState } from '../domain/types'

interface Props {
  state: StoredState
  active: LiveSession
  now: number
  update: Update
  go: Go
}

export function PickScreen({ state, active, now, update, go }: Props) {
  // The session's own month, so a shift crossing midnight on the 31st stays in its month.
  const stats = monthStats(state.sessions, monthKey(active), now)
  const points = sessionPoints(active)
  const { stops } = sessionCounts(active)

  const change = (fn: (s: LiveSession) => LiveSession) =>
    update((st) => {
      const current = st.sessions.find((s) => s.id === active.id) as LiveSession
      return upsertSession(st, fn(current))
    })

  const stop = (kolli: number) => {
    change((s) => addStop(s, kolli, Date.now()))
    navigator.vibrate?.(30)
  }

  const finish = () => {
    if (!window.confirm('Avsluta passet?')) return
    change((s) => endSession(s, Date.now()))
    go({ name: 'summary', id: active.id })
  }

  return (
    <main class="screen pick">
      <PaceMeter monthPace={stats.pace} sessionPace={pace(points, sessionActiveMs(active, now))} />
      <p class="status">{monthStatusText(stats, active.plannedEndAt, now)}</p>
      <p class="session-line">
        {formatPoints(points)} p · {stops} stopp
      </p>
      <div class="actions">
        <div class="stop-grid">
          <button class="btn btn-stop" onClick={() => stop(1)}>
            <span>1 kolli</span> <small>+2</small>
          </button>
          <button class="btn btn-stop" onClick={() => stop(2)}>
            <span>2 kolli</span> <small>+3</small>
          </button>
        </div>
        <div class="row">
          <button class="btn">Annat</button>
          <button class="btn" disabled={active.entries.length === 0} onClick={() => change(undo)}>
            Ångra
          </button>
        </div>
        <div class="row">
          <button class="btn btn-ghost">Paus</button>
          <button class="btn btn-ghost" onClick={finish}>
            Avsluta
          </button>
        </div>
      </div>
    </main>
  )
}
