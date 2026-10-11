import { rollAttribute } from './attributes'
import { doAction } from './actions'
import { fightTurn } from './combat'
import { newGame } from './newGame'
import { createRng } from './rng'
import { generateSurvivors } from './survivors'
import { content } from '../data'
import {
  attributeDef, baseState, fixtureContent, inFight, onlyAttribute, seqRng, unarmed, weakEnemy, withAttribute,
} from '../test/fixtures'

const start = (backgroundId = 'courier', seed = 1, c = content) => newGame({ name: 'Ari', backgroundId, seed, now: 0 }, c);

test('the same seed gives the same attribute', () => {
  expect(start('courier', 5).player.attributeId).not.toBeNull();
  expect(start('courier', 5).player.attributeId).toBe(start('courier', 5).player.attributeId);
  const seen = new Set(Array.from({ length: 40 }, (_, i) => start('courier', i).player.attributeId));
  expect(seen.size).toBeGreaterThan(1);
});
test('rarities over 10,000 rolls land within 2 points of 70/25/5', () => {
  const rng = createRng(123);
  const counts = { common: 0, rare: 0, legendary: 0 };
  for (let i = 0; i < 10_000; i++) {
    const id = rollAttribute(content, rng);
    counts[content.attributes.find(a => a.id === id)!.rarity]++;
  }
  expect(Math.abs(counts.common / 100 - 70)).toBeLessThanOrEqual(2);
  expect(Math.abs(counts.rare / 100 - 25)).toBeLessThanOrEqual(2);
  expect(Math.abs(counts.legendary / 100 - 5)).toBeLessThanOrEqual(2);
});
test('background weights steer the pick within a rarity', () => {
  const never = attributeDef({ kind: 'coins', percent: 10 }, { id: 'never-couriers', backgroundWeights: { courier: 0 } });
  const often = attributeDef({ kind: 'coins', percent: 10 }, { id: 'loves-couriers', backgroundWeights: { courier: 3 } });
  const plain = attributeDef({ kind: 'coins', percent: 10 }, { id: 'plain' });
  const c = { ...content, attributes: [never, often, plain] };
  const rng = createRng(9);
  const picks = Array.from({ length: 4000 }, () => rollAttribute(c, rng, 'courier'));
  expect(picks).not.toContain('never-couriers');
  expect(picks.filter(p => p === 'loves-couriers').length / 4000).toBeCloseTo(0.75, 1);
  expect(Array.from({ length: 400 }, () => rollAttribute(c, rng, 'line-cook'))).toContain('never-couriers');
});
test('the attribute is announced in the very first log line', () => {
  const s = start();
  const def = content.attributes.find(a => a.id === s.player.attributeId)!;
  expect(s.log[0].text).toContain(def.name);
  expect(s.log[0].text).toContain(def.rarity);
});
test('constellations that like one of its tags start 10 interest warmer', () => {
  const brave = attributeDef({ kind: 'coins', percent: 10 }, { tags: ['bravery'] });
  const s = start('courier', 1, onlyAttribute(brave));
  for (const c of content.constellations) {
    expect(s.constellations[c.id].interest).toBe((c.likes.bravery ?? 0) > 0 ? 10 : 0);
  }
});
test('survivors roll attributes too', () => {
  expect(generateSurvivors(content, createRng(3)).every(v => content.attributes.some(a => a.id === v.attributeId))).toBe(true);
});

describe('passive effects', () => {
  test('stat bonus raises the stat from the first morning', () => {
    const s = start('courier', 1, onlyAttribute(attributeDef({ kind: 'stat', stat: 'endurance', amount: 2 })));
    expect(s.player.stats.endurance).toBe(7);
    expect(s.player.hp).toBe(120);
  });
  test('coin bonus raises coins found', () => {
    // subway tunnels: danger 3 pays 9..24; roll 0 gives 9; 0.99s skip the item and the ambush
    const rolls = () => seqRng(0.0, 0.99, 0.99, 0.99);
    expect(doAction(baseState(), 'subway-tunnels', 'scavenge', rolls(), fixtureContent).state.player.coins).toBe(9);
    const rich = withAttribute(baseState(), { kind: 'coins', percent: 50 });
    expect(doAction(rich, 'subway-tunnels', 'scavenge', rolls(), fixtureContent).state.player.coins).toBe(13);
  });
  test('run bonus improves the odds of getting away', () => {
    // agility 7 vs 3: 60% base; a roll of 0.7 fails without the bonus and succeeds with +20%
    const fight = inFight(baseState(), weakEnemy());
    expect(fightTurn(fight, { kind: 'run' }, seqRng(0.7, 0.5, 0.9), fixtureContent).result).toBe('ongoing');
    const quick = withAttribute(fight, { kind: 'run', bonus: 0.2 });
    expect(fightTurn(quick, { kind: 'run' }, seqRng(0.7, 0.5, 0.9), fixtureContent).result).toBe('fled');
  });
  test('damage bonus applies to enemies with the tag', () => {
    // unarmed: 9 damage at a middle roll; +50% vs beasts makes it 14 against a hound
    const s = inFight(unarmed(baseState()), weakEnemy(), { enemyId: 'feral-hound' });
    expect(fightTurn(s, { kind: 'attack' }, seqRng(0.5, 0.9), fixtureContent).state.fight!.enemy.hp).toBe(21);
    const slayer = withAttribute(s, { kind: 'damage-vs', enemyTag: 'beast', percent: 50 });
    expect(fightTurn(slayer, { kind: 'attack' }, seqRng(0.5, 0.9), fixtureContent).state.fight!.enemy.hp).toBe(16);
    const other = withAttribute(s, { kind: 'damage-vs', enemyTag: 'monster', percent: 50 });
    expect(fightTurn(other, { kind: 'attack' }, seqRng(0.5, 0.9), fixtureContent).state.fight!.enemy.hp).toBe(21);
  });
  test('healing bonus makes healing stronger', () => {
    const hurt = { ...baseState(), player: { ...baseState().player, hp: 20 } };
    expect(doAction(hurt, 'old-market', 'rest', seqRng(0.99), fixtureContent).state.player.hp).toBe(50);
    const healer = withAttribute(hurt, { kind: 'healing', percent: 50 });
    expect(doAction(healer, 'old-market', 'rest', seqRng(0.99), fixtureContent).state.player.hp).toBe(65);
  });
});
