import { useEffect, useRef, useState } from 'preact/hooks'
import { activeSession } from './domain/session'
import type { StoredState } from './domain/types'
import { loadState, saveState } from './storage'
import type { Screen, Update } from './ui/nav'
import { PickScreen } from './ui/PickScreen'
import { StartScreen } from './ui/StartScreen'

export function App() {
  const stateRef = useRef<StoredState | null>(null)
  if (stateRef.current === null) stateRef.current = loadState()
  const [state, setState] = useState<StoredState>(stateRef.current)
  const [now, setNow] = useState(Date.now())
  const [screen, setScreen] = useState<Screen>(() => (activeSession(state) ? { name: 'pick' } : { name: 'start' }))
  const [saveFailed, setSaveFailed] = useState(false)

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
    content = <p>Sammanfattning</p>
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
    </>
  )
}
