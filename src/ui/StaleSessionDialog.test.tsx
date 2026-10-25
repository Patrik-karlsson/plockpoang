// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/preact'
import { afterEach, expect, test, vi } from 'vitest'
import { live, t } from '../domain/test-helpers'
import { StaleSessionDialog } from './StaleSessionDialog'

afterEach(cleanup)

test('defaults to the last entry and ends there', () => {
  const s = live({ startedAt: t(6), entries: [{ kind: 'stop', kolli: 1, at: t(14, 10) }] })
  const onEnd = vi.fn()
  render(<StaleSessionDialog session={s} now={t(8, 0, 21)} onEnd={onEnd} onContinue={vi.fn()} />)
  expect(screen.getByText('Glömde du avsluta passet?')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Avsluta vid denna tid' }))
  expect(onEnd).toHaveBeenCalledWith(t(14, 10))
})
