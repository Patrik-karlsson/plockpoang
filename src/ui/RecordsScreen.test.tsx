// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/preact'
import { afterEach, expect, test, vi } from 'vitest'
import { HOUR_MS } from '../domain/constants'
import { manual, t } from '../domain/test-helpers'
import { RecordsScreen } from './RecordsScreen'

afterEach(cleanup)

test('shows records and history grouped by month', () => {
  const sessions = [
    manual({ id: 'sep', date: '2026-09-10', activeMs: 10 * HOUR_MS, points: 2450 }),
    manual({ id: 'oct', date: '2026-10-10', activeMs: 2 * HOUR_MS, points: 500 }),
  ]
  const onOpen = vi.fn()
  render(<RecordsScreen sessions={sessions} now={t(12, 0, 20, 10)} onOpen={onOpen} onBack={vi.fn()} />)
  expect(screen.getByText(/Bästa månad/).parentElement?.textContent).toContain('september 2026')
  expect(screen.getByText(/oktober 2026 · 250 p\/h/)).toBeTruthy()
  fireEvent.click(screen.getAllByText(/manuell/)[0])
  expect(onOpen).toHaveBeenCalledWith(sessions[1])
})
