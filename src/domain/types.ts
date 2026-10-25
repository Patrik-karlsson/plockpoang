export type SessionType = 'plock' // 'truck' added later

export type PauseReason = 'systemfel' | 'mote' | 'olycka' | 'annat'

export type Entry =
  | { kind: 'stop'; kolli: number; at: number } // points = kolli + 1
  | { kind: 'adjust'; points: number; at: number } // may be negative

export interface Pause {
  start: number
  end?: number // undefined while paused
  reason: PauseReason
}

export interface LiveSession {
  source: 'live'
  id: string
  type: SessionType
  startedAt: number // epoch ms
  endedAt?: number // undefined while active
  plannedEndAt?: number
  entries: Entry[]
  pauses: Pause[]
}

export interface ManualSession {
  source: 'manual'
  id: string
  type: SessionType
  date: string // 'YYYY-MM-DD', local
  activeMs: number
  points: number
}

export type Session = LiveSession | ManualSession

export interface StoredState {
  version: 1
  sessions: Session[] // at most one live session has endedAt === undefined
}
