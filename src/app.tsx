import { useEffect, useRef, useState } from 'preact/hooks'
import { STALE_SESSION_MS } from './domain/constants'
import { activeSession, deleteSession, editTimes, endSession, upsertSession } from './domain/session'
import type { ManualSession, StoredState } from './domain/types'
import { loadState, saveState } from './storage'
import { todayKey } from './ui/format'
import { ManualSessionForm } from './ui/ManualSessionForm'
import type { Screen, Update } from './ui/nav'
import { PickScreen } from './ui/PickScreen'
import { RecordsScreen } from './ui/RecordsScreen'
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
    const id = screen.id
    const initial = state.sessions.find((s): s is ManualSession => s.id === id && s.source === 'manual')
    const back = () => setScreen(initial ? { name: 'records' } : { name: 'start' })
    content = (
      <ManualSessionForm
        key={id ?? 'new'}
        initial={initial}
        today={todayKey(now)}
        onSave={(m) => {
          update((s) => upsertSession(s, m))
          back()
        }}
        onDelete={() => {
          update((s) => deleteSession(s, id!))
          back()
        }}
        onCancel={back}
      />
    )
  } else if (screen.name === 'records') {
    content = (
      <RecordsScreen
        sessions={state.sessions}
        now={now}
        onOpen={(s) => setScreen(s.source === 'live' ? { name: 'summary', id: s.id } : { name: 'manual', id: s.id })}
        onBack={() => setScreen({ name: 'start' })}
      />
    )
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
