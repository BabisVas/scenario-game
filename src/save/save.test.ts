import { deleteSave, loadGame, saveGame } from './save'
import { SAVE_KEY } from '../engine/config'
import { baseState, memoryStorage } from '../test/fixtures'

test('save then load round-trips', () => {
  const st = memoryStorage(); const s = baseState();
  saveGame(s, st);
  expect(loadGame(st)).toEqual({ ok: true, state: s });
});
test('no save reports none', () => {
  expect(loadGame(memoryStorage())).toEqual({ ok: false, reason: 'none' });
});
test('garbage save reports corrupt', () => {
  const st = memoryStorage(); st.setItem(SAVE_KEY, '{not json');
  expect(loadGame(st)).toEqual({ ok: false, reason: 'corrupt' });
});
test('wrong schema version reports version', () => {
  const st = memoryStorage(); st.setItem(SAVE_KEY, JSON.stringify({ ...baseState(), schemaVersion: 99 }));
  expect(loadGame(st)).toEqual({ ok: false, reason: 'version' });
});
test.each(['player', 'phase', 'log'])('a save missing %s reports corrupt', (field) => {
  const st = memoryStorage();
  const half = { ...baseState() } as Record<string, unknown>;
  delete half[field];
  st.setItem(SAVE_KEY, JSON.stringify(half));
  expect(loadGame(st)).toEqual({ ok: false, reason: 'corrupt' });
});
test.each(['null', '42', '"text"', '[]'])('a save holding %s reports corrupt', (raw) => {
  const st = memoryStorage(); st.setItem(SAVE_KEY, raw);
  expect(loadGame(st)).toEqual({ ok: false, reason: 'corrupt' });
});
test('delete removes the save', () => {
  const st = memoryStorage();
  saveGame(baseState(), st);
  deleteSave(st);
  expect(loadGame(st)).toEqual({ ok: false, reason: 'none' });
});
test('a save from before attributes (schema 1) is treated as unreadable', () => {
  const st = memoryStorage(); st.setItem(SAVE_KEY, JSON.stringify({ ...baseState(), schemaVersion: 1 }));
  expect(loadGame(st)).toEqual({ ok: false, reason: 'version' });
});
