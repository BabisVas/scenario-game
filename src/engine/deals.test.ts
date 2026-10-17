import { runAction } from '../ui/useGame'
import { createRng } from './rng'
import { tradeWithSurvivor } from './survivors'
import { at, baseState, fixtureContent as content, inRest, makeSurvivor, withCoins, withItem } from '../test/fixtures'
import type { GameState } from './types'

const friend = makeSurvivor('s-0', { met: true, attitude: 60, zoneId: 'old-market' })
const calm = (): GameState => ({ ...at(inRest(withCoins(baseState(), 500), 99), 'old-market'), survivors: [friend] })

test('buying from a survivor spends 5 energy and an hour', () => {
  const s = calm()
  const r = runAction(s, { kind: 'trade', survivorId: 's-0', itemId: 'bandage', mode: 'buy' }, createRng(1), content)
  expect(r.state.energy).toBe(s.energy - 5)
  expect(r.state.inGameHour).toBe(s.inGameHour + 1)
})
test('a gift spends 5 energy and an hour', () => {
  const s = withItem(calm(), 'bandage')
  const r = runAction(s, { kind: 'give', survivorId: 's-0', itemId: 'bandage' }, createRng(1), content)
  expect(r.state.energy).toBe(s.energy - 5)
  expect(r.state.inGameHour).toBe(s.inGameHour + 1)
})
test('without the energy, a deal is refused and nothing changes', () => {
  const s = { ...withItem(calm(), 'bandage'), energy: 4 }
  const r = runAction(s, { kind: 'give', survivorId: 's-0', itemId: 'bandage' }, createRng(1), content)
  expect(r.state).toEqual(s)
  expect(r.events[0].text).toMatch(/not enough energy/i)
})
test('a refused deal costs nothing', () => {
  const s = calm()
  const r = runAction(s, { kind: 'trade', survivorId: 's-0', itemId: 'mirror-shard', mode: 'buy' }, createRng(1), content)
  expect(r.state).toEqual(s)
})
test('overcharging gets three quarters of the price, not all of it', () => {
  const s = withItem(calm(), 'fire-axe')
  const r = tradeWithSurvivor(s, 's-0', 'fire-axe', 'overcharge', content, createRng(1))
  expect(r.state.player.coins - s.player.coins).toBe(Math.round(110 * 0.75))
})
test('a day of gifts is bounded by energy: no free coin or interest farm', () => {
  let s: GameState = { ...withItem(calm(), 'painkillers', 300) }
  let given = 0
  for (let i = 0; i < 300; i++) {
    const r = runAction(s, { kind: 'give', survivorId: 's-0', itemId: 'painkillers' }, createRng(i), content)
    if (r.state.energy < s.energy) given++
    s = r.state
  }
  // 100 energy buys at most 20 deals (fewer if a sponsor stops you with a contract offer).
  expect(given).toBeGreaterThan(0)
  expect(given).toBeLessThanOrEqual(20)
  expect(s.inGameHour - calm().inGameHour).toBe(given)
})
