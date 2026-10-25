// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/preact'
import { afterEach, expect, test, vi } from 'vitest'
import { HOUR_MS } from '../domain/constants'
import { live, manual, t } from '../domain/test-helpers'
import type { LiveSession, Session, StoredState } from '../domain/types'
import { SummaryScreen } from './SummaryScreen'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

const H = HOUR_MS
const state = (liveSession: LiveSession): StoredState => ({
  version: 1,
  sessions: [manual({ id: 'prev', date: '2026-10-01', activeMs: 4 * H, points: 900 }), liveSession],
})
const done = live({
  id: 's',
  endedAt: t(10),
  entries: [{ kind: 'adjust', points: 960, at: t(9) }],
  pauses: [{ start: t(7), end: t(7, 15), reason: 'systemfel' }],
})

test('shows session numbers, pauses and month change', () => {
  render(<SummaryScreen state={state(done)} id="s" now={t(12)} celebrate update={vi.fn()} onClose={vi.fn()} />)
  // before: 900 p / 4 h = 225; session: 960 p / 3.75 h = 256; after: 1860 p / 7.75 h = 240
  expect(screen.getByText('Månaden: 225 → 240 p/h')).toBeTruthy()
  expect(screen.getByText(/Systemfel 07:00–07:15/)).toBeTruthy()
  expect(screen.getByText('Maxbonus-pass!')).toBeTruthy()
  expect(screen.getByText('Månaden är på maxbonus-takt!')).toBeTruthy()
})

test('rejects end before start', () => {
  const update = vi.fn()
  render(<SummaryScreen state={state(done)} id="s" now={t(12)} update={update} onClose={vi.fn()} />)
  fireEvent.input(screen.getByLabelText('Slut'), { target: { value: '2026-10-20T05:00' } })
  fireEvent.click(screen.getByRole('button', { name: 'Spara tider' }))
  expect(screen.getByText('Sluttiden måste vara efter starttiden')).toBeTruthy()
  expect(update).not.toHaveBeenCalled()
})

test('delete after confirm', () => {
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  const update = vi.fn()
  const onClose = vi.fn()
  const st = state(done)
  render(<SummaryScreen state={st} id="s" now={t(12)} update={update} onClose={onClose} />)
  fireEvent.click(screen.getByRole('button', { name: 'Ta bort pass' }))
  expect(update.mock.calls[0][0](st).sessions.map((s: Session) => s.id)).toEqual(['prev'])
  expect(onClose).toHaveBeenCalled()
})

test('no celebration when opened from history', () => {
  render(<SummaryScreen state={state(done)} id="s" now={t(12)} update={vi.fn()} onClose={vi.fn()} />)
  expect(screen.queryByText('Maxbonus-pass!')).toBeNull()
  expect(screen.getByText('Månaden: 225 → 240 p/h')).toBeTruthy()
})

test('rejects an end time in the future', () => {
  const update = vi.fn()
  render(<SummaryScreen state={state(done)} id="s" now={t(12)} update={update} onClose={vi.fn()} />)
  fireEvent.input(screen.getByLabelText('Slut'), { target: { value: '2026-10-20T13:00' } })
  fireEvent.click(screen.getByRole('button', { name: 'Spara tider' }))
  expect(screen.getByText('Sluttiden kan inte vara i framtiden')).toBeTruthy()
  expect(update).not.toHaveBeenCalled()
})
