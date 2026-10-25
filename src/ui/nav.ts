import type { StoredState } from '../domain/types'

export type Screen =
  | { name: 'start' }
  | { name: 'pick' }
  | { name: 'summary'; id: string; celebrate?: boolean }
  | { name: 'manual'; id?: string }
  | { name: 'records' }

export type Update = (fn: (s: StoredState) => StoredState) => void
export type Go = (screen: Screen) => void
