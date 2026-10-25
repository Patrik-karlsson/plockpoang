import { expect, test } from 'vitest'
import { manual } from './domain/test-helpers'
import { loadState, saveState } from './storage'

class MemoryStorage implements Storage {
  private map = new Map<string, string>()
  get length() {
    return this.map.size
  }
  clear() {
    this.map.clear()
  }
  getItem(key: string) {
    return this.map.get(key) ?? null
  }
  key(i: number) {
    return [...this.map.keys()][i] ?? null
  }
  removeItem(key: string) {
    this.map.delete(key)
  }
  setItem(key: string, value: string) {
    this.map.set(key, value)
  }
}

test('missing key gives empty state', () => {
  expect(loadState(new MemoryStorage())).toEqual({ version: 1, sessions: [] })
})

test('round trip', () => {
  const st = new MemoryStorage()
  const state = { version: 1 as const, sessions: [manual()] }
  expect(saveState(state, st)).toBe(true)
  expect(loadState(st)).toEqual(state)
})

test.each(['not json', '{"version":2,"sessions":[]}', '{"version":1}', '42'])('corrupt %s is backed up', (raw) => {
  const st = new MemoryStorage()
  st.setItem('plockpoang', raw)
  expect(loadState(st, 1234)).toEqual({ version: 1, sessions: [] })
  expect(st.getItem('plockpoang.backup.1234')).toBe(raw)
})

test('save failure returns false', () => {
  const st = new MemoryStorage()
  st.setItem = () => {
    throw new DOMException('full', 'QuotaExceededError')
  }
  expect(saveState({ version: 1, sessions: [] }, st)).toBe(false)
})

test('blocked storage (getter throws) does not crash', () => {
  const desc = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() {
      throw new DOMException('blocked', 'SecurityError')
    },
  })
  try {
    expect(loadState()).toEqual({ version: 1, sessions: [] })
    expect(saveState({ version: 1, sessions: [] })).toBe(false)
  } finally {
    if (desc) Object.defineProperty(globalThis, 'localStorage', desc)
    else delete (globalThis as { localStorage?: Storage }).localStorage
  }
})
