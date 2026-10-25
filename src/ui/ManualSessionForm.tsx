import { useState } from 'preact/hooks'
import { HOUR_MS, MINUTE_MS } from '../domain/constants'
import { createManual, validateManual } from '../domain/session'
import type { ManualSession } from '../domain/types'

interface Props {
  initial?: ManualSession
  today: string
  onSave(s: ManualSession): void
  onDelete?(): void
  onCancel(): void
}

const toNumber = (v: string) => (v.trim() === '' ? NaN : Number(v))

export function ManualSessionForm({ initial, today, onSave, onDelete, onCancel }: Props) {
  const [date, setDate] = useState(initial?.date ?? today)
  const [hours, setHours] = useState(initial ? String(Math.floor(initial.activeMs / HOUR_MS)) : '')
  const [minutes, setMinutes] = useState(initial ? String(Math.round((initial.activeMs % HOUR_MS) / MINUTE_MS)) : '')
  const [points, setPoints] = useState(initial ? String(initial.points) : '')
  const [error, setError] = useState<string>()

  const save = () => {
    const activeMs = ((Number(hours) || 0) * 60 + (Number(minutes) || 0)) * MINUTE_MS
    const input = { date, activeMs, points: toNumber(points) }
    const message = validateManual(input, today)
    if (message) return setError(message)
    onSave(createManual(input, initial?.id ?? crypto.randomUUID()))
  }

  const remove = () => {
    if (onDelete && window.confirm('Ta bort passet?')) onDelete()
  }

  return (
    <main class="screen">
      <h1 class="screen-title">{initial ? 'Ändra pass' : 'Lägg till pass i efterhand'}</h1>
      <section class="card form">
        <label class="field">
          <span>Datum</span>
          <input type="date" max={today} value={date} onInput={(e) => setDate(e.currentTarget.value)} />
        </label>
        <div class="row">
          <label class="field">
            <span>Timmar</span>
            <input inputMode="numeric" value={hours} onInput={(e) => setHours(e.currentTarget.value)} />
          </label>
          <label class="field">
            <span>Minuter</span>
            <input inputMode="numeric" value={minutes} onInput={(e) => setMinutes(e.currentTarget.value)} />
          </label>
        </div>
        <label class="field">
          <span>Poäng</span>
          <input inputMode="numeric" value={points} onInput={(e) => setPoints(e.currentTarget.value)} />
        </label>
        {error && <p class="error">{error}</p>}
      </section>
      <div class="actions">
        <button class="btn btn-primary btn-big" onClick={save}>
          Spara
        </button>
        {initial && onDelete && (
          <button class="btn btn-ghost btn-danger" onClick={remove}>
            Ta bort
          </button>
        )}
        <button class="btn btn-ghost" onClick={onCancel}>
          Avbryt
        </button>
      </div>
    </main>
  )
}
