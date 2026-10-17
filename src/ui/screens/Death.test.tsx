import { fireEvent, screen } from '@testing-library/react'
import { loadGame } from '../../save/save'
import { deadState } from '../../test/fixtures'
import { renderWithGame } from '../../test/render'

test('death screen shows cause and offers a new life only', () => {
  renderWithGame(deadState('Torn apart in the subway'));
  expect(screen.getByText(/torn apart in the subway/i)).toBeInTheDocument();
  expect(screen.getAllByRole('button')).toHaveLength(1);
});

test('death screen shows how far you got and the constellations\' last words', () => {
  renderWithGame(deadState('Torn apart in the subway'));
  expect(screen.getByText(/you died/i)).toBeInTheDocument();
  expect(screen.getByText(/days survived/i).closest('div')).toHaveTextContent('2');
  expect(screen.getByText(/kills/i).closest('div')).toHaveTextContent('7');
  expect(screen.getByText(/burn bright, small one/i)).toBeInTheDocument();
});
test('the save is gone and a new life starts from the new-game screen', () => {
  const { storage } = renderWithGame(deadState('x'));
  expect(loadGame(storage)).toEqual({ ok: false, reason: 'none' });
  fireEvent.click(screen.getByRole('button', { name: /start a new life/i }));
  expect(screen.getByRole('button', { name: /start/i })).toBeDisabled();
});
test('the death screen closes the survivor record and states the cause in brackets', () => {
  renderWithGame(deadState('Feral Hound, round 3.'));
  expect(screen.getByText('[Survivor record closed: Ari.]')).toBeInTheDocument();
  expect(screen.getByText('[Cause: Feral Hound, round 3.]')).toBeInTheDocument();
  expect(screen.getByText(/the city does not pause/i)).toBeInTheDocument();
});
