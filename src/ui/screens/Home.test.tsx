import { fireEvent, screen, within } from '@testing-library/react'
import { SAVE_KEY } from '../../engine/config'
import { loadGame } from '../../save/save'
import { choiceDef, inScenario, makeSurvivor, memoryStorage, playingState, sealZone } from '../../test/fixtures'
import { renderWithGame } from '../../test/render'

test('home shows scenario hours and disables an action without energy', () => {
  renderWithGame({ ...playingState(), energy: 0 });
  expect(screen.getByText(/hours left/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /scavenge/i })).toBeDisabled();
});
test('no ranking tab before the first clear', () => {
  renderWithGame(playingState());
  expect(screen.queryByText(/ranking/i)).toBeNull();
});
test('the digest shows on return', () => {
  renderWithGame({ ...playingState(), digest: [{ id: 1, kind: 'digest', text: 'A party formed', inGameHour: 0 }] });
  expect(screen.getByText(/while you were gone/i)).toBeInTheDocument();
});

test('continue closes the digest', () => {
  renderWithGame({ ...playingState(), digest: [{ id: 1, kind: 'digest', text: 'A party formed', inGameHour: 0 }] });
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));
  expect(screen.queryByText(/while you were gone/i)).toBeNull();
});
test('clicking an action runs it and shows the result', () => {
  const { storage } = renderWithGame(playingState());
  fireEvent.click(screen.getByRole('button', { name: /rest/i }));
  expect(loadGame(storage)).toMatchObject({ ok: true, state: { inGameHour: 4 } });
  expect(screen.getByText(/8 hours left/i)).toBeInTheDocument();
});
test('a sealed zone is marked and its actions are disabled', () => {
  renderWithGame(sealZone(playingState(), 'old-market'));
  const map = screen.getByRole('region', { name: /map/i });
  fireEvent.click(within(map).getByRole('button', { name: /old market/i }));
  expect(within(map).getByRole('button', { name: /old market/i })).toHaveTextContent(/sealed/i);
  expect(screen.getByRole('button', { name: /scavenge/i })).toBeDisabled();
});
test('a new player names themselves and picks a background', () => {
  const { storage } = renderWithGame(null);
  const start = screen.getByRole('button', { name: /start/i });
  expect(start).toBeDisabled();
  fireEvent.change(screen.getByLabelText(/name/i), { target: { value: '   ' } });
  fireEvent.click(screen.getByRole('button', { name: /courier/i }));
  expect(start).toBeDisabled();
  fireEvent.change(screen.getByLabelText(/name/i), { target: { value: '  Ari  ' } });
  expect(start).toBeEnabled();
  fireEvent.click(start);
  expect(loadGame(storage)).toMatchObject({ ok: true, state: { player: { name: 'Ari', backgroundId: 'courier' } } });
  expect(screen.getByText(/hours left/i)).toBeInTheDocument();
});
test('an unreadable save offers a new game', () => {
  const st = memoryStorage(); st.setItem(SAVE_KEY, '{bad');
  renderWithGame(null, st);
  expect(screen.getByText(/this save can't be read/i)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /new game/i }));
  expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();
});
test('a choice hides options that need a survivor when none are met, but keeps the fallback', () => {
  renderWithGame(inScenario({ ...playingState(), survivors: [makeSurvivor('s-0')] }, choiceDef()));
  const dialog = screen.getByRole('dialog', { name: /choice/i });
  expect(within(dialog).queryByRole('button', { name: /push someone/i })).toBeNull();
  expect(within(dialog).getByRole('button', { name: /walk away/i })).toBeInTheDocument();
});
test('a choice with met survivors lets you pick who', () => {
  renderWithGame(inScenario({ ...playingState(), survivors: [makeSurvivor('s-0', { met: true, name: 'Mara' })] }, choiceDef()));
  const dialog = screen.getByRole('dialog', { name: /choice/i });
  expect(within(dialog).getByRole('combobox')).toHaveTextContent('Mara');
});
test('met survivors are named in their zone, strangers are someone', () => {
  const s = playingState();
  renderWithGame({ ...s, survivors: [makeSurvivor('s-0', { met: true, name: 'Mara' }), makeSurvivor('s-1')] });
  const zone = screen.getByRole('region', { name: /zone/i });
  expect(within(zone).getByText(/mara/i)).toBeInTheDocument();
  expect(within(zone).getByText(/someone/i)).toBeInTheDocument();
});
