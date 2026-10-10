import { canAct, combatantFromEnemy, doAction } from './actions'
import { createRng } from './rng'
import { content } from '../data'
import { baseState, inFight, sealZone, seqRng, weakEnemy, withCoins } from '../test/fixtures'

test('scavenge spends 10 energy and 2 hours', () => {
  const s = baseState();
  const r = doAction(s, 'old-market', 'scavenge', createRng(1), content).state;
  expect(r.energy).toBe(s.energy - 10);
  expect(r.inGameHour).toBe(s.inGameHour + 2);
});
test('no energy blocks the action', () => {
  expect(canAct({ ...baseState(), energy: 4 }, 'old-market', 'scavenge', content)).toEqual({ ok: false, reason: 'energy' });
});
test('sealed zone blocks the action', () => {
  const s = sealZone(baseState(), 'old-market');
  expect(canAct(s, 'old-market', 'rest', content)).toEqual({ ok: false, reason: 'sealed' });
});
test('cannot act during a fight', () => {
  expect(canAct(inFight(baseState(), weakEnemy()), 'old-market', 'rest', content)).toEqual({ ok: false, reason: 'busy' });
});

test('exactly enough energy is enough', () => {
  expect(canAct({ ...baseState(), energy: 10 }, 'old-market', 'scavenge', content)).toEqual({ ok: true });
});
test('an action the zone does not offer is not-here', () => {
  expect(canAct(baseState(), 'subway-tunnels', 'rest', content)).toEqual({ ok: false, reason: 'not-here' });
  expect(canAct(baseState(), 'no-such-zone', 'rest', content)).toEqual({ ok: false, reason: 'not-here' });
});
test('the dead cannot act', () => {
  expect(canAct({ ...baseState(), phase: { kind: 'dead', cause: 'x' } }, 'old-market', 'rest', content)).toEqual({ ok: false, reason: 'dead' });
});
test('a refused action changes nothing', () => {
  const s = { ...baseState(), energy: 4 };
  const r = doAction(s, 'old-market', 'scavenge', createRng(1), content);
  expect(r.state).toEqual(s);
  expect(r.events[0].kind).toBe('system');
});
test('scavenging pays danger×3 to danger×8 coins', () => {
  for (let seed = 0; seed < 50; seed++) {
    const r = doAction(withCoins(baseState(), 0), 'subway-tunnels', 'scavenge', createRng(seed), content).state;
    expect(r.player.coins).toBeGreaterThanOrEqual(9);
    expect(r.player.coins).toBeLessThanOrEqual(24);
  }
});
test('resting heals 30% of max hp, never above max', () => {
  const hurt = { ...baseState(), player: { ...baseState().player, hp: 20 } };
  expect(doAction(hurt, 'old-market', 'rest', createRng(1), content).state.player.hp).toBe(50);
  const scratched = { ...baseState(), player: { ...baseState().player, hp: 90 } };
  expect(doAction(scratched, 'old-market', 'rest', createRng(1), content).state.player.hp).toBe(100);
});
test('hunting starts a fight with one of the zone enemies, in one hour total', () => {
  const s = baseState();
  const r = doAction(s, 'old-market', 'hunt', createRng(2), content).state;
  expect(['rat-swarm', 'feral-hound']).toContain(r.fight!.enemyId);
  expect(r.fight!.origin).toBe('hunt');
  expect(r.inGameHour).toBe(s.inGameHour + 1);
  expect(r.energy).toBe(s.energy - 15);
});
test('danger makes enemies tougher', () => {
  const hound = content.enemies.find(e => e.id === 'feral-hound')!;
  expect(combatantFromEnemy(hound, 1).hp).toBe(hound.hp);
  expect(combatantFromEnemy(hound, 3).hp).toBeGreaterThan(hound.hp);
});
test('exploring can start a sub-scenario offered in that zone', () => {
  // first roll 0.1 < 0.3 starts the sub-scenario; 0.9 skips the random fight
  const r = doAction(baseState(), 'old-market', 'explore', seqRng(0.1, 0.9), content).state;
  expect(r.subScenario).toMatchObject({ defId: 'market-pest-control', progress: 0 });
});
test('a new game knows every zone and seals the ones that start sealed', () => {
  expect(baseState().zones['old-market']).toEqual({ sealed: false, dangerBonus: 0 });
});
