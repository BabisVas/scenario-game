import { render, screen } from '@testing-library/react'
import { DangerPips } from './MapPanel'

test('danger above 5 shows five pips and how far past them it goes', () => {
  render(<DangerPips danger={7} />)
  const pips = screen.getByLabelText('danger 7')
  expect(pips.textContent).toBe('●●●●●+2')
})
test('danger 3 shows three of five pips', () => {
  render(<DangerPips danger={3} />)
  expect(screen.getByLabelText('danger 3').textContent).toBe('●●●○○')
})
