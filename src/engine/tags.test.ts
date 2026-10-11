import { fightTurn } from './combat'
import { onScenarioCleared } from './constellations'
import { checkHiddenTriggers } from './hidden'
import { giveToSurvivor, tradeWithSurvivor } from './survivors'
import type { GameEvent, GameState, Tag } from './types'
import {
  baseState, clearHiddenDefs, fixtureContent as content, hiddenDef, inFight, inRest, makeSurvivor, seqRng, weakEnemy,
  withCoins, withItem, withSkill, withStigma,
} from '../test/fixtures'

const tags = (events: GameEvent[]): Tag[] => events.flatMap(e => e.tags ?? []);
const friend = (attitude: number) => (s: GameState): GameState => ({ ...s, survivors: [makeSurvivor('s-1', { met: true, attitude })] });
const byId = (s: GameState) => s.survivors.find(v => v.id === 's-1')!;

describe('greed', () => {
  test('overcharging a survivor sells at full price, and they remember being robbed', () => {
    const s = withItem(withCoins(friend(0)(baseState()), 0), 'crowbar');
    const r = tradeWithSurvivor(s, 's-1', 'crowbar', 'overcharge', content, seqRng(0.99));
    expect(r.state.player.coins).toBe(60);
    expect(tags(r.events)).toContain('greed');
    expect(byId(r.state)).toMatchObject({ attitude: -15, memories: ['robbed'] });
  });
  test('robbing a survivor takes an item for nothing', () => {
    const s = withCoins(friend(0)(baseState()), 0);
    const r = tradeWithSurvivor(s, 's-1', 'crowbar', 'rob', content, seqRng(0.99));
    expect(r.state.player.inventory.some(i => i.itemId === 'crowbar')).toBe(true);
    expect(r.state.player.coins).toBe(0);
    expect(tags(r.events)).toEqual(expect.arrayContaining(['greed', 'cruelty']));
    expect(byId(r.state).attitude).toBe(-40);
  });
  test('a fair trade is not greedy', () => {
    const s = withCoins(friend(0)(baseState()), 100);
    expect(tags(tradeWithSurvivor(s, 's-1', 'crowbar', 'buy', content, seqRng(0.99)).events)).not.toContain('greed');
  });
});

describe('style', () => {
  const lastHit = (s: GameState) => ({ ...s, fight: { ...s.fight!, enemy: { ...s.fight!.enemy, hp: 1 } } });
  test('winning without taking damage', () => {
    const r = fightTurn(lastHit(inFight(baseState(), weakEnemy())), { kind: 'attack' }, seqRng(0.5, 0.9), content);
    expect(tags(r.events)).toContain('style');
  });
  test('winning after taking damage, without a crit, is not stylish', () => {
    const hurt = inFight(baseState(), { ...weakEnemy(), hp: 40, maxHp: 40 });
    const once = fightTurn(hurt, { kind: 'attack' }, seqRng(0.5, 0.9), content).state;
    const r = fightTurn(lastHit(once), { kind: 'attack' }, seqRng(0.5, 0.9), content);
    expect(r.result).toBe('won');
    expect(tags(r.events)).not.toContain('style');
  });
  test('ending a fight with a critical hit', () => {
    const hurt = inFight(baseState(), { ...weakEnemy(), hp: 40, maxHp: 40 });
    const once = fightTurn(hurt, { kind: 'attack' }, seqRng(0.5, 0.9), content).state;
    const r = fightTurn(lastHit(once), { kind: 'attack' }, seqRng(0.5, 0.01), content);
    expect(tags(r.events)).toContain('style');
  });
});

describe('loyalty', () => {
  test('keeping a contract demand at scenario clear', () => {
    const c = content.constellations[0];
    const s = withStigma(baseState(), c.id);
    const kept = { ...s, constellations: { ...s.constellations, [c.id]: { ...s.constellations[c.id], demandMetThisScenario: true } } };
    expect(tags(onScenarioCleared(kept, content).events)).toContain('loyalty');
    expect(tags(onScenarioCleared(s, content).events)).not.toContain('loyalty');
  });
  test('helping a survivor who likes you (30+) is loyal; helping anyone is merciful', () => {
    const loyal = giveToSurvivor(withItem(friend(30)(baseState()), 'bandage'), 's-1', 'bandage', content);
    expect(tags(loyal.events)).toEqual(expect.arrayContaining(['loyalty', 'mercy']));
    expect(byId(loyal.state)).toMatchObject({ attitude: 45, memories: ['helped'] });
    expect(loyal.state.player.inventory.some(i => i.itemId === 'bandage')).toBe(false);
    const kind = giveToSurvivor(withItem(friend(10)(baseState()), 'bandage'), 's-1', 'bandage', content);
    expect(tags(kind.events)).toEqual(['mercy']);
  });
  test('you cannot give what you do not have', () => {
    const s = friend(30)(baseState());
    expect(giveToSurvivor(s, 's-1', 'bandage', content).state).toEqual(s);
  });
});

describe('cunning', () => {
  test('discovering a hidden scenario', () => {
    clearHiddenDefs();
    hiddenDef('sly', { kind: 'repeat-action', zoneId: 'old-market', action: 'rest', count: 1 });
    const s = { ...inRest(baseState(), 50), actionCounts: { 'old-market/rest': 1 } };
    expect(tags(checkHiddenTriggers(s, { zoneId: 'old-market', action: 'rest' }, content).events)).toContain('cunning');
  });
  test('winning with a skill or an item on the final turn', () => {
    const last = { ...weakEnemy(), hp: 1 };
    const bySkill = fightTurn(inFight(withSkill(baseState(), 'quick-strike'), last), { kind: 'skill', skillId: 'quick-strike' }, seqRng(0.5, 0.9), content);
    expect(tags(bySkill.events)).toContain('cunning');
    const byItem = fightTurn(inFight(withItem(baseState(), 'flare'), last), { kind: 'item', itemId: 'flare' }, seqRng(0.5, 0.9), content);
    expect(tags(byItem.events)).toContain('cunning');
    const byFist = fightTurn(inFight(baseState(), last), { kind: 'attack' }, seqRng(0.5, 0.9), content);
    expect(tags(byFist.events)).not.toContain('cunning');
  });
});

