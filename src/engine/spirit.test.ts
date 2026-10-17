import { content } from '../data'
import { doAction } from './actions'
import { fightTurn } from './combat'
import { useConsumable } from './inventory'
import { spiritMultiplier } from './growth'
import { at, baseState, inFight, seqRng, unarmed, weakEnemy, withItem, withSkill } from '../test/fixtures'
import type { GameState } from './types'

const withSpirit = (s: GameState, spirit: number): GameState => ({ ...s, player: { ...s.player, stats: { ...s.player.stats, spirit } } })
const hurt = (s: GameState, hp: number): GameState => ({ ...s, player: { ...s.player, hp } })

test('spirit adds 4% per point above 5, and never takes anything away below it', () => {
  expect(spiritMultiplier(5)).toBe(1)
  expect(spiritMultiplier(10)).toBeCloseTo(1.2)
  expect(spiritMultiplier(3)).toBe(1)
})

test('spirit scales the damage of an attack skill', () => {
  // Quick Strike unarmed: (10 + 6 - 1) × 1.0 = 15; spirit 10 → 18.
  const base = inFight(withSkill(unarmed(baseState()), 'quick-strike'), weakEnemy())
  const plain = fightTurn(base, { kind: 'skill', skillId: 'quick-strike' }, seqRng(0.5), content)
  const spirited = fightTurn(withSpirit(base, 10), { kind: 'skill', skillId: 'quick-strike' }, seqRng(0.5), content)
  expect(plain.state.fight!.enemy.hp).toBe(15)
  expect(spirited.state.fight!.enemy.hp).toBe(12)
})

test('spirit does not change a plain attack', () => {
  const base = inFight(unarmed(baseState()), weakEnemy())
  const r = fightTurn(withSpirit(base, 10), { kind: 'attack' }, seqRng(0.5), content)
  expect(r.state.fight!.enemy.hp).toBe(21)
})

test('spirit scales a heal skill', () => {
  // Second Wind heals 25; spirit 10 → 30.
  const s = withSpirit(inFight(withSkill(hurt(baseState(), 20), 'second-wind'), weakEnemy()), 10)
  const r = fightTurn(s, { kind: 'skill', skillId: 'second-wind' }, seqRng(0.99), content)
  expect(r.events[0].text).toMatch(/\+30 HP/)
})

test('spirit scales consumable healing', () => {
  const s = withSpirit(withItem(hurt(baseState(), 20), 'bandage'), 10)
  expect(useConsumable(s, 'bandage', content).state.player.hp).toBe(50)
})

test('spirit scales resting', () => {
  // Rest heals 30% of 100 = 30; spirit 10 → 36.
  const s = withSpirit(at(hurt(baseState(), 20), 'old-market'), 10)
  const r = doAction({ ...s, phase: { kind: 'rest', nextScenarioId: null, hoursLeft: 99 } }, 'old-market', 'rest', seqRng(0.99), content)
  expect(r.state.player.hp).toBe(56)
})
