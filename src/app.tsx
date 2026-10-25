import { useEffect, useRef, useState } from 'preact/hooks'
import { STALE_SESSION_MS } from './domain/constants'
import { activeSession, editTimes, endSession, upsertSession } from './domain/session'
import type { StoredState } from './domain/types'
import { loadState, saveState } from './storage'
import type { Screen, Update } from './ui/nav'
import { PickScreen } from './ui/PickScreen'
import { StaleSessionDialog } from './ui/StaleSessionDialog'
import { StartScreen } from './ui/StartScreen'
import { SummaryScreen } from './ui/SummaryScreen'

export function App() {
  const stateRef = useRef<StoredState | null>(null)
  if (stateRef.current === null) stateRef.current = loadState()
  const [state, setState] = useState<StoredState>(stateRef.current)
  const [now, setNow] = useState(Date.now())
  const [screen, setScreen] = useState<Screen>(() => (activeSession(state) ? { name: 'pick' } : { name: 'start' }))
  const [saveFailed, setSaveFailed] = useState(false)
  const [staleDismissed, setStaleDismissed] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Apply against the latest state (not the last render) so rapid taps never get lost.
  const update: Update = (fn) => {
    const next = fn(stateRef.current!)
    stateRef.current = next
    setState(next)
    setNow(Date.now())
    setSaveFailed(!saveState(next))
  }

  const active = activeSession(state)

  let content
  if (screen.name === 'pick' && active) {
    content = <PickScreen state={state} active={active} now={now} update={update} go={setScreen} />
  } else if (screen.name === 'summary') {
    content = (
      <SummaryScreen state={state} id={screen.id} now={now} update={update} onClose={() => setScreen({ name: 'start' })} />
    )
  } else if (screen.name === 'manual') {
    content = <p>Lägg till pass</p>
  } else if (screen.name === 'records') {
    content = <p>Rekord</p>
  } else {
    content = <StartScreen state={state} now={now} update={update} go={setScreen} />
  }

  return (
    <>
      {saveFailed && <div class="banner banner-warn">Kunde inte spara – data kan gå förlorad</div>}
      {content}
      {active && !staleDismissed && now - active.startedAt > STALE_SESSION_MS && (
        <StaleSessionDialog
          session={active}
          now={now}
          onEnd={(endedAt) => {
            // editTimes clips any pause that started after the chosen end time.
            update((s) => upsertSession(s, editTimes(endSession(active, endedAt), active.startedAt, endedAt)))
            setScreen({ name: 'summary', id: active.id })
          }}
          onContinue={() => setStaleDismissed(true)}
        />
      )}
    </>
  )
}
