import type { StoredState } from './domain/types'

export const STORAGE_KEY = 'plockpoang'
export const BACKUP_PREFIX = 'plockpoang.backup.'

export function emptyState(): StoredState {
  return { version: 1, sessions: [] }
}

function isStoredState(value: unknown): value is StoredState {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as StoredState).version === 1 &&
    Array.isArray((value as StoredState).sessions)
  )
}

/** Loads saved state; unreadable data is kept under a backup key instead of being overwritten. */
export function loadState(storage?: Storage, now = Date.now()): StoredState {
  let st: Storage
  let raw: string | null
  try {
    // Reading `localStorage` itself throws when site data is blocked.
    st = storage ?? localStorage
    raw = st.getItem(STORAGE_KEY)
  } catch {
    return emptyState()
  }
  if (raw === null) return emptyState()
  try {
    const parsed: unknown = JSON.parse(raw)
    if (isStoredState(parsed)) return parsed
  } catch {
    // fall through to backup
  }
  try {
    st.setItem(BACKUP_PREFIX + now, raw)
  } catch {
    // nothing more we can do
  }
  return emptyState()
}

export function saveState(state: StoredState, storage?: Storage): boolean {
  try {
    const st = storage ?? localStorage
    st.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}
