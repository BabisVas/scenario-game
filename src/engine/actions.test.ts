import { ambushChance, canAct, combatantFromEnemy, doAction } from './actions'
import type { GameState } from './types'
import { createRng } from './rng'
import { content } from '../data'
import { at, baseState, fixtureContent, inFight, inRest, inScenario, killDef, sealZone, seqRng, weakEnemy, withCoins } from '../test/fixtures'

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
    const r = doAction(at(withCoins(baseState(), 0), 'subway-tunnels'), 'subway-tunnels', 'scavenge', createRng(seed), content).state;
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

describe('ambushes in survive scenarios', () => {
  test('the chance is 10% plus 5% per zone danger level', () => {
    expect(ambushChance(1)).toBeCloseTo(0.15);
    expect(ambushChance(3)).toBeCloseTo(0.25);
  });
  test('even resting can be ambushed by an enemy from that zone', () => {
    // 0.14 < 15% in the danger-1 market: ambush; 0.0 picks the zone's first enemy
    const r = doAction(baseState(), 'old-market', 'rest', seqRng(0.14, 0.0, 0.5), content);
    expect(r.state.fight).toMatchObject({ enemyId: 'rat-swarm' });
    expect(r.events.some(e => /ambush/i.test(e.text))).toBe(true);
  });
  test('a roll above the chance passes quietly', () => {
    expect(doAction(baseState(), 'old-market', 'rest', seqRng(0.16), content).state.fight).toBeNull();
  });
  test('danger raised by the scenario raises the chance', () => {
    const s = { ...baseState(), zones: { ...baseState().zones, 'old-market': { sealed: false, dangerBonus: 2 } } };
    expect(doAction(s, 'old-market', 'rest', seqRng(0.24, 0.0, 0.5), content).state.fight).not.toBeNull();
  });
  test('there are no ambushes in the rest period between scenarios', () => {
    expect(doAction(inRest(baseState(), 20), 'old-market', 'rest', seqRng(0.0), fixtureContent).state.fight).toBeNull();
  });
  test('there are no ambushes in scenarios that are not survive scenarios', () => {
    const s = inScenario(baseState(), killDef({ hours: 20, count: 5 }));
    expect(doAction(s, 'old-market', 'rest', seqRng(0.0), fixtureContent).state.fight).toBeNull();
  });
  test('an ambush on the last hour must be fought before the scenario clears', () => {
    const s = { ...baseState(), phase: { ...baseState().phase, hoursLeft: 4 } as GameState['phase'] };
    const r = doAction(s, 'old-market', 'rest', seqRng(0.0, 0.0, 0.5), content).state;
    expect(r.fight).not.toBeNull();
    expect(r.phase.kind).toBe('scenario');
  });
  test('resting through a whole survive scenario is not reliably safe', () => {
    let ambushed = 0;
    for (let seed = 0; seed < 200; seed++) {
      let s = baseState();
      const rng = createRng(seed);
      for (let i = 0; i < 3 && !s.fight; i++) s = doAction(s, 'old-market', 'rest', rng, content).state;
      if (s.fight) ambushed++;
    }
    expect(ambushed).toBeGreaterThan(40);
  });
});
