import { newGame, maxHp } from './newGame'
import { content } from '../data'

test('new game applies background bonus and starts scenario 1', () => {
  const s = newGame({ name: 'Ari', backgroundId: 'courier', seed: 1, now: 1000 }, content);
  expect(s.player.stats.agility).toBe(7);
  expect(s.player.stats.strength).toBe(5);
  expect(s.energy).toBe(100);
  expect(s.phase).toMatchObject({ kind: 'scenario', scenarioId: content.scenarios[0].id });
  expect(s.rankingOpen).toBe(false);
  expect(s.player.hp).toBe(100);
});
test('new game gives the background starting item and sets the scenario hours', () => {
  const s = newGame({ name: 'Ari', backgroundId: 'courier', seed: 1, now: 1000 }, content);
  expect(s.player.inventory).toEqual([{ itemId: 'bike-chain', qty: 1 }]);
  expect(s.phase).toMatchObject({ hoursLeft: 12 });
});
test('the first log line is the first scenario announcement', () => {
  const s = newGame({ name: 'Ari', backgroundId: 'courier', seed: 1, now: 1000 }, content);
  expect(s.log[0]).toMatchObject({ kind: 'system', text: content.scenarios[0].announcement });
});
test('timestamps start at now', () => {
  const s = newGame({ name: 'Ari', backgroundId: 'courier', seed: 1, now: 1000 }, content);
  expect([s.createdAt, s.lastSeenAt, s.energyUpdatedAt, s.worldTickAt]).toEqual([1000, 1000, 1000, 1000]);
});
test('max hp grows with endurance', () => {
  expect(maxHp({ strength: 5, agility: 5, endurance: 7, spirit: 5 })).toBe(120);
});
test('starting gear starts equipped; a starting consumable does not', () => {
  const start = (backgroundId: string) => newGame({ name: 'Ari', backgroundId, seed: 1, now: 0 }, content).player.equipped;
  expect(start('courier')).toEqual({ weapon: 'bike-chain' });
  expect(start('night-guard')).toEqual({ armor: 'padded-jacket' });
  expect(start('night-nurse')).toEqual({});
});
