// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/preact'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { App } from './app'

beforeEach(() => localStorage.clear())
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

test('start a session, log stops, undo, and survive a reload', () => {
  const { unmount } = render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Starta plock' }))
  fireEvent.click(screen.getByRole('button', { name: /1 kolli/ }))
  fireEvent.click(screen.getByRole('button', { name: /2 kolli/ }))
  expect(screen.getByText('5 p · 2 stopp')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Ångra' }))
  expect(screen.getByText('2 p · 1 stopp')).toBeTruthy()
  unmount()
  render(<App />)
  expect(screen.getByText('2 p · 1 stopp')).toBeTruthy()
})

test('shows a banner when saving fails', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('full')
  })
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Starta plock' }))
  expect(screen.getByText('Kunde inte spara – data kan gå förlorad')).toBeTruthy()
})
