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
export function loadState(storage: Storage = localStorage, now = Date.now()): StoredState {
  const raw = storage.getItem(STORAGE_KEY)
  if (raw === null) return emptyState()
  try {
    const parsed: unknown = JSON.parse(raw)
    if (isStoredState(parsed)) return parsed
  } catch {
    // fall through to backup
  }
  try {
    storage.setItem(BACKUP_PREFIX + now, raw)
  } catch {
    // nothing more we can do
  }
  return emptyState()
}

export function saveState(state: StoredState, storage: Storage = localStorage): boolean {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}
