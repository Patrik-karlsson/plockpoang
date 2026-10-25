// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/preact'
import { afterEach, expect, test } from 'vitest'
import { PaceMeter } from './PaceMeter'

afterEach(cleanup)

test.each([
  [undefined, 'unknown', '—'],
  [180, 'below', '180'],
  [220, 'bonus', '220'],
  [251, 'max', '251'],
])('month pace %s → level %s', (p, level, text) => {
  const { container } = render(<PaceMeter monthPace={p} sessionPace={undefined} />)
  expect(container.querySelector(`[data-level="${level}"]`)).toBeTruthy()
  expect(container.textContent).toContain(text)
})

test('labels for bonus zone and max', () => {
  expect(render(<PaceMeter monthPace={220} sessionPace={200} />).container.textContent).toContain('Bonuszon')
  cleanup()
  expect(render(<PaceMeter monthPace={240} sessionPace={250} />).container.textContent).toContain('Maxbonus')
})
