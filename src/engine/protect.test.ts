import { doAction, travel } from './actions'
import { startScenario } from './scenario'
import { worldTick } from './survivors'
import { createRng } from './rng'
import type { GameState } from './types'
import { baseState, fixtureContent as content, makeSurvivor, protectDef, seqRng } from '../test/fixtures'

/** Guarding a ward who waits in the Glass Towers while the player stands in the Old Market. */
function guarding(wardZone = 'glass-towers'): GameState {
  const s = { ...baseState(), survivors: [makeSurvivor('ward', { met: true, zoneId: wardZone })] }
  return startScenario(s, protectDef({ hours: 40 }), createRng(1), content).state
}
const wounds = (s: GameState) => (s.phase.kind === 'scenario' ? s.phase.wardWounds : undefined)
const ward = (s: GameState) => s.survivors.find(v => v.id === 'ward')!

test('the ward starts with 3 wounds to spare', () => {
  expect(wounds(guarding())).toBe(3);
  expect(guarding().phase).toMatchObject({ protectedSurvivorId: 'ward' });
});
test('every action away from the ward risks a wound (20%), with a log line', () => {
  const hit = doAction(guarding(), 'old-market', 'rest', seqRng(0.19), content);
  expect(wounds(hit.state)).toBe(2);
  expect(hit.events.some(e => /ward|wound/i.test(e.text) && e.text.includes(ward(hit.state).name))).toBe(true);
  expect(wounds(doAction(guarding(), 'old-market', 'rest', seqRng(0.21), content).state)).toBe(3);
});
test('away from the ward, the danger falls on the ward instead of you', () => {
  expect(doAction(guarding(), 'old-market', 'rest', seqRng(0.0, 0.0, 0.5), content).state.fight).toBeNull();
});
test('at 0 wounds the ward dies and the scenario fails', () => {
  let s = guarding();
  s = { ...s, phase: { ...s.phase, wardWounds: 1 } as GameState['phase'] };
  const r = doAction(s, 'old-market', 'rest', seqRng(0.0), content).state;
  expect(ward(r).alive).toBe(false);
  expect(r.phase.kind).toBe('dead');
});
test('in the ward\'s zone there are no wounds, but ambushes hit you as normal fights', () => {
  const s = guarding('old-market');
  const r = doAction(s, 'old-market', 'rest', seqRng(0.0, 0.0, 0.5), content).state;
  expect(wounds(r)).toBe(3);
  expect(r.fight).not.toBeNull();
});
test('travelling to a zone without the ward risks a wound too', () => {
  const r = travel(guarding('old-market'), 'riverside-park', seqRng(0.1), content).state;
  expect(wounds(r)).toBe(2);
  expect(r.fight).toBeNull();
});
test('real-time world ticks never wound the ward', () => {
  let s = guarding();
  for (let i = 0; i < 500; i++) s = worldTick(s, createRng(i), content).state;
  expect(wounds(s)).toBe(3);
  expect(ward(s)).toMatchObject({ alive: true, zoneId: 'glass-towers' });
});
