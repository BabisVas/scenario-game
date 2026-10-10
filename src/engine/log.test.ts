import { appendEvents } from './log'
import { baseState } from '../test/fixtures'

test('log keeps only the newest 300 entries', () => {
  let s = baseState();
  s = appendEvents(s, Array.from({ length: 305 }, (_, i) => ({ kind: 'system', text: `e${i}` })));
  expect(s.log).toHaveLength(300);
  expect(s.log.at(-1)!.text).toBe('e304');
});
test('entries are numbered from nextLogId and stamped with the in-game hour', () => {
  const s = { ...baseState(), nextLogId: 7, inGameHour: 30 };
  const r = appendEvents(s, [{ kind: 'fight', text: 'a' }, { kind: 'player', text: 'b' }]);
  expect(r.log.slice(-2)).toEqual([
    { id: 7, kind: 'fight', text: 'a', inGameHour: 30 },
    { id: 8, kind: 'player', text: 'b', inGameHour: 30 },
  ]);
  expect(r.nextLogId).toBe(9);
});
test('appending does not change the original state', () => {
  const s = baseState();
  appendEvents(s, [{ kind: 'system', text: 'x' }]);
  expect(s.log).toHaveLength(1);
});
