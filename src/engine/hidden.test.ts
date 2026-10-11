import { doAction } from './actions'
import { checkScenarioClock, recordProgress, resolveChoice, spendHours } from './scenario'
import { worldTick } from './survivors'
import { createRng } from './rng'
import type { GameState } from './types'
import {
  baseState, choiceDef, clearHiddenDefs, fixtureContent as content, hiddenDef, inRest, inScenario, makeSurvivor,
  surviveDef, withItem,
} from '../test/fixtures'

beforeEach(() => clearHiddenDefs());

/** A calm state: a long rest period, so no ambushes and no scenario clock pressure. */
const calm = (): GameState => inRest(baseState(), 500);
const act = (s: GameState, zoneId: string, action: Parameters<typeof doAction>[2], seed = 1) => doAction(s, zoneId, action, createRng(seed), content);
const discovered = (r: { events: { text: string }[] }) => r.events.some(e => /hidden scenario discovered/i.test(e.text));

test('a trigger fires once and only once', () => {
  hiddenDef('regular', { kind: 'repeat-action', zoneId: 'old-market', action: 'rest', count: 3 });
  let s = calm();
  s = act(s, 'old-market', 'rest').state;
  s = act(s, 'old-market', 'rest').state;
  expect(s.hiddenScenario).toBeNull();
  const third = act(s, 'old-market', 'rest');
  expect(discovered(third)).toBe(true);
  expect(third.state.hiddenScenario).toMatchObject({ defId: 'regular', hoursLeft: 6, progress: 0 });
  // Let it run out, then repeat the trigger: it never comes back.
  s = checkScenarioClock(spendHours(third.state, 6), createRng(1), content).state;
  expect(s.hiddenScenario).toBeNull();
  for (let i = 0; i < 5; i++) {
    const r = act(s, 'old-market', 'rest');
    expect(discovered(r)).toBe(false);
    s = r.state;
  }
  expect(s.hiddenScenario).toBeNull();
});
test('discovery makes every constellation take notice (+15)', () => {
  hiddenDef('regular', { kind: 'repeat-action', zoneId: 'old-market', action: 'rest', count: 1 });
  const s = calm();
  const r = act(s, 'old-market', 'rest').state;
  for (const c of content.constellations) expect(r.constellations[c.id].interest).toBe(s.constellations[c.id].interest + 15);
});
test('only one hidden scenario runs at a time', () => {
  hiddenDef('first', { kind: 'repeat-action', zoneId: 'old-market', action: 'rest', count: 1 });
  hiddenDef('second', { kind: 'repeat-action', zoneId: 'old-market', action: 'rest', count: 2 });
  let s = act(calm(), 'old-market', 'rest').state;
  s = act(s, 'old-market', 'rest').state;
  expect(s.hiddenScenario!.defId).toBe('first');
  expect(s.foundHiddenIds).toEqual(['first']);
});

describe('trigger kinds', () => {
  test('carrying an item into a zone', () => {
    hiddenDef('flare-bearer', { kind: 'carry-item', itemId: 'flare', zoneId: 'glass-towers' });
    expect(discovered(act(calm(), 'glass-towers', 'scavenge'))).toBe(false);
    expect(discovered(act(withItem(calm(), 'flare'), 'glass-towers', 'scavenge'))).toBe(true);
  });
  test('meeting the same survivor N times', () => {
    hiddenDef('old-friend', { kind: 'meet-survivor', count: 3 });
    let s: GameState = { ...calm(), survivors: [makeSurvivor('s-0', { zoneId: 'old-market' })] };
    s = act(s, 'old-market', 'talk').state;
    s = act(s, 'old-market', 'talk').state;
    expect(s.hiddenScenario).toBeNull();
    expect(discovered(act(s, 'old-market', 'talk'))).toBe(true);
  });
  test('being in a zone during scenario N', () => {
    const def = surviveDef({ hours: 40 });
    hiddenDef('stage-door', { kind: 'zone-during-scenario', zoneId: 'glass-towers', scenarioNumber: def.number });
    expect(discovered(act(calm(), 'glass-towers', 'scavenge', 99))).toBe(false);
    expect(discovered(act(inScenario(baseState(), def), 'glass-towers', 'scavenge', 99))).toBe(true);
  });
  test('choosing a specific option in a choice scenario', () => {
    const def = choiceDef();
    hiddenDef('toll-paid', { kind: 'choose-option', scenarioId: def.id, optionId: 'walk-away' });
    const r = resolveChoice(inScenario(baseState(), def), 'walk-away', null, createRng(1), content);
    expect(discovered(r)).toBe(true);
    expect(r.state.foundHiddenIds).toContain('toll-paid');
  });
});

test('failing a hidden scenario costs its rewards, never the player', () => {
  hiddenDef('hunt', { kind: 'repeat-action', zoneId: 'old-market', action: 'rest', count: 1 }, { goal: { kind: 'kill', count: 9 }, hours: 2 });
  let s = act({ ...calm(), player: { ...calm().player, hp: 3 } }, 'old-market', 'rest').state;
  const before = s.player;
  s = checkScenarioClock(spendHours(s, 2), createRng(1), content).state;
  expect(s.hiddenScenario).toBeNull();
  expect(s.phase.kind).not.toBe('dead');
  expect(s.player).toEqual(before);
});
test('meeting a hidden goal pays its rewards', () => {
  hiddenDef('hunt', { kind: 'repeat-action', zoneId: 'old-market', action: 'rest', count: 1 }, { goal: { kind: 'kill', count: 1 }, rewards: { coins: 100, itemIds: ['flare'] } });
  let s = act(calm(), 'old-market', 'rest').state;
  const coins = s.player.coins;
  s = checkScenarioClock(recordProgress(s, 'kill', { enemyTags: ['beast'] }, content), createRng(1), content).state;
  expect(s.hiddenScenario).toBeNull();
  expect(s.player.coins).toBe(coins + 100);
  expect(s.player.inventory.some(i => i.itemId === 'flare')).toBe(true);
});
test('a hidden survive goal pays when its own clock runs out', () => {
  hiddenDef('wait', { kind: 'repeat-action', zoneId: 'old-market', action: 'rest', count: 1 }, { goal: { kind: 'survive' }, hours: 4 });
  let s = act(calm(), 'old-market', 'rest').state;
  const coins = s.player.coins;
  s = checkScenarioClock(spendHours(s, 4), createRng(1), content).state;
  expect(s.player.coins).toBe(coins + 100);
});

test('rumors are only about hidden scenarios not yet found', () => {
  hiddenDef('found-one', { kind: 'repeat-action', zoneId: 'old-market', action: 'rest', count: 1 }, { rumor: 'RUMOR-FOUND' });
  hiddenDef('lost-one', { kind: 'repeat-action', zoneId: 'old-market', action: 'rest', count: 1 }, { rumor: 'RUMOR-LOST' });
  const s = { ...baseState(), foundHiddenIds: ['found-one'] };
  const texts = Array.from({ length: 400 }, (_, i) => worldTick(s, createRng(i), content).events.map(e => e.text)).flat();
  expect(texts.some(t => t.includes('RUMOR-LOST'))).toBe(true);
  expect(texts.some(t => t.includes('RUMOR-FOUND'))).toBe(false);
  const allFound = { ...baseState(), foundHiddenIds: ['found-one', 'lost-one'] };
  const none = Array.from({ length: 400 }, (_, i) => worldTick(allFound, createRng(i), content).events.map(e => e.text)).flat();
  expect(none.some(t => t.includes('RUMOR-'))).toBe(false);
});
test('rumors come about one tick in ten', () => {
  hiddenDef('lost-one', { kind: 'repeat-action', zoneId: 'old-market', action: 'rest', count: 1 }, { rumor: 'RUMOR-LOST' });
  const n = Array.from({ length: 2000 }, (_, i) => worldTick(baseState(), createRng(i), content).events.some(e => e.text.includes('RUMOR-LOST'))).filter(Boolean).length;
  expect(n / 2000).toBeGreaterThan(0.07);
  expect(n / 2000).toBeLessThan(0.13);
});
