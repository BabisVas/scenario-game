import { fireEvent, screen, within } from '@testing-library/react'
import { SAVE_KEY } from '../../engine/config'
import { loadGame } from '../../save/save'
import { choiceDef, clearHiddenDefs, hiddenDef, inScenario, makeSurvivor, memoryStorage, playingState, sealZone, spareDef } from '../../test/fixtures'
import { renderWithGame } from '../../test/render'
import { content } from '../../data'

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
test('a "some survive" choice lets you tick who is spared, up to the limit', () => {
  const people = ['Mara', 'Kofi', 'Ines'].map((name, i) => makeSurvivor(`s-${i}`, { met: true, name }));
  const { storage } = renderWithGame(inScenario({ ...playingState(), survivors: people }, spareDef(2)));
  const dialog = screen.getByRole('dialog', { name: /choice/i });
  expect(within(dialog).getByText(/everyone you know who is not chosen dies/i)).toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Mara' }));
  fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Ines' }));
  expect(within(dialog).getByRole('checkbox', { name: 'Kofi' })).toBeDisabled();
  fireEvent.click(within(dialog).getByRole('button', { name: /choose who crosses/i }));
  const saved = loadGame(storage);
  expect(saved.ok && saved.state.survivors.map(v => v.alive)).toEqual([true, false, true]);
});
test('knowing fewer people than the limit spares them all', () => {
  renderWithGame(inScenario({ ...playingState(), survivors: [makeSurvivor('s-0', { met: true, name: 'Mara' })] }, spareDef(2)));
  const dialog = screen.getByRole('dialog', { name: /choice/i });
  expect(within(dialog).queryByRole('checkbox')).toBeNull();
  expect(within(dialog).getByText(/all of them will be spared/i)).toBeInTheDocument();
});
test('the status window shows your attribute and its rarity', () => {
  const def = content.attributes[0];
  const s = { ...playingState(), player: { ...playingState().player, attributeId: def.id } };
  renderWithGame(s);
  const status = screen.getByRole('region', { name: /status/i });
  expect(within(status).getByText(def.name)).toBeInTheDocument();
  expect(within(status).getByText(new RegExp(def.rarity, 'i'))).toBeInTheDocument();
});
test("a survivor's attribute shows only once you have met them", () => {
  const [a, b] = content.attributes;
  renderWithGame({ ...playingState(), survivors: [
    makeSurvivor('s-0', { met: true, name: 'Mara', attributeId: a.id }),
    makeSurvivor('s-1', { attributeId: b.id }),
  ] });
  const zone = screen.getByRole('region', { name: /zone/i });
  expect(within(zone).getByText(new RegExp(a.name))).toBeInTheDocument();
  expect(within(zone).queryByText(new RegExp(b.name))).toBeNull();
});
test('undiscovered hidden scenarios appear nowhere; a discovered one shows in the scenario panel', () => {
  clearHiddenDefs();
  const def = hiddenDef('secret-stage', { kind: 'repeat-action', zoneId: 'old-market', action: 'rest', count: 9 }, { title: 'The Secret Stage' });
  const { unmount } = renderWithGame(playingState());
  expect(screen.queryByText(/secret stage/i)).toBeNull();
  expect(screen.queryByText(/hidden/i)).toBeNull();
  unmount();
  renderWithGame({ ...playingState(), hiddenScenario: { defId: def.id, hoursLeft: 5, progress: 0 }, foundHiddenIds: [def.id] });
  const panel = screen.getByRole('region', { name: /scenario/i });
  expect(within(panel).getByText(/the secret stage/i)).toBeInTheDocument();
});
