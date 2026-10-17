// Balance guard: seeded fights between typical players at each stage of the game
// and the enemies they meet then. Attack only, no items: a floor, not a forecast.

import { content } from '.'
import { scenarioFightDanger } from '../engine/scenario'
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
  // Fights a scenario arranges come at its own strength, wherever the player stands.
  const danger = (id: string) => scenarioFightDanger(content.scenarios.find((d) => d.id === id)!.number)
  test.each([
    ['first Final Wave', 'fresh', 'feral-hound', 's01', 0.85],
    ['toll-keeper', 'early', 'toll-keeper', 's04', 0.75],
    ['second Final Wave', 'mid', 'bell-gargoyle', 's05', 0.75],
    ['the swim', 'late', 'salt-eel', 's08', 0.75],
    ['last Final Wave', 'finale', 'the-understudy', 's10', 0.4],
  ] as [string, string, string, string, number][])('%s', (_, profile, enemyId, scenarioId, floor) => {
    expect(winRate(profile, enemyId, danger(scenarioId))).toBeGreaterThanOrEqual(floor)
  })
  test('the named waves are the ones the scenarios name', () => {
    expect(['s01', 's05', 's10'].map((id) => content.scenarios.find((d) => d.id === id)!.finalWave)).toEqual(['feral-hound', 'bell-gargoyle', 'the-understudy'])
  })
})
