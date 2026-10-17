// Balance guard: seeded fights between typical players at each stage of the game
// and the enemies they meet then. Attack only, no items: a floor, not a forecast.

import { content } from '.'
import { winRate } from '../test/balance'

const zone = (id: string) => content.zones.find((z) => z.id === id)!

/** [profile, zone, danger there at that stage, the least any of its enemies may be won]. */
const STAGES: [string, string, number, number][] = [
  ['fresh', 'old-market', 2, 0.85],
  ['fresh', 'riverside-park', 2, 0.6],
  ['fresh', 'glass-towers', 2, 0.6],
  ['fresh', 'university-hill', 2, 0.6],
  ['early', 'harbor-cranes', 3, 0.6],
  ['early', 'old-market', 2, 0.95],
  ['mid', 'harbor-cranes', 3, 0.6],
  ['mid', 'clocktower-square', 3, 0.6],
  ['mid', 'subway-tunnels', 4, 0.5],
  ['mid', 'riverside-park', 3, 0.75],
  ['late', 'the-bowl', 4, 0.6],
  ['late', 'glass-towers', 4, 0.75],
  ['finale', 'subway-tunnels', 7, 0.4],
  ['finale', 'the-bowl', 5, 0.6],
]

describe('each stage of the game can win the fights it meets', () => {
  test.each(STAGES)('%s player in %s at danger %i', (profile, zoneId, danger, floor) => {
    for (const enemyId of zone(zoneId).enemyIds) {
      expect({ enemyId, win: winRate(profile, enemyId, danger) >= floor }).toEqual({ enemyId, win: true })
    }
  })
})

describe('the named fights are fair for when they come', () => {
  test.each([
    ['first Final Wave', 'fresh', 'feral-hound', 2, 0.85],
    ['toll-keeper', 'early', 'toll-keeper', 2, 0.75],
    ['second Final Wave', 'mid', 'bell-gargoyle', 3, 0.5],
    ['the swim', 'late', 'salt-eel', 3, 0.75],
    ['last Final Wave', 'finale', 'the-understudy', 4, 0.4],
  ] as [string, string, string, number, number][])('%s', (_, profile, enemyId, danger, floor) => {
    expect(winRate(profile, enemyId, danger)).toBeGreaterThanOrEqual(floor)
  })
})
