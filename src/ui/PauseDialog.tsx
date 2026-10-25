import type { PauseReason } from '../domain/types'
import { PAUSE_LABELS } from './labels'

interface Props {
  onPick(reason: PauseReason): void
  onClose(): void
}

export function PauseDialog({ onPick, onClose }: Props) {
  return (
    <div class="overlay" onClick={onClose}>
      <div class="sheet" role="dialog" aria-label="Paus" onClick={(e) => e.stopPropagation()}>
        <h2>Varför paus?</h2>
        <div class="row">
          {(Object.keys(PAUSE_LABELS) as PauseReason[]).map((reason) => (
            <button key={reason} class="btn" onClick={() => onPick(reason)}>
              {PAUSE_LABELS[reason]}
            </button>
          ))}
        </div>
        <p class="muted">Kom ihåg att anmäla stoppet till teamledaren.</p>
        <button class="btn btn-ghost" onClick={onClose}>
          Avbryt
        </button>
      </div>
    </div>
  )
}
