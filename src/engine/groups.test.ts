import { resolveChoice, startScenario } from './scenario'
import { worldTick } from './survivors'
import { createRng } from './rng'
import type { GameState, Survivor } from './types'
import { baseState, fixtureContent as content, makeSurvivor, spareDef } from '../test/fixtures'

const people = (spec: [string, string, boolean][]): Survivor[] =>
  spec.map(([id, zoneId, met]) => makeSurvivor(id, { zoneId, met }))
const groupOf = (s: GameState) => (s.phase.kind === 'scenario' ? s.phase.groupIds ?? [] : [])
const alive = (s: GameState, id: string) => s.survivors.find(v => v.id === id)!.alive

/** The player stands in the Old Market with three people they know and five strangers; two more are elsewhere. */
function crowd(): GameState {
  return {
    ...baseState(),
    zoneId: 'old-market',
    survivors: people([
      ['m-0', 'old-market', true], ['m-1', 'old-market', true], ['m-2', 'old-market', true],
      ['u-0', 'old-market', false], ['u-1', 'old-market', false], ['u-2', 'old-market', false],
      ['u-3', 'old-market', false], ['u-4', 'old-market', false],
      ['far-0', 'glass-towers', true], ['far-1', 'glass-towers', false],
    ]),
  }
}

test('the group is 4 to 6 living survivors where the player stands, people they know first', () => {
  for (let seed = 0; seed < 30; seed++) {
    const r = startScenario(crowd(), spareDef(2), createRng(seed), content).state;
    const g = groupOf(r);
    expect(g.length).toBeGreaterThanOrEqual(4);
    expect(g.length).toBeLessThanOrEqual(6);
    expect(g).toEqual(expect.arrayContaining(['m-0', 'm-1', 'm-2']));
    expect(g.every(id => r.survivors.find(v => v.id === id)!.zoneId === 'old-market')).toBe(true);
    expect(g.every(id => r.survivors.find(v => v.id === id)!.met)).toBe(true);
  }
});
test('if the zone is nearly empty, others are drawn in to make up the group', () => {
  const s = { ...baseState(), zoneId: 'old-market', survivors: people([['a', 'old-market', true], ['b', 'glass-towers', false], ['c', 'riverside-park', false], ['d', 'subway-tunnels', true], ['e', 'glass-towers', false]]) };
  const r = startScenario(s, spareDef(2), createRng(1), content).state;
  expect(groupOf(r).length).toBeGreaterThanOrEqual(4);
  expect(groupOf(r)).toContain('a');
  expect(groupOf(r).every(id => r.survivors.find(v => v.id === id)!.zoneId === 'old-market')).toBe(true);
});
test('the player picks who is spared from the group; the rest of the group die; everyone else is untouched', () => {
  const started = startScenario(crowd(), spareDef(2), createRng(4), content).state;
  const g = groupOf(started);
  const [keep1, keep2] = g;
  const r = resolveChoice(started, 'choose', null, createRng(1), content, [keep1, keep2]).state;
  for (const id of g) expect(alive(r, id)).toBe(id === keep1 || id === keep2);
  for (const v of r.survivors.filter(v => !g.includes(v.id))) expect(v.alive).toBe(true);
  expect(alive(r, 'far-0')).toBe(true);
  expect(r.phase.kind).toBe('rest');
});
test('picks from outside the group, or beyond the limit, do not count', () => {
  const started = startScenario(crowd(), spareDef(1), createRng(4), content).state;
  const g = groupOf(started);
  const r = resolveChoice(started, 'choose', null, createRng(1), content, ['far-0', g[1], g[2]]).state;
  expect(g.filter(id => alive(r, id))).toEqual([g[1]]);
  expect(alive(r, 'far-0')).toBe(true);
});
test('the world never kills or moves a group member while the choice is open', () => {
  let s = startScenario(crowd(), spareDef(2), createRng(4), content).state;
  const g = groupOf(s);
  s = { ...s, zones: { ...s.zones, 'old-market': { sealed: false, dangerBonus: 95 } } };
  for (let i = 0; i < 2000; i++) s = worldTick(s, createRng(i), content).state;
  for (const id of g) expect(s.survivors.find(v => v.id === id)).toMatchObject({ alive: true, zoneId: 'old-market' });
});
