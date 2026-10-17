import { doAction } from './actions'
import { buySkill } from './growth'
import { at, baseState, fixtureContent, inRest, seqRng, withCoins, withSkill } from '../test/fixtures'
import type { Content } from '../data/schema'
import type { GameState } from './types'

const c: Content = {
  ...fixtureContent,
  skills: [
    { id: 'fx-sold', name: 'Fixture Sold', blurb: 'b', kind: 'attack', power: 5, cooldown: 2, price: 40 },
    { id: 'fx-taught', name: 'Fixture Taught', blurb: 'b', kind: 'buff', power: 5, cooldown: 2, trainable: true },
    { id: 'fx-reward', name: 'Fixture Reward', blurb: 'b', kind: 'heal', power: 5, cooldown: 2 },
  ],
}
const knows = (s: GameState, id: string) => s.player.skills.some((k) => k.skillId === id)

describe('the shop sells skills', () => {
  test('buying a skill spends its price and teaches it at level 1', () => {
    const r = buySkill(withCoins(baseState(), 50), 'fx-sold', c)
    expect(r.state.player.coins).toBe(10)
    expect(r.state.player.skills).toContainEqual({ skillId: 'fx-sold', level: 1, uses: 0 })
  })
  test('a skill without a price is not for sale', () => {
    const s = withCoins(baseState(), 500)
    expect(buySkill(s, 'fx-reward', c).state).toEqual(s)
  })
  test('not enough coins is refused', () => {
    const s = withCoins(baseState(), 39)
    const r = buySkill(s, 'fx-sold', c)
    expect(r.state).toEqual(s)
    expect(r.events[0].text).toMatch(/not enough coins/i)
  })
  test('a skill you know cannot be bought again', () => {
    const s = withCoins(withSkill(baseState(), 'fx-sold'), 500)
    expect(buySkill(s, 'fx-sold', c).state).toEqual(s)
  })
})

describe('training can teach a skill', () => {
  // Riverside Park offers training. Rolls: no stat breakthrough (0.5), then the teach roll.
  const train = (s: GameState, ...rolls: number[]) => doAction(at(inRest(s, 99), 'riverside-park'), 'riverside-park', 'train', seqRng(...rolls), c)
  test('a lucky session teaches a trainable skill you do not know', () => {
    const r = train(baseState(), 0.5, 0.1, 0.0)
    expect(knows(r.state, 'fx-taught')).toBe(true)
    expect(r.events.some((e) => /fixture taught/i.test(e.text))).toBe(true)
  })
  test('an unlucky session teaches nothing', () => {
    expect(knows(train(baseState(), 0.5, 0.9, 0.0).state, 'fx-taught')).toBe(false)
  })
  test('only trainable skills are taught', () => {
    const r = train(withSkill(baseState(), 'fx-taught'), 0.5, 0.1, 0.0)
    expect(knows(r.state, 'fx-reward')).toBe(false)
    expect(knows(r.state, 'fx-sold')).toBe(false)
  })
})
