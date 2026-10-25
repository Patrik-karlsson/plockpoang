// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/preact'
import { afterEach, expect, test, vi } from 'vitest'
import { HOUR_MS } from '../domain/constants'
import { ManualSessionForm } from './ManualSessionForm'

afterEach(cleanup)

test('validates then saves a manual session', () => {
  const onSave = vi.fn()
  render(<ManualSessionForm today="2026-10-25" onSave={onSave} onCancel={vi.fn()} />)
  fireEvent.input(screen.getByLabelText('Datum'), { target: { value: '2026-10-20' } })
  fireEvent.input(screen.getByLabelText('Poäng'), { target: { value: '900' } })
  fireEvent.click(screen.getByRole('button', { name: 'Spara' }))
  expect(screen.getByText('Plocktiden måste vara mer än 0')).toBeTruthy()
  fireEvent.input(screen.getByLabelText('Timmar'), { target: { value: '3' } })
  fireEvent.input(screen.getByLabelText('Minuter'), { target: { value: '45' } })
  fireEvent.click(screen.getByRole('button', { name: 'Spara' }))
  expect(onSave.mock.calls[0][0]).toMatchObject({
    source: 'manual',
    date: '2026-10-20',
    activeMs: 3.75 * HOUR_MS,
    points: 900,
  })
})
