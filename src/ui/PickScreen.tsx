import { useState } from 'preact/hooks'
import { monthKey, monthStats, pace, sessionActiveMs, sessionCounts, sessionPoints } from '../domain/scoring'
import {
  addStop,
  endSession,
  pauseSession,
  resumeSession,
  setTotal,
  undo,
  upsertSession,
} from '../domain/session'
import type { LiveSession, StoredState } from '../domain/types'
import { formatPoints, formatTime } from './format'
import { Keypad } from './Keypad'
import { PAUSE_LABELS } from './labels'
import type { Go, Update } from './nav'
import { PaceMeter } from './PaceMeter'
import { PauseDialog } from './PauseDialog'
import { monthStatusText } from './statusText'

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
  const openPause = active.pauses.find((p) => p.end === undefined)
  const [dialog, setDialog] = useState<'keypad' | 'pause' | null>(null)

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
    go({ name: 'summary', id: active.id, celebrate: true })
  }

  return (
    <main class="screen pick">
      <PaceMeter monthPace={stats.pace} sessionPace={pace(points, sessionActiveMs(active, now))} />
      <p class="status">{monthStatusText(stats, active.plannedEndAt, now)}</p>
      <p class="session-line">
        {formatPoints(points)} p · {stops} stopp
      </p>
      {openPause && (
        <p class="paused-line">
          Pausad – {PAUSE_LABELS[openPause.reason]} sedan {formatTime(openPause.start)}
        </p>
      )}
      <div class="actions">
        <div class="stop-grid">
          <button class="btn btn-stop" disabled={!!openPause} onClick={() => stop(1)}>
            <span>1 kolli</span> <small>+2</small>
          </button>
          <button class="btn btn-stop" disabled={!!openPause} onClick={() => stop(2)}>
            <span>2 kolli</span> <small>+3</small>
          </button>
        </div>
        <div class="row">
          <button class="btn" disabled={!!openPause} onClick={() => setDialog('keypad')}>
            Annat
          </button>
          <button class="btn" disabled={active.entries.length === 0} onClick={() => change(undo)}>
            Ångra
          </button>
        </div>
        <div class="row">
          {openPause ? (
            <button class="btn btn-primary" onClick={() => change((s) => resumeSession(s, Date.now()))}>
              Fortsätt
            </button>
          ) : (
            <button class="btn btn-ghost" onClick={() => setDialog('pause')}>
              Paus
            </button>
          )}
          <button class="btn btn-ghost" onClick={finish}>
            Avsluta
          </button>
        </div>
      </div>
      {dialog === 'keypad' && (
        <Keypad
          currentTotal={points}
          onStop={stop}
          onSetTotal={(total) => change((s) => setTotal(s, total, Date.now()))}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === 'pause' && (
        <PauseDialog
          onPick={(reason) => {
            change((s) => pauseSession(s, reason, Date.now()))
            setDialog(null)
          }}
          onClose={() => setDialog(null)}
        />
      )}
    </main>
  )
}
