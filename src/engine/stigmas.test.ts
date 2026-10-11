import { onScenarioCleared, reactTo, resolveContract } from './constellations'
import { fightTurn } from './combat'
import { createRng } from './rng'
import type { GameState } from './types'
import { content } from '../data'
import { baseState, inFight, seqRng, unarmed, weakEnemy, withSkill, withStigma } from '../test/fixtures'

const [first, second] = content.constellations;
const offer = (s: GameState, id: string): GameState => ({
  ...s,
  constellations: { ...s.constellations, [id]: { ...s.constellations[id], contract: 'offered' } },
  pendingChoice: { source: 'contract', constellationId: id },
});

test('accepting a second contract removes the first stigma and cools the old sponsor', () => {
  const s = { ...withStigma(baseState(), first.id), constellations: { ...withStigma(baseState(), first.id).constellations, [first.id]: { interest: 70, contract: 'active' as const, demandMetThisScenario: false } } };
  const r = resolveContract(offer(s, second.id), true, content);
  expect(r.state.player.stigma).toMatchObject({ stigmaId: second.contract.stigmaId, constellationId: second.id });
  expect(r.state.constellations[first.id]).toMatchObject({ contract: 'ended', interest: 40 });
  expect(r.state.constellations[second.id].contract).toBe('active');
  expect(r.events.some(e => e.kind === 'constellation' && e.text.includes(first.title))).toBe(true);
});
test('a sealed stigma cannot be used in a fight', () => {
  const s = inFight(withStigma(baseState(), first.id, { sealed: true }), weakEnemy());
  const r = fightTurn(s, { kind: 'stigma' }, createRng(1), content);
  expect(r.events[0].text).toMatch(/sealed/i);
  expect(r.state.fight!.round).toBe(1);
  expect(r.state.fight!.enemy.hp).toBe(weakEnemy().hp);
});
test('a broken demand seals the stigma; the next clear with the demand kept unseals it and pays', () => {
  const sealed = onScenarioCleared(withStigma(baseState(), first.id), content).state;
  expect(sealed.player.stigma!.sealed).toBe(true);
  const kept = reactTo(sealed, [first.contract.demandTag], createRng(1), content).state;
  const r = onScenarioCleared(kept, content).state;
  expect(r.player.stigma!.sealed).toBe(false);
  expect(r.player.coins).toBe(kept.player.coins + first.contract.coinsPerScenario);
});
test('a stigma has its own fight action, goes on cooldown and counts its uses', () => {
  const s = inFight(withStigma(baseState(), first.id), { ...weakEnemy(), hp: 999, maxHp: 999 });
  const r = fightTurn(s, { kind: 'stigma' }, seqRng(0.5, 0.9), content);
  expect(r.state.player.stigma!.uses).toBe(1);
  expect(Object.keys(r.state.fight!.cooldowns).some(k => k.includes(first.contract.stigmaId))).toBe(true);
});
test('a stigma levels up with use but never past its max level', () => {
  const def = content.stigmas.find(x => x.id === first.contract.stigmaId)!;
  let s = withStigma(baseState(), first.id, { level: def.maxLevel, uses: 5 * def.maxLevel - 1 });
  s = inFight(s, { ...weakEnemy(), hp: 999, maxHp: 999 });
  const r = fightTurn(s, { kind: 'stigma' }, seqRng(0.5, 0.9), content);
  expect(r.state.player.stigma!.level).toBe(def.maxLevel);
  let low = inFight(withStigma(baseState(), first.id, { level: 1, uses: 4 }), { ...weakEnemy(), hp: 999, maxHp: 999 });
  low = fightTurn(low, { kind: 'stigma' }, seqRng(0.5, 0.9), content).state;
  expect(low.player.stigma).toMatchObject({ level: 2, uses: 0 });
});
test('a stigma hits harder than a skill of the same power', () => {
  const stigma = content.stigmas.find(x => x.kind === 'attack')!;
  const owner = content.constellations.find(c => c.contract.stigmaId === stigma.id)!;
  const c = { ...content, skills: [...content.skills, { id: 'twin', name: 'Twin', blurb: '', kind: 'attack' as const, power: stigma.power, cooldown: 1 }] };
  const enemy = { ...weakEnemy(), hp: 999, maxHp: 999 };
  const bySkill = fightTurn(inFight(withSkill(unarmed(baseState()), 'twin'), enemy), { kind: 'skill', skillId: 'twin' }, seqRng(0.5, 0.9), c);
  const byStigma = fightTurn(inFight(withStigma(unarmed(baseState()), owner.id), enemy), { kind: 'stigma' }, seqRng(0.5, 0.9), c);
  expect(byStigma.state.fight!.enemy.hp).toBeLessThan(bySkill.state.fight!.enemy.hp);
});
