import { checkScenarioClock, spendHours } from './scenario'
import { combatantFromEnemy, doAction } from './actions'
import { fightTurn } from './combat'
import { createRng } from './rng'
import type { GameState } from './types'
import { baseState, fixtureContent as content, inScenario, makeSurvivor, protectDef, seqRng, surviveDef } from '../test/fixtures'

/** A survive scenario whose clock has just hit zero. */
function clockOut(over: Partial<Parameters<typeof surviveDef>[0]> = {}): GameState {
  return spendHours(inScenario(baseState(), surviveDef({ hours: 2, ...over })), 2)
}
const winNow = (s: GameState) => ({ ...s, fight: { ...s.fight!, enemy: { ...s.fight!.enemy, hp: 1 } } })

test('when a survive clock hits zero, the Final Wave comes instead of the clear', () => {
  const r = checkScenarioClock(clockOut(), createRng(1), content);
  expect(r.state.phase.kind).toBe('scenario');
  expect(r.state.fight).toMatchObject({ origin: 'final-wave' });
  expect(r.events.some(e => /final wave/i.test(e.text))).toBe(true);
});
test('beating the Final Wave clears the scenario', () => {
  const waved = checkScenarioClock(clockOut(), createRng(1), content).state;
  const r = fightTurn(winNow(waved), { kind: 'attack' }, createRng(1), content).state;
  expect(r.phase.kind).toBe('rest');
  expect(r.fight).toBeNull();
});
test('there is nowhere to run from the Final Wave', () => {
  const waved = checkScenarioClock(clockOut(), createRng(1), content).state;
  const r = fightTurn(waved, { kind: 'run' }, seqRng(0.0), content);
  expect(r.result).toBe('ongoing');
  expect(r.events[0].text).toMatch(/nowhere left to run/i);
  expect(r.state.fight!.round).toBe(waved.fight!.round);
});
test('the Final Wave is the toughest enemy where the player stands, unless the scenario names one', () => {
  const inTunnels = { ...clockOut(), zoneId: 'subway-tunnels' };
  const strongest = content.enemies.filter(e => content.zones.find(z => z.id === 'subway-tunnels')!.enemyIds.includes(e.id)).sort((a, b) => b.hp - a.hp)[0];
  expect(checkScenarioClock(inTunnels, createRng(1), content).state.fight!.enemyId).toBe(strongest.id);
  const named = surviveDef({ hours: 2 });
  content.scenarios[content.scenarios.findIndex(d => d.id === named.id)] = { ...named, finalWave: 'iron-boar' };
  const s = spendHours(inScenario(baseState(), { ...named, finalWave: 'iron-boar' }), 2);
  expect(checkScenarioClock(s, createRng(1), content).state.fight!.enemyId).toBe('iron-boar');
  content.scenarios[content.scenarios.findIndex(d => d.id === named.id)] = named;
});
test('protect scenarios have ambushes too', () => {
  const s = { ...inScenario(baseState(), protectDef({ hours: 20 })), survivors: [makeSurvivor('s-0')] };
  expect(doAction(s, 'old-market', 'rest', seqRng(0.0, 0.0, 0.5), content).state.fight).not.toBeNull();
});
test('the default Final Wave is the toughest enemy where you stand, a step stronger', () => {
  const strongest = content.enemies.filter(e => content.zones.find(z => z.id === 'old-market')!.enemyIds.includes(e.id)).sort((a, b) => b.hp - a.hp)[0];
  expect(checkScenarioClock(clockOut(), createRng(1), content).state.fight!.enemy.maxHp).toBeGreaterThan(strongest.hp);
});

test("a named Final Wave's strength is the scenario's own, wherever the player stands", () => {
  const named = { ...surviveDef({ hours: 2 }), finalWave: 'feral-hound', number: 5 };
  content.scenarios[content.scenarios.findIndex(d => d.id === named.id)] = named;
  const hound = content.enemies.find(e => e.id === 'feral-hound')!;
  const at = (zoneId: string, bonus: number) => {
    const s = spendHours(inScenario({ ...baseState(), zoneId, zones: { ...baseState().zones, [zoneId]: { sealed: false, dangerBonus: bonus } } }, named), 2);
    return checkScenarioClock(s, createRng(1), content).state.fight!.enemy.maxHp;
  };
  // Scenario 5: danger 1 + floor(5 / 3) = 2, the same as fights a scenario arranges.
  expect(at('old-market', 0)).toBe(combatantFromEnemy(hound, 2).maxHp);
  expect(at('subway-tunnels', 4)).toBe(combatantFromEnemy(hound, 2).maxHp);
  content.scenarios[content.scenarios.findIndex(d => d.id === named.id)] = surviveDef({ hours: 2 });
});
