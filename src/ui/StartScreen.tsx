import { useState } from 'preact/hooks'
import { monthKeyOf, monthStats } from '../domain/scoring'
import { startSession, upsertSession } from '../domain/session'
import type { StoredState } from '../domain/types'
import { parsePlannedEnd } from './format'
import { MonthCard } from './MonthCard'
import type { Go, Update } from './nav'

interface Props {
  state: StoredState
  now: number
  update: Update
  go: Go
}

export function StartScreen({ state, now, update, go }: Props) {
  const [plannedEnd, setPlannedEnd] = useState('')
  const key = monthKeyOf(now)

  const start = () => {
    const at = Date.now()
    const session = startSession(at, crypto.randomUUID(), parsePlannedEnd(plannedEnd, at))
    update((s) => upsertSession(s, session))
    go({ name: 'pick' })
  }

  return (
    <main class="screen">
      <h1 class="app-title">Plockpoäng</h1>
      <MonthCard stats={monthStats(state.sessions, key, now)} monthKey={key} />
      <div class="actions">
        <label class="field">
          <span>Planerad sluttid (valfritt)</span>
          <input type="time" value={plannedEnd} onInput={(e) => setPlannedEnd(e.currentTarget.value)} />
        </label>
        <button class="btn btn-primary btn-big" onClick={start}>
          Starta plock
        </button>
        <button class="btn" onClick={() => go({ name: 'manual' })}>
          Lägg till pass i efterhand
        </button>
        <button class="btn btn-ghost" onClick={() => go({ name: 'records' })}>
          Rekord & historik
        </button>
      </div>
    </main>
  )
}
