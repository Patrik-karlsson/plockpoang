// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/preact'
import { afterEach, expect, test } from 'vitest'
import { App } from '../app'

afterEach(() => {
  cleanup()
  localStorage.clear()
})

const kolliButton = () => screen.getByRole('button', { name: /1 kolli/ }) as HTMLButtonElement

test('Annat adds a 4-kolli stop and pause disables stop buttons', () => {
  localStorage.setItem(
    'plockpoang',
    JSON.stringify({
      version: 1,
      sessions: [{ source: 'live', id: 's', type: 'plock', startedAt: Date.now() - 60_000, entries: [], pauses: [] }],
    }),
  )
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Annat' }))
  fireEvent.click(screen.getByRole('button', { name: '4' }))
  fireEvent.click(screen.getByRole('button', { name: 'Lägg till' }))
  expect(screen.getByText('5 p · 1 stopp')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Paus' }))
  fireEvent.click(screen.getByRole('button', { name: 'Möte' }))
  expect(kolliButton().disabled).toBe(true)
  expect(screen.getByText(/Pausad – Möte sedan/)).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Fortsätt' }))
  expect(kolliButton().disabled).toBe(false)
})
