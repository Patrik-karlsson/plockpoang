import { useState } from 'preact/hooks'
import { formatPoints } from './format'

const MAX_DIGITS = 4

interface Props {
  currentTotal: number
  onStop(kolli: number): void
  onSetTotal(total: number): void
  onClose(): void
}

export function Keypad({ currentTotal, onStop, onSetTotal, onClose }: Props) {
  const [mode, setMode] = useState<'stop' | 'total'>('stop')
  const [digits, setDigits] = useState('')

  const value = digits === '' ? undefined : Number(digits)
  const valid = value !== undefined && (mode === 'total' || value > 0)

  const press = (d: string) => setDigits((cur) => (cur === '0' ? d : cur.length >= MAX_DIGITS ? cur : cur + d))

  const switchMode = (m: 'stop' | 'total') => {
    setMode(m)
    setDigits('')
  }

  const confirm = () => {
    if (!valid) return
    if (mode === 'stop') onStop(value)
    else onSetTotal(value)
    onClose()
  }

  return (
    <div class="overlay" onClick={onClose}>
      <div class="sheet" role="dialog" aria-label="Annat" onClick={(e) => e.stopPropagation()}>
        <div class="segmented">
          <button class={`btn ${mode === 'stop' ? 'is-active' : ''}`} onClick={() => switchMode('stop')}>
            Stopp med N kolli
          </button>
          <button class={`btn ${mode === 'total' ? 'is-active' : ''}`} onClick={() => switchMode('total')}>
            Ange total
          </button>
        </div>
        <div class="keypad-display">
          <span class="keypad-value">{digits || (mode === 'stop' ? 'kolli' : 'poäng')}</span>
          <span class="muted">
            {mode === 'stop'
              ? value
                ? `+${value + 1} p`
                : 'Antal kolli på hyllan'
              : `Nu: ${formatPoints(currentTotal)} p`}
          </span>
        </div>
        <div class="keypad-grid">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button key={d} class="btn btn-key" onClick={() => press(d)}>
              {d}
            </button>
          ))}
          <button class="btn btn-key" aria-label="Radera" onClick={() => setDigits((cur) => cur.slice(0, -1))}>
            ⌫
          </button>
          <button class="btn btn-key" onClick={() => press('0')}>
            0
          </button>
          <button class="btn btn-key btn-primary" disabled={!valid} onClick={confirm}>
            {mode === 'stop' ? 'Lägg till' : 'Spara'}
          </button>
        </div>
        <button class="btn btn-ghost" onClick={onClose}>
          Avbryt
        </button>
      </div>
    </div>
  )
}
