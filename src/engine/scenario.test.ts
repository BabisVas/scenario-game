import { checkScenarioClock, clearScenario, recordProgress, resolveChoice, spendHours, startScenario } from './scenario'
import { doAction } from './actions'
import { fightTurn } from './combat'
import { createRng } from './rng'
import type { GameState } from './types'
import {
  baseState, choiceDef, clearedAll, fixtureContent as content, inFight, inRest, inScenario, killDef, makeSurvivor,
  protectDef, reachDef, spareDef, surviveDef, weakEnemy, withNoMetSurvivors, brutalEnemy,
} from '../test/fixtures'

test('surviving the clock and its Final Wave clears a survive scenario and opens the ranking', () => {
  let s = inScenario(baseState(), surviveDef({ hours: 2 }));
  s = checkScenarioClock(spendHours(s, 2), createRng(1), content).state;
  s = { ...s, fight: { ...s.fight!, enemy: { ...s.fight!.enemy, hp: 1 } } };
  const r = fightTurn(s, { kind: 'attack' }, createRng(1), content).state;
  expect(r.phase.kind).toBe('rest');
  expect(r.rankingOpen).toBe(true);
});
test('running out of hours on a kill scenario kills the player', () => {
  let s = inScenario(baseState(), killDef({ hours: 2, count: 3 }));
  s = spendHours(s, 2);
  expect(checkScenarioClock(s, createRng(1), content).state.phase.kind).toBe('dead');
});
test('the clock waits for an open fight', () => {
  let s = inFight(inScenario(baseState(), killDef({ hours: 1, count: 3 })), weakEnemy());
  s = spendHours(s, 1);
  expect(checkScenarioClock(s, createRng(1), content).state.phase.kind).toBe('scenario');
});
test('a choice with no living met survivors falls back', () => {
  const s = inScenario(withNoMetSurvivors(baseState()), choiceDef());
  const r = resolveChoice(s, 'kill-one', null, createRng(1), content);
  expect(r.state.pendingChoice).toBeNull();
  expect(r.events.some(e => /fallback-marker/.test(e.text))).toBe(true);
});
test('failing a sub-scenario costs nothing but the reward', () => {
  let s: GameState = { ...baseState(), subScenario: { defId: content.subScenarios[0].id, hoursLeft: 1, progress: 0 } };
  const coins = s.player.coins;
  s = checkScenarioClock(spendHours(s, 1), createRng(1), content).state;
  expect(s.subScenario).toBeNull();
  expect(s.phase.kind).not.toBe('dead');
  expect(s.player.coins).toBe(coins);
});
test('after the last scenario the game stays in rest', () => {
  const s = inRest(clearedAll(baseState(), content), 0);
  const r = checkScenarioClock(s, createRng(1), content).state;
  expect(r.phase).toMatchObject({ kind: 'rest', nextScenarioId: null });
});

test('spending hours moves the scenario clock, the sub-scenario clock and the in-game hour', () => {
  const s = { ...inScenario(baseState(), surviveDef({ hours: 10 })), subScenario: { defId: 'x', hoursLeft: 5, progress: 0 } };
  const r = spendHours(s, 3);
  expect(r.phase).toMatchObject({ hoursLeft: 7 });
  expect(r.subScenario).toMatchObject({ hoursLeft: 2 });
  expect(r.inGameHour).toBe(s.inGameHour + 3);
});
test('reaching the kill count clears the scenario before time runs out', () => {
  let s = inScenario(baseState(), killDef({ hours: 10, count: 2 }));
  s = recordProgress(recordProgress(s, 'kill', { enemyTags: ['beast'] }, content), 'kill', { enemyTags: ['beast'] }, content);
  expect(checkScenarioClock(s, createRng(1), content).state.phase.kind).toBe('rest');
});
test('kills only count toward a tagged kill goal when the tag matches', () => {
  const def = killDef({ hours: 10, count: 1 });
  const tagged = { ...def, goal: { kind: 'kill' as const, count: 1, enemyTag: 'monster' } };
  content.scenarios[content.scenarios.findIndex(d => d.id === def.id)] = tagged;
  const s = recordProgress(inScenario(baseState(), tagged), 'kill', { enemyTags: ['beast'] }, content);
  expect(s.phase).toMatchObject({ progress: 0 });
});
test('acting in the target zone clears a reach scenario', () => {
  const s = inScenario(baseState(), reachDef({ hours: 10, zoneId: 'riverside-park' }));
  expect(doAction(s, 'riverside-park', 'rest', createRng(1), content).state.phase.kind).toBe('rest');
});
test('a protect scenario fails when the protected survivor is dead', () => {
  const s = { ...inScenario(baseState(), protectDef({ hours: 10 })), survivors: [makeSurvivor('s-0', { alive: false })] };
  const dead = { ...s, phase: { ...s.phase, protectedSurvivorId: 's-0' } } as typeof s;
  expect(checkScenarioClock(dead, createRng(1), content).state.phase.kind).toBe('dead');
});
test('a protect scenario clears when time runs out with the survivor alive', () => {
  const s = { ...inScenario(baseState(), protectDef({ hours: 1 })), survivors: [makeSurvivor('s-0')] };
  const alive = spendHours({ ...s, phase: { ...s.phase, protectedSurvivorId: 's-0' } } as typeof s, 1);
  expect(checkScenarioClock(alive, createRng(1), content).state.phase.kind).toBe('rest');
});
test('starting a protect scenario picks a met living survivor to protect', () => {
  const s = { ...baseState(), survivors: [makeSurvivor('s-0'), makeSurvivor('s-1', { met: true }), makeSurvivor('s-2', { met: true, alive: false })] };
  const r = startScenario(s, protectDef({ hours: 5 }), createRng(1), content).state;
  expect(r.phase).toMatchObject({ kind: 'scenario', protectedSurvivorId: 's-1' });
});
test('starting a scenario announces it, applies zone changes and opens a choice', () => {
  const def = { ...choiceDef(), zoneChanges: { seal: ['old-market'], danger: { 'glass-towers': 2 } } };
  const r = startScenario(baseState(), def, createRng(1), content);
  expect(r.events[0].text).toContain(def.announcement);
  expect(r.state.zones['old-market'].sealed).toBe(true);
  expect(r.state.zones['glass-towers'].dangerBonus).toBe(2);
  expect(r.state.pendingChoice).toEqual({ source: 'scenario', scenarioId: def.id });
  expect(r.state.phase).toMatchObject({ hoursLeft: def.hours, progress: 0 });
});
test('clearing pays rewards and points and announces the next scenario', () => {
  const def = surviveDef({ hours: 1 });
  let s = inScenario(baseState(), def);
  s = { ...s, player: { ...s.player, kills: s.player.kills + 3 } };
  const r = clearScenario(s, createRng(1), content);
  expect(r.state.player.coins).toBe(20);
  expect(r.state.player.points).toBe(13);
  expect(r.state.clearedScenarioIds).toContain(def.id);
  expect(r.state.phase).toMatchObject({ kind: 'rest', hoursLeft: 24, nextScenarioId: 's01' });
  expect(r.events.some(e => e.text.includes(content.scenarios[0].title))).toBe(true);
});
test('when the rest runs out the next scenario starts', () => {
  const s = inRest(baseState(), 0, 's01');
  const r = checkScenarioClock(s, createRng(1), content).state;
  expect(r.phase).toMatchObject({ kind: 'scenario', scenarioId: 's01', hoursLeft: content.scenarios[0].hours });
});
test('choosing to kill a met survivor kills them and resolves the choice', () => {
  const s = inScenario({ ...baseState(), survivors: [makeSurvivor('s-1', { met: true }), makeSurvivor('s-2')] }, choiceDef());
  const r = resolveChoice(s, 'kill-one', 's-1', createRng(1), content);
  expect(r.state.survivors.find(x => x.id === 's-1')!.alive).toBe(false);
  expect(r.state.survivors.find(x => x.id === 's-2')!.memories).toContain('betrayed');
  expect(r.events.some(e => e.tags?.includes('cruelty'))).toBe(true);
  expect(r.state.phase.kind).toBe('rest');
});
test('a target option needs a valid target while met survivors are alive', () => {
  const s = inScenario({ ...baseState(), survivors: [makeSurvivor('s-1', { met: true })] }, choiceDef());
  const r = resolveChoice(s, 'kill-one', null, createRng(1), content);
  expect(r.state).toEqual(s);
});
test('a fight option starts a scenario fight that clears the choice when won', () => {
  const s = inScenario(baseState(), choiceDef());
  const r = resolveChoice(s, 'fight-it', null, createRng(1), content);
  expect(r.state.fight).toMatchObject({ origin: 'scenario', enemyId: 'feral-hound' });
  const winning = { ...r.state, fight: { ...r.state.fight!, enemy: { ...r.state.fight!.enemy, hp: 1 } } };
  expect(fightTurn(winning, { kind: 'attack' }, createRng(1), content).state.phase.kind).toBe('rest');
});
test('running from a scenario fight puts the choice back', () => {
  const s = inScenario(baseState(), choiceDef());
  const started = resolveChoice(s, 'fight-it', null, createRng(1), content).state;
  const fast = { ...started, player: { ...started.player, stats: { ...started.player.stats, agility: 40 } } };
  let r = fightTurn(fast, { kind: 'run' }, createRng(1), content);
  for (let i = 2; r.result !== 'fled'; i++) r = fightTurn(fast, { kind: 'run' }, createRng(i), content);
  expect(r.state.pendingChoice).toEqual({ source: 'scenario', scenarioId: 'fx-choice' });
});
test('losing a fight kills the player', () => {
  const s = inFight({ ...baseState(), player: { ...baseState().player, hp: 1 } }, brutalEnemy());
  const r = fightTurn(s, { kind: 'attack' }, createRng(9), content);
  expect(r.state.phase).toMatchObject({ kind: 'dead', cause: expect.stringContaining('Test Titan') });
});
test('a hunted kill counts toward the kill goal', () => {
  const s = inFight(inScenario(baseState(), killDef({ hours: 10, count: 5 })), { ...weakEnemy(), hp: 1 }, { enemyId: 'feral-hound' });
  expect(fightTurn(s, { kind: 'attack' }, createRng(1), content).state.phase).toMatchObject({ progress: 1 });
});
test('meeting a sub-scenario goal pays its reward', () => {
  const sub = content.subScenarios.find(d => d.goal.kind === 'reach')!;
  const s = { ...baseState(), subScenario: { defId: sub.id, hoursLeft: 5, progress: 0 } };
  const zoneId = (sub.goal as { zoneId: string }).zoneId;
  const r = checkScenarioClock(recordProgress(s, 'reach', { zoneId }, content), createRng(1), content).state;
  expect(r.subScenario).toBeNull();
  expect(r.player.coins).toBe(s.player.coins + sub.rewards.coins);
});

describe('only some of a group survive', () => {
  const alive = (s: GameState, id: string) => s.survivors.find(v => v.id === id)!.alive;
  const four = () => ['s-0', 's-1', 's-2', 's-3'].map(id => makeSurvivor(id, { met: true }));

  test('the player picks who is spared; every other met survivor dies; strangers are untouched', () => {
    const s = inScenario({ ...baseState(), survivors: [...four(), makeSurvivor('s-9')] }, spareDef(2));
    const r = resolveChoice(s, 'choose', null, createRng(1), content, ['s-1', 's-3']).state;
    expect(['s-0', 's-1', 's-2', 's-3', 's-9'].map(id => alive(r, id))).toEqual([false, true, false, true, true]);
    expect(r.phase.kind).toBe('rest');
  });
  test('picking fewer than allowed spares only those picked', () => {
    const s = inScenario({ ...baseState(), survivors: four() }, spareDef(2));
    const r = resolveChoice(s, 'choose', null, createRng(1), content, ['s-2']).state;
    expect(r.survivors.filter(v => v.alive).map(v => v.id)).toEqual(['s-2']);
  });
  test('picks of strangers, the dead, or beyond the limit do not count', () => {
    const s = inScenario({ ...baseState(), survivors: [...four(), makeSurvivor('s-8', { met: true, alive: false }), makeSurvivor('s-9')] }, spareDef(2));
    const r = resolveChoice(s, 'choose', null, createRng(1), content, ['s-9', 's-8', 's-0', 's-1', 's-2']).state;
    expect(['s-0', 's-1', 's-2', 's-3', 's-9'].map(id => alive(r, id))).toEqual([true, true, false, false, true]);
  });
  test('with fewer met than the count, all met live and the rest of the group is chosen by attitude', () => {
    const survivors = [
      makeSurvivor('s-0', { met: true, attitude: -90 }),
      makeSurvivor('s-1', { attitude: 10 }), makeSurvivor('s-2', { attitude: 80 }), makeSurvivor('s-3', { attitude: -10 }),
    ];
    const s = inScenario({ ...baseState(), survivors }, spareDef(2));
    const r = resolveChoice(s, 'choose', null, createRng(1), content, []).state;
    expect(['s-0', 's-1', 's-2', 's-3'].map(id => alive(r, id))).toEqual([true, false, true, false]);
  });
});
