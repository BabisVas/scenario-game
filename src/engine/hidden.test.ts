import { doAction, travel } from './actions'
import { checkScenarioClock, recordProgress, resolveChoice, spendHours, startScenario } from './scenario'
import { appendEvents } from './log'
import { worldTick } from './survivors'
import { checkHiddenTriggers } from './hidden'
import { createRng } from './rng'
import type { GameState } from './types'
import {
  at, baseState, choiceDef, clearHiddenDefs, fixtureContent as content, hiddenDef, inRest, inScenario, makeSurvivor,
  killDef, surviveDef, withItem,
} from '../test/fixtures'

beforeEach(() => clearHiddenDefs());

/** A calm state: a long rest period, so no ambushes and no scenario clock pressure. */
const calm = (): GameState => inRest(baseState(), 500);
const act = (s: GameState, zoneId: string, action: Parameters<typeof doAction>[2], seed = 1) => doAction(at(s, zoneId), zoneId, action, createRng(seed), content);
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
  const s = { ...calm(), actionCounts: { 'old-market/rest': 1 } };
  const r = checkHiddenTriggers(s, { zoneId: 'old-market', action: 'rest' }, content).state;
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
  test('carrying an item into a zone: only arriving with it counts, not acting there', () => {
    hiddenDef('flare-bearer', { kind: 'carry-item', itemId: 'flare', zoneId: 'glass-towers' });
    expect(discovered(act(withItem(calm(), 'flare'), 'glass-towers', 'scavenge'))).toBe(false);
    expect(discovered(travel(at(withItem(calm(), 'flare'), 'old-market'), 'glass-towers', createRng(1), content))).toBe(true);
    expect(discovered(travel(at(calm(), 'old-market'), 'glass-towers', createRng(1), content))).toBe(false);
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

describe('rumors arrive before a hidden scenario window closes', () => {
  const rumorIn = (events: { text: string }[], text: string) => events.some(e => e.text.includes(text));

  test('a "be there during scenario N" rumor is posted when the scenario before N starts', () => {
    const before = surviveDef({ hours: 40 }); // number 901
    hiddenDef('stage-door', { kind: 'zone-during-scenario', zoneId: 'glass-towers', scenarioNumber: 902 }, { rumor: 'RUMOR-STAGE' });
    killDef({ hours: 10, count: 3 }); // number 902 exists
    expect(rumorIn(startScenario(baseState(), before, createRng(1), content).events, 'RUMOR-STAGE')).toBe(true);
    expect(rumorIn(startScenario(baseState(), content.scenarios[0], createRng(1), content).events, 'RUMOR-STAGE')).toBe(false);
  });
  test('a "choose this option" rumor is posted when the scenario before the choice starts', () => {
    const choice = choiceDef(); // number 905
    hiddenDef('toll-paid', { kind: 'choose-option', scenarioId: choice.id, optionId: 'walk-away' }, { rumor: 'RUMOR-TOLL' });
    const before = content.scenarios.filter(d => d.number < choice.number).sort((a, b) => b.number - a.number)[0];
    expect(rumorIn(startScenario(baseState(), before, createRng(1), content).events, 'RUMOR-TOLL')).toBe(true);
  });
  test('a window in the very first scenario gets its rumor as that scenario starts', () => {
    hiddenDef('first-morning', { kind: 'zone-during-scenario', zoneId: 'old-market', scenarioNumber: 1 }, { rumor: 'RUMOR-FIRST' });
    expect(rumorIn(startScenario(baseState(), content.scenarios[0], createRng(1), content).events, 'RUMOR-FIRST')).toBe(true);
  });
  test('no window rumor for a hidden scenario already found', () => {
    const before = surviveDef({ hours: 40 });
    hiddenDef('stage-door', { kind: 'zone-during-scenario', zoneId: 'glass-towers', scenarioNumber: 902 }, { rumor: 'RUMOR-STAGE' });
    killDef({ hours: 10, count: 3 });
    const found = { ...baseState(), foundHiddenIds: ['stage-door'] };
    expect(rumorIn(startScenario(found, before, createRng(1), content).events, 'RUMOR-STAGE')).toBe(false);
  });
  test('a careful player playing straight through sees the rumor in the log before the window', () => {
    hiddenDef('stage-door', { kind: 'zone-during-scenario', zoneId: 'glass-towers', scenarioNumber: 902 }, { rumor: 'RUMOR-STAGE' });
    surviveDef({ hours: 40 });
    killDef({ hours: 10, count: 3 });
    // Clear scenario 901 and rest until 902 begins, with no real time passing at all.
    let s = inRest(baseState(), 0, 'fx-survive');
    const step = checkScenarioClock(s, createRng(1), content);
    s = appendEvents(step.state, step.events);
    const sawRumor = s.log.some(e => e.text.includes('RUMOR-STAGE'));
    expect(s.phase).toMatchObject({ kind: 'scenario', scenarioId: 'fx-survive' });
    expect(sawRumor).toBe(true);
  });
});

describe('a hidden scenario outlives its main scenario', () => {
  function foundByTheChoice(goal: Parameters<typeof hiddenDef>[2] = {}) {
    const def = choiceDef();
    hiddenDef('after-hours', { kind: 'choose-option', scenarioId: def.id, optionId: 'walk-away' }, { hours: 12, ...goal });
    return resolveChoice(inScenario(baseState(), def), 'walk-away', null, createRng(1), content).state;
  }
  test('the choice that finds it ends the main scenario, and the hidden one keeps running into the rest period', () => {
    const s = foundByTheChoice();
    expect(s.phase.kind).toBe('rest');
    expect(s.hiddenScenario).toMatchObject({ defId: 'after-hours', hoursLeft: 12 });
    const later = checkScenarioClock(spendHours(s, 5), createRng(1), content).state;
    expect(later.phase.kind).toBe('rest');
    expect(later.hiddenScenario).toMatchObject({ defId: 'after-hours', hoursLeft: 7 });
  });
  test('it can be won during the rest period', () => {
    const s = foundByTheChoice({ goal: { kind: 'kill', count: 1 } });
    const coins = s.player.coins;
    const r = checkScenarioClock(recordProgress(spendHours(s, 3), 'kill', { enemyTags: ['beast'] }, content), createRng(1), content).state;
    expect(r.hiddenScenario).toBeNull();
    expect(r.player.coins).toBe(coins + 100);
  });
  test('it can run out during the rest period, harmlessly', () => {
    const s = foundByTheChoice({ goal: { kind: 'kill', count: 9 } });
    const r = checkScenarioClock(spendHours(s, 12), createRng(1), content).state;
    expect(r.hiddenScenario).toBeNull();
    expect(r.phase.kind).toBe('rest');
    expect(r.player.hp).toBe(s.player.hp);
  });
});

describe('hidden scenarios never bring a Final Wave', () => {
  test('a hidden survive goal ending inside a main survive scenario pays and starts no fight', () => {
    const main = surviveDef({ hours: 20 });
    hiddenDef('wait', { kind: 'repeat-action', zoneId: 'old-market', action: 'rest', count: 1 }, { goal: { kind: 'survive' }, hours: 4 });
    let s = inScenario(at(baseState(), 'old-market'), main);
    s = { ...s, hiddenScenario: { defId: 'wait', hoursLeft: 0, progress: 0 }, foundHiddenIds: ['wait'] };
    const r = checkScenarioClock(s, createRng(1), content);
    expect(r.state.fight).toBeNull();
    expect(r.state.hiddenScenario).toBeNull();
    expect(r.events.some(e => /final wave/i.test(e.text))).toBe(false);
  });
  test('a hidden survive goal ending in a rest period pays and starts no fight', () => {
    hiddenDef('wait', { kind: 'repeat-action', zoneId: 'old-market', action: 'rest', count: 1 }, { goal: { kind: 'survive' }, hours: 4 });
    const s = { ...calm(), hiddenScenario: { defId: 'wait', hoursLeft: 0, progress: 0 }, foundHiddenIds: ['wait'] };
    const r = checkScenarioClock(s, createRng(1), content);
    expect(r.state.fight).toBeNull();
    expect(r.state.phase.kind).toBe('rest');
  });
});

describe('a hidden survive goal can require a zone', () => {
  const running = (zoneId: string) => {
    hiddenDef('platform', { kind: 'repeat-action', zoneId: 'old-market', action: 'rest', count: 1 }, { goal: { kind: 'survive', zoneId: 'subway-tunnels' }, hours: 4 });
    return { ...at(calm(), zoneId), hiddenScenario: { defId: 'platform', hoursLeft: 0, progress: 0 }, foundHiddenIds: ['platform'] };
  };
  test('standing in the zone when the clock ends pays', () => {
    const s = running('subway-tunnels');
    const r = checkScenarioClock(s, createRng(1), content);
    expect(r.state.player.coins).toBe(s.player.coins + 100);
  });
  test('standing anywhere else when the clock ends pays nothing, and costs nothing else', () => {
    const s = running('old-market');
    const r = checkScenarioClock(s, createRng(1), content);
    expect(r.state.hiddenScenario).toBeNull();
    expect(r.state.player).toEqual(s.player);
    expect(r.events.some(e => /hidden scenario failed/i.test(e.text))).toBe(true);
  });
});

describe('a hidden scenario whose target zone is sealed waits', () => {
  const sealed = (s: GameState, zoneId: string, on = true): GameState => ({ ...s, zones: { ...s.zones, [zoneId]: { sealed: on, dangerBonus: 0 } } });
  test('its trigger does not fire while the reach target is sealed', () => {
    hiddenDef('reunion', { kind: 'repeat-action', zoneId: 'old-market', action: 'rest', count: 1 }, { goal: { kind: 'reach', zoneId: 'glass-towers' } });
    const r = act(sealed(calm(), 'glass-towers'), 'old-market', 'rest');
    expect(discovered(r)).toBe(false);
    expect(r.state.foundHiddenIds).not.toContain('reunion');
  });
  test('the trigger stays armed and fires once the zone reopens', () => {
    hiddenDef('reunion', { kind: 'repeat-action', zoneId: 'old-market', action: 'rest', count: 1 }, { goal: { kind: 'reach', zoneId: 'glass-towers' } });
    const first = act(sealed(calm(), 'glass-towers'), 'old-market', 'rest').state;
    const second = act(sealed(first, 'glass-towers', false), 'old-market', 'rest');
    expect(discovered(second)).toBe(true);
  });
  test('a required survive zone that is sealed also holds the trigger back', () => {
    hiddenDef('platform', { kind: 'repeat-action', zoneId: 'old-market', action: 'rest', count: 1 }, { goal: { kind: 'survive', zoneId: 'subway-tunnels' } });
    expect(discovered(act(sealed(calm(), 'subway-tunnels'), 'old-market', 'rest'))).toBe(false);
  });
});
