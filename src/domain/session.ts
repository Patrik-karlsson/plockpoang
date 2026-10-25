import { MAX_MANUAL_MS } from './constants'
import { sessionPoints } from './scoring'
import type { LiveSession, ManualSession, PauseReason, Session, StoredState } from './types'

export interface ManualInput {
  date: string
  activeMs: number
  points: number
}

export function startSession(now: number, id: string, plannedEndAt?: number): LiveSession {
  return { source: 'live', id, type: 'plock', startedAt: now, plannedEndAt, entries: [], pauses: [] }
}

export function addStop(s: LiveSession, kolli: number, now: number): LiveSession {
  if (!Number.isInteger(kolli) || kolli < 1) throw new RangeError(`Ogiltigt antal kolli: ${kolli}`)
  return { ...s, entries: [...s.entries, { kind: 'stop', kolli, at: now }] }
}

export function setTotal(s: LiveSession, total: number, now: number): LiveSession {
  if (!Number.isInteger(total) || total < 0) throw new RangeError(`Ogiltig total: ${total}`)
  const diff = total - sessionPoints(s)
  if (diff === 0) return s
  return { ...s, entries: [...s.entries, { kind: 'adjust', points: diff, at: now }] }
}

export function undo(s: LiveSession): LiveSession {
  return { ...s, entries: s.entries.slice(0, -1) }
}

export function isPaused(s: LiveSession): boolean {
  return s.pauses.some((p) => p.end === undefined)
}

export function pauseSession(s: LiveSession, reason: PauseReason, now: number): LiveSession {
  if (isPaused(s)) return s
  return { ...s, pauses: [...s.pauses, { start: now, reason }] }
}

export function resumeSession(s: LiveSession, now: number): LiveSession {
  if (!isPaused(s)) return s
  return { ...s, pauses: s.pauses.map((p) => (p.end === undefined ? { ...p, end: now } : p)) }
}

export function endSession(s: LiveSession, now: number): LiveSession {
  return { ...resumeSession(s, now), endedAt: now }
}

export function editTimes(s: LiveSession, startedAt: number, endedAt: number): LiveSession {
  if (startedAt >= endedAt) throw new RangeError('Sluttiden måste vara efter starttiden')
  const pauses = s.pauses
    .map((p) => ({
      ...p,
      start: Math.max(p.start, startedAt),
      end: Math.min(p.end ?? endedAt, endedAt),
    }))
    .filter((p) => p.end > p.start)
  return { ...s, startedAt, endedAt, pauses }
}

export function validateManual(input: ManualInput, today: string): string | undefined {
  if (input.date > today) return 'Datumet kan inte vara i framtiden'
  if (!(input.activeMs > 0)) return 'Plocktiden måste vara mer än 0'
  if (input.activeMs > MAX_MANUAL_MS) return 'Plocktiden kan vara högst 16 h'
  if (!Number.isInteger(input.points) || input.points < 0) return 'Poängen måste vara ett heltal, 0 eller mer'
  return undefined
}

export function createManual(input: ManualInput, id: string): ManualSession {
  return { source: 'manual', id, type: 'plock', date: input.date, activeMs: input.activeMs, points: input.points }
}

export function activeSession(state: StoredState): LiveSession | undefined {
  return state.sessions.find((s): s is LiveSession => s.source === 'live' && s.endedAt === undefined)
}

export function upsertSession(state: StoredState, s: Session): StoredState {
  const exists = state.sessions.some((x) => x.id === s.id)
  return {
    ...state,
    sessions: exists ? state.sessions.map((x) => (x.id === s.id ? s : x)) : [...state.sessions, s],
  }
}

export function deleteSession(state: StoredState, id: string): StoredState {
  return { ...state, sessions: state.sessions.filter((s) => s.id !== id) }
}
