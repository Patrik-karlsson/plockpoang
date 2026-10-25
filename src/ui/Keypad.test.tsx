// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/preact'
import { afterEach, expect, test, vi } from 'vitest'
import { Keypad } from './Keypad'

afterEach(cleanup)

const press = (...keys: string[]) => keys.forEach((k) => fireEvent.click(screen.getByRole('button', { name: k })))
const confirmButton = (name: string) => screen.getByRole('button', { name }) as HTMLButtonElement

test('stop mode adds N kolli', () => {
  const onStop = vi.fn()
  render(<Keypad currentTotal={10} onStop={onStop} onSetTotal={vi.fn()} onClose={vi.fn()} />)
  expect(confirmButton('Lägg till').disabled).toBe(true)
  press('0')
  expect(confirmButton('Lägg till').disabled).toBe(true)
  press('5', 'Lägg till')
  expect(onStop).toHaveBeenCalledWith(5)
})

test('input is capped at 4 digits', () => {
  const onStop = vi.fn()
  render(<Keypad currentTotal={0} onStop={onStop} onSetTotal={vi.fn()} onClose={vi.fn()} />)
  press('1', '2', '3', '4', '5', 'Lägg till')
  expect(onStop).toHaveBeenCalledWith(1234)
})

test('total mode sets total', () => {
  const onSetTotal = vi.fn()
  render(<Keypad currentTotal={412} onStop={vi.fn()} onSetTotal={onSetTotal} onClose={vi.fn()} />)
  press('Ange total')
  expect(screen.getByText('Nu: 412 p')).toBeTruthy()
  press('4', '3', '0', 'Spara')
  expect(onSetTotal).toHaveBeenCalledWith(430)
})
