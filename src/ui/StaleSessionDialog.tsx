import { useState } from 'preact/hooks'
import { HOUR_MS } from '../domain/constants'
import type { LiveSession } from '../domain/types'
import { fromLocalInput, toLocalInput } from './format'

interface Props {
  session: LiveSession
  now: number
  onEnd(endedAt: number): void
  onContinue(): void
}

export function StaleSessionDialog({ session, now, onEnd, onContinue }: Props) {
  const suggested = Math.min(session.entries.at(-1)?.at ?? session.startedAt + 8 * HOUR_MS, now)
  const [end, setEnd] = useState(toLocalInput(suggested))
  const [error, setError] = useState<string>()

  const confirm = () => {
    const endedAt = end ? fromLocalInput(end) : NaN
    if (!(endedAt > session.startedAt)) return setError('Sluttiden måste vara efter starttiden')
    if (endedAt > now) return setError('Sluttiden kan inte vara i framtiden')
    onEnd(endedAt)
  }

  return (
    <div class="overlay">
      <div class="sheet" role="dialog" aria-label="Glömt avsluta">
        <h2>Glömde du avsluta passet?</h2>
        <p class="muted">Passet har pågått i över 12 timmar. När slutade du plocka?</p>
        <label class="field">
          <span>Sluttid</span>
          <input type="datetime-local" value={end} onInput={(e) => setEnd(e.currentTarget.value)} />
        </label>
        {error && <p class="error">{error}</p>}
        <button class="btn btn-primary" onClick={confirm}>
          Avsluta vid denna tid
        </button>
        <button class="btn btn-ghost" onClick={onContinue}>
          Fortsätt passet
        </button>
      </div>
    </div>
  )
}
