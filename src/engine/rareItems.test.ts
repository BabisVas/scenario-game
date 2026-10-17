import { onScenarioCleared } from './constellations'
import { fightTurn } from './combat'
import { withCoinBonus } from './attributes'
import { isUsable, sellToShop, useConsumable } from './inventory'
import { maxHp } from './newGame'
import {
  baseState, brutalEnemy, fixtureContent as c, inFight, itemFixture, seqRng, withAttribute, withContract, withItem,
} from '../test/fixtures'
import type { GameState } from './types'

const crown = itemFixture({ id: 'fx-crown', name: 'Fixture Crown', kind: 'rare', power: 0, price: 260, inShop: false, effect: { statPoint: 1 } })
const bell = itemFixture({ id: 'fx-bell', name: 'Fixture Bell', kind: 'rare', power: 0, price: 240, inShop: false, effect: { damage: 40, stun: true } })
const pearl = itemFixture({ id: 'fx-pearl', name: 'Fixture Pearl', kind: 'rare', power: 0, price: 280, inShop: false, effect: { escape: true } })
const tooth = itemFixture({ id: 'fx-tooth', name: 'Fixture Tooth', kind: 'rare', power: 0, price: 600, inShop: false, passive: { coinPercent: 20 } })
const ticket = itemFixture({ id: 'fx-ticket', name: 'Fixture Ticket', kind: 'rare', power: 0, price: 400, inShop: false, effect: { fullHeal: true } })

const qty = (s: GameState, id: string) => s.player.inventory.find((i) => i.itemId === id)?.qty ?? 0
const hurt = (s: GameState, hp: number): GameState => ({ ...s, player: { ...s.player, hp } })
const origin = (s: GameState, o: NonNullable<GameState['fight']>['origin']): GameState => ({ ...s, fight: { ...s.fight!, origin: o } })

describe('a stat relic', () => {
  test('is used up for +1 to the stat the player picks, for good', () => {
    const r = useConsumable(withItem(baseState(), crown.id), crown.id, c, 'strength')
    expect(r.state.player.stats.strength).toBe(baseState().player.stats.strength + 1)
    expect(qty(r.state, crown.id)).toBe(0)
  })
  test('raising endurance also raises current HP with the new maximum', () => {
    const s = withItem(baseState(), crown.id)
    const r = useConsumable(s, crown.id, c, 'endurance')
    expect(r.state.player.hp).toBe(s.player.hp + 10)
    expect(maxHp(r.state.player.stats)).toBe(maxHp(s.player.stats) + 10)
  })
  test('without a chosen stat it is refused and kept', () => {
    const s = withItem(baseState(), crown.id)
    const r = useConsumable(s, crown.id, c)
    expect(r.state).toEqual(s)
    expect(r.events[0].kind).toBe('system')
  })
  test('cannot be used in a fight', () => {
    const s = inFight(withItem(baseState(), crown.id), brutalEnemy())
    const r = fightTurn(s, { kind: 'item', itemId: crown.id }, seqRng(0.5), c)
    expect(qty(r.state, crown.id)).toBe(1)
    expect(r.state.fight!.round).toBe(1)
  })
})

describe('a stunning relic', () => {
  test('deals its damage and the enemy loses its next turn', () => {
    const s = inFight(withItem(baseState(), bell.id), brutalEnemy())
    const r = fightTurn(s, { kind: 'item', itemId: bell.id }, seqRng(0.5), c)
    expect(r.state.fight!.enemy.hp).toBe(brutalEnemy().hp - 40)
    expect(r.state.player.hp).toBe(s.player.hp)
    expect(r.state.fight!.round).toBe(2)
    expect(qty(r.state, bell.id)).toBe(0)
  })
  test('the enemy acts again the round after', () => {
    const s = inFight(withItem(baseState(), bell.id), brutalEnemy())
    const stunned = fightTurn(s, { kind: 'item', itemId: bell.id }, seqRng(0.5), c)
    const next = fightTurn(stunned.state, { kind: 'attack' }, seqRng(0.5), c)
    expect(next.state.player.hp).toBeLessThan(s.player.hp)
  })
})

describe('an escape relic', () => {
  test('always gets you out of an ordinary fight, and is used up', () => {
    const s = inFight(withItem(baseState(), pearl.id), brutalEnemy())
    // 0.999 would fail any normal run.
    const r = fightTurn(s, { kind: 'item', itemId: pearl.id }, seqRng(0.999), c)
    expect(r.result).toBe('fled')
    expect(r.state.fight).toBeNull()
    expect(qty(r.state, pearl.id)).toBe(0)
    expect(r.state.player.hp).toBe(s.player.hp)
  })
  test('does not work on a Final Wave: refused, kept, no turn spent', () => {
    const s = origin(inFight(withItem(baseState(), pearl.id), brutalEnemy()), 'final-wave')
    const r = fightTurn(s, { kind: 'item', itemId: pearl.id }, seqRng(0.5), c)
    expect(r.state).toEqual(s)
    expect(r.result).toBe('ongoing')
  })
  test("does not work on a scenario's own fight: refused, kept, no turn spent", () => {
    const s = origin(inFight(withItem(baseState(), pearl.id), brutalEnemy()), 'scenario')
    const r = fightTurn(s, { kind: 'item', itemId: pearl.id }, seqRng(0.5), c)
    expect(r.state).toEqual(s)
  })
})

describe('a full-heal relic', () => {
  test('heals to full', () => {
    const r = useConsumable(withItem(hurt(baseState(), 5), ticket.id), ticket.id, c)
    expect(r.state.player.hp).toBe(maxHp(baseState().player.stats))
    expect(qty(r.state, ticket.id)).toBe(0)
  })
})

describe('a coin charm', () => {
  test('is never used up: it cannot be used at all', () => {
    expect(isUsable(tooth)).toBe(false)
  })
  test('adds 20% to found coins while carried, on top of an attribute', () => {
    expect(withCoinBonus(withItem(baseState(), tooth.id), c, 100)).toBe(120)
    const both = withAttribute(withItem(baseState(), tooth.id), { kind: 'coins', percent: 25 })
    expect(withCoinBonus(both, c, 100)).toBe(145)
  })
  test('adds 20% to sales', () => {
    const s = withItem(withItem(baseState(), tooth.id), 'riot-vest')
    const plain = sellToShop(withItem(baseState(), 'riot-vest'), 'riot-vest', c)
    const charmed = sellToShop(s, 'riot-vest', c)
    expect(charmed.state.player.coins - s.player.coins).toBe(Math.floor((plain.state.player.coins - baseState().player.coins) * 1.2))
  })
  test("adds 20% to a sponsor's contract pay", () => {
    const def = c.constellations[0]
    const kept = (s: GameState) => withContract(s, def.id, { demandMetThisScenario: true })
    const plain = onScenarioCleared(kept(baseState()), c).state.player.coins - baseState().player.coins
    const s = kept(withItem(baseState(), tooth.id))
    const charmed = onScenarioCleared(s, c).state.player.coins - s.player.coins
    expect(charmed).toBe(Math.floor(plain * 1.2))
  })
})
