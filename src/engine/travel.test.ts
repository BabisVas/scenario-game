import { canAct, canTravel, doAction, travel } from './actions'
import { startScenario } from './scenario'
import { createRng } from './rng'
import type { GameState } from './types'
import { validateContent } from '../data/validate'
import {
  at, baseState, clearHiddenDefs, fixtureContent as content, hiddenDef, inRest, inScenario, killDef, reachDef, sealZone,
  seqRng, surviveDef, withItem,
} from '../test/fixtures'

/** Rest period: no scenario pressure, no ambushes. */
const calm = (): GameState => inRest(baseState(), 500)
const neighbors = (id: string) => content.zones.find(z => z.id === id)!.connections

test('you can only act where you stand', () => {
  expect(baseState().zoneId).toBe('old-market');
  expect(canAct(baseState(), 'glass-towers', 'scavenge', content)).toEqual({ ok: false, reason: 'away' });
  const r = doAction(baseState(), 'glass-towers', 'scavenge', createRng(1), content);
  expect(r.state).toEqual(baseState());
  expect(canAct(at(baseState(), 'glass-towers'), 'glass-towers', 'scavenge', content)).toEqual({ ok: true });
});
test('moving to an adjacent zone takes 1 hour and 5 energy', () => {
  const s = calm();
  const to = neighbors('old-market')[0];
  const r = travel(s, to, seqRng(0.99), content).state;
  expect(r.zoneId).toBe(to);
  expect(r.inGameHour).toBe(s.inGameHour + 1);
  expect(r.energy).toBe(s.energy - 5);
});
test('you cannot jump to a zone that is not adjacent', () => {
  const s = at(calm(), 'riverside-park');
  const far = content.zones.find(z => z.id !== 'riverside-park' && !neighbors('riverside-park').includes(z.id))!.id;
  expect(canTravel(s, far, content)).toEqual({ ok: false, reason: 'not-adjacent' });
  expect(travel(s, far, seqRng(0.99), content).state).toEqual(s);
});
test('sealed zones cannot be entered', () => {
  const to = neighbors('old-market')[0];
  expect(canTravel(sealZone(calm(), to), to, content)).toEqual({ ok: false, reason: 'sealed' });
});
test('travel needs energy and a free moment', () => {
  const to = neighbors('old-market')[0];
  expect(canTravel({ ...calm(), energy: 4 }, to, content)).toEqual({ ok: false, reason: 'energy' });
  expect(canTravel({ ...calm(), pendingChoice: { source: 'contract', constellationId: 'x' } }, to, content)).toEqual({ ok: false, reason: 'busy' });
});
test('a reach goal is met on arriving', () => {
  const s = inScenario(baseState(), reachDef({ hours: 10, zoneId: 'riverside-park' }));
  expect(travel(s, 'riverside-park', seqRng(0.99), content).state.phase.kind).toBe('rest');
});
test.each([
  ['survive', () => inScenario(baseState(), surviveDef({ hours: 30 }))],
  ['reach', () => inScenario(baseState(), reachDef({ hours: 30, zoneId: 'subway-tunnels' }))],
])('entering a zone in a %s scenario can be ambushed there', (_, make) => {
  const r = travel(make(), 'glass-towers', seqRng(0.0, 0.0, 0.5), content).state;
  expect(r.fight).not.toBeNull();
  expect(content.zones.find(z => z.id === 'glass-towers')!.enemyIds).toContain(r.fight!.enemyId);
});
test('no ambushes on the road in the rest period or in a kill scenario', () => {
  expect(travel(calm(), 'glass-towers', seqRng(0.0), content).state.fight).toBeNull();
  expect(travel(inScenario(baseState(), killDef({ hours: 30, count: 9 })), 'glass-towers', seqRng(0.0), content).state.fight).toBeNull();
});
test('arriving carrying an item can uncover a hidden scenario', () => {
  clearHiddenDefs();
  hiddenDef('lamp-bearer', { kind: 'carry-item', itemId: 'flare', zoneId: 'glass-towers' });
  const r = travel(withItem(calm(), 'flare'), 'glass-towers', seqRng(0.99), content);
  expect(r.state.hiddenScenario?.defId).toBe('lamp-bearer');
});
test('when the zone you stand in seals, you are moved to an open neighbor', () => {
  const def = { ...surviveDef({ hours: 10 }), zoneChanges: { seal: ['old-market'] } };
  const r = startScenario(baseState(), def, createRng(1), content);
  expect(r.state.zoneId).not.toBe('old-market');
  expect(neighbors('old-market')).toContain(r.state.zoneId);
  expect(r.events.some(e => /old market.*seal|seal.*old market/i.test(e.text))).toBe(true);
});

describe('zone connections are validated', () => {
  const zones = content.zones;
  test('connections must name real zones', () => {
    const bad = { ...content, zones: zones.map((z, i) => (i === 0 ? { ...z, connections: [...z.connections, 'ghost-zone'] } : z)) };
    expect(validateContent(bad)).toContainEqual(expect.stringContaining('ghost-zone'));
  });
  test('connections must go both ways', () => {
    const [a, b] = [zones[0], zones.find(z => !zones[0].connections.includes(z.id) && z.id !== zones[0].id)];
    if (!b) return;
    const bad = { ...content, zones: zones.map(z => (z.id === a.id ? { ...z, connections: [...z.connections, b.id] } : z)) };
    expect(validateContent(bad)).toContainEqual(expect.stringMatching(/both ways|one-way/i));
  });
  test('every zone must be reachable', () => {
    const cut = zones[zones.length - 1].id;
    const bad = { ...content, zones: zones.map(z => (z.id === cut ? { ...z, connections: [] } : { ...z, connections: z.connections.filter(c => c !== cut) })) };
    expect(validateContent(bad)).toContainEqual(expect.stringContaining(cut));
  });
});
