import {
  attackSurvivor, generateSurvivors, meetSurvivor, remember, resolveScenarioForSurvivors, survivorsInZone,
  tradeWithSurvivor, tradePrice, worldTick,
} from './survivors'
import { doAction } from './actions'
import { fightTurn } from './combat'
import { createRng } from './rng'
import type { GameState, Survivor } from './types'
import { content } from '../data'
import {
  baseStateWithSurvivors, choiceDef, deadlyZoneWith, inScenario, makeSurvivor, metOnly, protecting, seqRng, twoInZone, withCoins,
  withItem,
} from '../test/fixtures'

const byId = (s: GameState, id: string) => s.survivors.find(x => x.id === id)!;

test('generates 40 survivors with unique names', () => {
  const sv = generateSurvivors(content, createRng(1));
  expect(sv).toHaveLength(40);
  expect(new Set(sv.map(s => s.name)).size).toBe(40);
});
test('world tick never touches the player', () => {
  const s = baseStateWithSurvivors();
  let r = s;
  for (let i = 0; i < 200; i++) r = worldTick(r, createRng(i), content).state;
  expect(r.player).toEqual(s.player);
});
test('world tick never kills the protected survivor', () => {
  const s = protecting(baseStateWithSurvivors(), 's-0');
  let r = s;
  for (let i = 0; i < 2000; i++) r = worldTick(r, createRng(i), content).state;
  expect(r.survivors.find(x => x.id === 's-0')!.alive).toBe(true);
});
test('world tick keeps one met survivor alive during a choice scenario', () => {
  const s = inScenario(metOnly(baseStateWithSurvivors(), ['s-1']), choiceDef());
  let r = s;
  for (let i = 0; i < 2000; i++) r = worldTick(r, createRng(i), content).state;
  expect(r.survivors.find(x => x.id === 's-1')!.alive).toBe(true);
});

test('survivors start as strangers with stats from 3 to 9, spread over open zones', () => {
  const sv = generateSurvivors(content, createRng(2));
  expect(sv.map(s => s.id)).toEqual(Array.from({ length: 40 }, (_, i) => `s-${i}`));
  expect(sv.every(s => !s.met && s.alive && s.attitude === 0 && s.partyId === null)).toBe(true);
  for (const s of sv) for (const v of Object.values(s.stats)) { expect(v).toBeGreaterThanOrEqual(3); expect(v).toBeLessThanOrEqual(9); }
  const open = content.zones.filter(z => !z.startsSealed).map(z => z.id);
  expect(sv.every(s => open.includes(s.zoneId))).toBe(true);
});
test('a new game starts with 40 survivors', () => {
  expect(baseStateWithSurvivors().survivors).toHaveLength(40);
});
test('in a deadly zone, an unguarded survivor does die from world ticks', () => {
  let r = deadlyZoneWith(baseStateWithSurvivors(), ['s-0']);
  for (let i = 0; i < 300; i++) r = worldTick(r, createRng(i), content).state;
  expect(byId(r, 's-0').alive).toBe(false);
});
test('in a deadly zone, the protected survivor neither dies nor moves', () => {
  let r = protecting(deadlyZoneWith(baseStateWithSurvivors(), ['s-0']), 's-0');
  for (let i = 0; i < 2000; i++) r = worldTick(r, createRng(i), content).state;
  expect(byId(r, 's-0')).toMatchObject({ alive: true, zoneId: 'subway-tunnels' });
});
test('in a deadly zone, the last met survivor lives through a pending choice', () => {
  let r = inScenario(metOnly(deadlyZoneWith(baseStateWithSurvivors(), ['s-1', 's-2']), ['s-1']), choiceDef());
  for (let i = 0; i < 2000; i++) r = worldTick(r, createRng(i), content).state;
  expect(byId(r, 's-1').alive).toBe(true);
});
test('world ticks make news', () => {
  let events = 0;
  let r = baseStateWithSurvivors();
  for (let i = 0; i < 20; i++) { const t = worldTick(r, createRng(i), content); r = t.state; events += t.events.length; }
  expect(events).toBeGreaterThan(0);
});
test('meeting someone marks them met', () => {
  const s = twoInZone(baseStateWithSurvivors(), 'glass-towers', ['s-3']);
  const only = { ...s, survivors: s.survivors.map(v => ({ ...v, zoneId: v.id === 's-3' ? 'glass-towers' : 'old-market' })) };
  const r = meetSurvivor(only, 'glass-towers', createRng(1));
  expect(byId(r.state, 's-3').met).toBe(true);
  expect(r.events[0].kind).toBe('survivor');
});
test('a hostile survivor may attack on sight', () => {
  const s = baseStateWithSurvivors();
  const only = { ...s, survivors: s.survivors.map(v => ({ ...v, zoneId: v.id === 's-3' ? 'glass-towers' : 'old-market', attitude: v.id === 's-3' ? -80 : 0 })) };
  const r = meetSurvivor(only, 'glass-towers', seqRng(0.1));
  expect(r.state.fight).toMatchObject({ origin: 'survivor', survivorId: 's-3' });
});
test('talking in a zone meets someone there', () => {
  const s = baseStateWithSurvivors();
  const zone = s.survivors[0].zoneId;
  const r = doAction(s, zone === 'subway-tunnels' ? 'old-market' : zone, 'talk', createRng(1), content);
  expect(r.state.survivors.some(v => v.met) || r.events.some(e => /nobody/i.test(e.text))).toBe(true);
});
test('friends sell cheaper; buying spends coins and makes them remember the trade', () => {
  expect(tradePrice(100, 0)).toBe(100);
  expect(tradePrice(100, 100)).toBe(50);
  expect(tradePrice(100, -100)).toBe(150);
  const s = withCoins(metOnly(baseStateWithSurvivors(), ['s-1']), 100);
  const r = tradeWithSurvivor(s, 's-1', 'crowbar', 'buy', content, createRng(1)).state;
  expect(r.player.coins).toBe(40);
  expect(r.player.inventory.some(i => i.itemId === 'crowbar')).toBe(true);
  expect(byId(r, 's-1').memories[0]).toBe('traded');
});
test('selling to a survivor never pays more than buying it back', () => {
  const s = withItem(withCoins(metOnly(baseStateWithSurvivors(), ['s-1']), 0), 'crowbar');
  const friendly = { ...s, survivors: s.survivors.map(v => v.id === 's-1' ? { ...v, attitude: 100 } : v) };
  const sold = tradeWithSurvivor(friendly, 's-1', 'crowbar', 'sell', content, createRng(1)).state;
  expect(sold.player.coins).toBeLessThanOrEqual(tradePrice(60, 100));
});
test('strangers and the dead do not trade', () => {
  const s = withCoins(baseStateWithSurvivors(), 100);
  expect(tradeWithSurvivor(s, 's-1', 'crowbar', 'buy', content, createRng(1)).state).toEqual(s);
});
test('memories keep the newest 5 and attitude stays within -100..100', () => {
  let s = baseStateWithSurvivors();
  for (let i = 0; i < 7; i++) s = remember(s, 's-1', 'robbed', -40);
  expect(byId(s, 's-1').memories).toHaveLength(5);
  expect(byId(s, 's-1').attitude).toBe(-100);
});
test('attacking a survivor makes witnesses remember', () => {
  const s = twoInZone(baseStateWithSurvivors(), 'old-market', ['s-1', 's-2']);
  const r = attackSurvivor(s, 's-1').state;
  expect(r.survivors.find(x => x.id === 's-2')!.memories).toContain('attacked');
});
test('attacking starts a fight and is cruel', () => {
  const s = twoInZone(baseStateWithSurvivors(), 'old-market', ['s-1', 's-2']);
  const r = attackSurvivor(s, 's-1');
  expect(r.state.fight).toMatchObject({ origin: 'survivor', survivorId: 's-1' });
  expect(r.events.some(e => e.tags?.includes('cruelty'))).toBe(true);
  expect(byId(r.state, 's-2').attitude).toBe(-20);
});
test('beating a survivor in a fight kills them', () => {
  const s = attackSurvivor(baseStateWithSurvivors(), 's-1').state;
  const weak = { ...s, fight: { ...s.fight!, enemy: { ...s.fight!.enemy, hp: 1 } } };
  expect(byId(fightTurn(weak, { kind: 'attack' }, createRng(1), content).state, 's-1').alive).toBe(false);
});
test('a scenario clear thins out the city but spares the protected survivor', () => {
  const s = protecting(baseStateWithSurvivors(), 's-0');
  const def = { ...content.scenarios[0], survivorDeathRate: 1 };
  const r = resolveScenarioForSurvivors(s, def, createRng(1));
  expect(byId(r.state, 's-0').alive).toBe(true);
  const alive = r.state.survivors.filter(v => v.alive).length;
  expect(alive).toBeLessThan(40);
  expect(r.events.some(e => e.text.includes(`${alive} survivors remain`))).toBe(true);
  expect(r.state.survivors.filter(v => v.alive).every(v => v.points >= 3 && v.points <= 12)).toBe(true);
});
test('survivorsInZone lists only the living in that zone', () => {
  const s = twoInZone(baseStateWithSurvivors(), 'glass-towers', ['s-1', 's-2']);
  const dead = { ...s, survivors: s.survivors.map(v => v.id === 's-2' ? { ...v, alive: false } : v) };
  const ids = survivorsInZone(dead, 'glass-towers').map(v => v.id);
  expect(ids).toContain('s-1');
  expect(ids).not.toContain('s-2');
});

describe('robbing has consequences', () => {
  const scene = (personality: Survivor['personality']): GameState => ({
    ...baseStateWithSurvivors(),
    survivors: [
      makeSurvivor('victim', { met: true, personality, zoneId: 'old-market' }),
      makeSurvivor('witness', { zoneId: 'old-market', attitude: 20 }),
      makeSurvivor('far', { zoneId: 'glass-towers', attitude: 20 }),
    ],
  });
  const who = (s: GameState, id: string) => s.survivors.find(v => v.id === id)!;

  test.each(['kind', 'cautious', 'schemer'] as const)('a %s survivor fights back 30% of the time', (p) => {
    expect(tradeWithSurvivor(scene(p), 'victim', 'crowbar', 'rob', content, seqRng(0.29)).state.fight).toMatchObject({ origin: 'survivor', survivorId: 'victim' });
    expect(tradeWithSurvivor(scene(p), 'victim', 'crowbar', 'rob', content, seqRng(0.31)).state.fight).toBeNull();
  });
  test.each(['brave', 'ruthless'] as const)('a %s survivor fights back 50% of the time', (p) => {
    expect(tradeWithSurvivor(scene(p), 'victim', 'crowbar', 'rob', content, seqRng(0.49)).state.fight).toMatchObject({ survivorId: 'victim' });
    expect(tradeWithSurvivor(scene(p), 'victim', 'crowbar', 'rob', content, seqRng(0.51)).state.fight).toBeNull();
  });
  test('an unnoticed robbery takes the item', () => {
    const r = tradeWithSurvivor(scene('kind'), 'victim', 'crowbar', 'rob', content, seqRng(0.9)).state;
    expect(r.player.inventory.some(i => i.itemId === 'crowbar')).toBe(true);
  });
  test('a caught robbery fails: no item, the fight starts, and winning it takes the item', () => {
    const caught = tradeWithSurvivor(scene('kind'), 'victim', 'crowbar', 'rob', content, seqRng(0.1)).state;
    expect(caught.player.inventory.some(i => i.itemId === 'crowbar')).toBe(false);
    expect(caught.fight).toMatchObject({ survivorId: 'victim', loot: 'crowbar' });
    const winning = { ...caught, fight: { ...caught.fight!, enemy: { ...caught.fight!.enemy, hp: 1 } } };
    const won = fightTurn(winning, { kind: 'attack' }, createRng(1), content).state;
    expect(won.player.inventory.some(i => i.itemId === 'crowbar')).toBe(true);
  });
  test('everyone else in the zone thinks less of you; the rest of the city does not know', () => {
    const r = tradeWithSurvivor(scene('kind'), 'victim', 'crowbar', 'rob', content, seqRng(0.9)).state;
    expect(who(r, 'victim').attitude).toBe(-40);
    expect(who(r, 'witness').attitude).toBe(10);
    expect(who(r, 'far').attitude).toBe(20);
  });
  test('a fight back is announced', () => {
    const r = tradeWithSurvivor(scene('brave'), 'victim', 'crowbar', 'rob', content, seqRng(0.1));
    expect(r.events.some(e => /fights back/i.test(e.text))).toBe(true);
  });
});
