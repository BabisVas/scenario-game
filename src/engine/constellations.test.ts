import { deathReactions, initConstellations, onScenarioCleared, reactTo, resolveContract } from './constellations'
import { fightTurn } from './combat'
import { killPlayer } from './death'
import { createRng } from './rng'
import type { GameState } from './types'
import { content } from '../data'
import {
  baseState, braveryLover, contentWith, inFight, weakEnemy, withContract, withInterest, withStigma,
} from '../test/fixtures'

const interest = (s: GameState, id: string) => s.constellations[id].interest;

test('liked tag raises interest', () => {
  const s = baseState(); const id = braveryLover(content);
  expect(reactTo(s, ['bravery'], createRng(1), content).state.constellations[id].interest).toBeGreaterThan(0);
});
test('reaching 60 interest offers a contract once', () => {
  const s = withInterest(baseState(), braveryLover(content), 58);
  const r = reactTo(s, ['bravery', 'bravery'], createRng(1), content).state;
  expect(r.pendingChoice).toEqual({ source: 'contract', constellationId: braveryLover(content) });
  const again = reactTo({ ...r, pendingChoice: null }, ['bravery'], createRng(1), content).state;
  expect(again.pendingChoice).toBeNull();
});
test('an unmet demand seals the stigma at scenario clear; the contract holds', () => {
  const s = withStigma(baseState(), braveryLover(content));
  const r = onScenarioCleared(s, content).state;
  expect(r.constellations[braveryLover(content)].contract).toBe('active');
  expect(r.player.stigma!.sealed).toBe(true);
});
test('death reactions come only from interested constellations, max 3', () => {
  const s = withInterest(withInterest(baseState(), 'a', 50), 'b', 5);
  const ev = deathReactions(s, createRng(1), contentWith(['a', 'b']));
  expect(ev).toHaveLength(1);
});

test('death reactions stop at 3, most interested first', () => {
  let s = baseState();
  const ids = ['a', 'b', 'c', 'd'];
  [30, -90, 50, 40].forEach((n, i) => { s = withInterest(s, ids[i], n); });
  const ev = deathReactions(s, createRng(1), contentWith(ids));
  expect(ev.map(e => e.text.match(/«Title (\w)»/)![1])).toEqual(['b', 'c', 'd']);
});
test('every constellation starts at zero interest with no contract', () => {
  const all = initConstellations(content);
  expect(Object.keys(all).sort()).toEqual(content.constellations.map(c => c.id).sort());
  expect(Object.values(all).every(c => c.interest === 0 && c.contract === 'none')).toBe(true);
  expect(baseState().constellations).toEqual(all);
});
test('interest adds up the likes of every tag and is clamped to 100', () => {
  const id = braveryLover(content);
  const likes = content.constellations.find(c => c.id === id)!.likes.bravery!;
  expect(interest(reactTo(baseState(), ['bravery', 'bravery'], createRng(1), content).state, id)).toBe(2 * likes);
  expect(interest(reactTo(withInterest(baseState(), id, 99), ['bravery'], createRng(1), content).state, id)).toBe(100);
});
test('a disliked tag lowers interest, and crossing into hostility is announced once', () => {
  const id = braveryLover(content);
  const s = withInterest(baseState(), id, -38);
  const r = reactTo(s, ['cowardice'], createRng(1), content);
  expect(interest(r.state, id)).toBeLessThanOrEqual(-40);
  expect(r.events.filter(e => e.kind === 'constellation' && /turns against you/i.test(e.text))).toHaveLength(1);
  const again = reactTo(r.state, ['cowardice'], createRng(1), content);
  expect(again.events.filter(e => /turns against you/i.test(e.text))).toHaveLength(0);
});
test('a contract offer never overwrites a pending scenario choice', () => {
  const s = { ...withInterest(baseState(), braveryLover(content), 58), pendingChoice: { source: 'scenario' as const, scenarioId: 's01' } };
  const r = reactTo(s, ['bravery'], createRng(1), content).state;
  expect(r.pendingChoice).toEqual({ source: 'scenario', scenarioId: 's01' });
  expect(r.constellations[braveryLover(content)].contract).toBe('none');
});
test('constellation lines name the constellation by its title', () => {
  let seen = 0;
  for (let seed = 0; seed < 30; seed++) {
    const ev = reactTo(baseState(), ['bravery'], createRng(seed), content).events.filter(e => e.kind === 'constellation');
    for (const e of ev) { seen++; expect(content.constellations.some(c => e.text.startsWith(`The constellation «${c.title}» `))).toBe(true); expect(e.text).toMatch(/: ".+"$/); }
  }
  expect(seen).toBeGreaterThan(0);
});
test('accepting a contract activates it and lends its stigma', () => {
  const id = braveryLover(content);
  const s = { ...withContract(baseState(), id, { contract: 'offered' }), pendingChoice: { source: 'contract' as const, constellationId: id } };
  const r = resolveContract(s, true, content).state;
  expect(r.constellations[id].contract).toBe('active');
  expect(r.player.stigma).toMatchObject({ stigmaId: content.constellations.find(c => c.id === id)!.contract.stigmaId, constellationId: id, level: 1, sealed: false });
  expect(r.player.skills).toEqual(s.player.skills);
  expect(r.pendingChoice).toBeNull();
});
test('declining a contract costs 10 interest', () => {
  const id = braveryLover(content);
  const s = { ...withContract(withInterest(baseState(), id, 60), id, { contract: 'offered' }), pendingChoice: { source: 'contract' as const, constellationId: id } };
  const r = resolveContract(s, false, content).state;
  expect(r.constellations[id]).toMatchObject({ contract: 'declined', interest: 50 });
});
test('meeting the demand pays the contract at scenario clear and resets the flag', () => {
  const id = braveryLover(content);
  const s = withContract(baseState(), id);
  const met = reactTo(s, ['bravery'], createRng(1), content).state;
  expect(met.constellations[id].demandMetThisScenario).toBe(true);
  const r = onScenarioCleared(met, content).state;
  expect(r.player.coins).toBe(met.player.coins + content.constellations.find(c => c.id === id)!.contract.coinsPerScenario);
  expect(r.constellations[id]).toMatchObject({ contract: 'active', demandMetThisScenario: false });
});
test('winning a fight reaches the constellations', () => {
  const id = braveryLover(content);
  // a worthy enemy (at least as strong as you) on its last legs: a brave win
  const s = inFight(baseState(), { ...weakEnemy(), hp: 1, maxHp: 400 });
  expect(interest(fightTurn(s, { kind: 'attack' }, createRng(1), content).state, id)).toBeGreaterThan(0);
});
test('dying brings last words from interested constellations', () => {
  const s = withInterest(baseState(), braveryLover(content), 70);
  const r = killPlayer(s, 'x', content, createRng(1));
  expect(r.events.some(e => e.kind === 'constellation')).toBe(true);
});
