import { fightTurn, runChance, startFight } from './combat'
import { createRng } from './rng'
import { content } from '../data'
import { baseState, brutalEnemy, inFight, seqRng, weakEnemy, withItem, withSkill } from '../test/fixtures'

test('attack lowers enemy hp and logs it', () => {
  const s = inFight(baseState(), weakEnemy());
  const r = fightTurn(s, { kind: 'attack' }, createRng(3), content);
  expect(r.state.fight!.enemy.hp).toBeLessThan(weakEnemy().hp);
  expect(r.events.some(e => e.kind === 'fight')).toBe(true);
});
test('killing the enemy wins and clears the fight', () => {
  const s = inFight(baseState(), { ...weakEnemy(), hp: 1 });
  const r = fightTurn(s, { kind: 'attack' }, createRng(3), content);
  expect(r.result).toBe('won');
  expect(r.state.fight).toBeNull();
  expect(r.state.player.kills).toBe(1);
});
test('player at 0 hp loses', () => {
  const s = inFight({ ...baseState(), player: { ...baseState().player, hp: 1 } }, brutalEnemy());
  expect(fightTurn(s, { kind: 'attack' }, createRng(9), content).result).toBe('lost');
});
test('run chance is clamped to 10..90 percent', () => {
  expect(runChance(1, 40)).toBe(0.1);
  expect(runChance(40, 1)).toBe(0.9);
});
test('a skill on cooldown cannot be used', () => {
  const s = { ...inFight(withSkill(baseState(), 'quick-strike'), weakEnemy()) };
  s.fight!.cooldowns['quick-strike'] = 2;
  const r = fightTurn(s, { kind: 'skill', skillId: 'quick-strike' }, createRng(1), content);
  expect(r.events[0].text).toMatch(/not ready/i);
  expect(r.state.fight!.round).toBe(s.fight!.round);
});

test('damage follows the formula: 5 str, no weapon, vs 1 endurance, middle roll', () => {
  // (5*2 + 0 - 1 - 0) * (0.85 + 0.5*0.3 = 1.0) = 9; crit roll 0.5 misses.
  const s = inFight(baseState(), weakEnemy());
  const r = fightTurn(s, { kind: 'attack' }, seqRng(0.5), content);
  expect(r.state.fight!.enemy.hp).toBe(21);
});
test('an equipped weapon adds its power to damage', () => {
  const s = inFight({ ...baseState(), player: { ...baseState().player, equipped: { weapon: 'bike-chain' } } }, weakEnemy());
  const r = fightTurn(s, { kind: 'attack' }, seqRng(0.5), content);
  expect(r.state.fight!.enemy.hp).toBe(18);
});
test('a critical hit does half again as much damage', () => {
  // crit chance = min(0.3, 7 agility * 0.02) = 0.14; roll 0.1 crits; damage roll 0.5 → 9 * 1.5 = 13.5 → 14
  const s = inFight(baseState(), weakEnemy());
  const r = fightTurn(s, { kind: 'attack' }, seqRng(0.5, 0.1, 0.5, 0.9), content);
  expect(r.state.fight!.enemy.hp).toBe(16);
});
test('the enemy hits back after the player acts', () => {
  const s = inFight(baseState(), { ...weakEnemy(), stats: { ...weakEnemy().stats, strength: 10 } });
  const r = fightTurn(s, { kind: 'attack' }, seqRng(0.5, 0.9), content);
  expect(r.state.player.hp).toBeLessThan(100);
  expect(r.state.fight!.round).toBe(2);
});
test('a defensive enemy halves damage on its guard round', () => {
  const guard = { ...weakEnemy(), behavior: 'defensive' as const };
  const normal = fightTurn({ ...inFight(baseState(), guard) }, { kind: 'attack' }, seqRng(0.5, 0.9), content);
  const guarded = inFight(baseState(), guard); guarded.fight!.round = 3;
  const r = fightTurn(guarded, { kind: 'attack' }, seqRng(0.5, 0.9), content);
  expect(30 - r.state.fight!.enemy.hp).toBe(Math.round((30 - normal.state.fight!.enemy.hp) / 2));
});
test('a successful run ends the fight, costs an hour and smells of cowardice', () => {
  const s = inFight(baseState(), weakEnemy());
  const r = fightTurn(s, { kind: 'run' }, seqRng(0.01), content);
  expect(r.result).toBe('fled');
  expect(r.state.fight).toBeNull();
  expect(r.state.inGameHour).toBe(s.inGameHour + 1);
  expect(r.events.some(e => e.tags?.includes('cowardice'))).toBe(true);
});
test('a failed run gives the enemy a free hit', () => {
  const s = inFight(baseState(), { ...weakEnemy(), stats: { ...weakEnemy().stats, strength: 10 } });
  const r = fightTurn(s, { kind: 'run' }, seqRng(0.99, 0.5), content);
  expect(r.result).toBe('ongoing');
  expect(r.state.player.hp).toBeLessThan(100);
});
test('using a skill records the use and puts it on cooldown', () => {
  const s = inFight(withSkill(baseState(), 'quick-strike'), weakEnemy());
  const r = fightTurn(s, { kind: 'skill', skillId: 'quick-strike' }, seqRng(0.5, 0.9), content);
  expect(r.state.player.skills[0].uses).toBe(1);
  expect(r.state.fight!.cooldowns['quick-strike']).toBeGreaterThan(0);
  expect(r.state.fight!.enemy.hp).toBeLessThan(21);
});
test('a damage item hurts the enemy and is used up', () => {
  const s = inFight(withItem(baseState(), 'flare'), weakEnemy());
  const r = fightTurn(s, { kind: 'item', itemId: 'flare' }, seqRng(0.5, 0.9), content);
  expect(r.state.fight!.enemy.hp).toBe(10);
  expect(r.state.player.inventory.some(i => i.itemId === 'flare')).toBe(false);
});
test('winning against a known enemy pays coins in its range and tags bravery', () => {
  const s = inFight(baseState(), { ...weakEnemy(), hp: 1 }, { enemyId: 'feral-hound' });
  const r = fightTurn(s, { kind: 'attack' }, createRng(4), content);
  expect(r.state.player.coins).toBeGreaterThanOrEqual(4);
  expect(r.state.player.coins).toBeLessThanOrEqual(9);
  expect(r.events.some(e => e.tags?.includes('bravery'))).toBe(true);
});
test('starting a fight costs one hour and announces the enemy', () => {
  const s = baseState();
  const r = startFight(s, weakEnemy(), 'hunt', {});
  expect(r.state.fight).toMatchObject({ round: 1, origin: 'hunt', enemy: { name: 'Test Rat' } });
  expect(r.state.inGameHour).toBe(s.inGameHour + 1);
  expect(r.events[0].kind).toBe('fight');
});
