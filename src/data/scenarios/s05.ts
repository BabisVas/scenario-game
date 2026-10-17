import { CITY } from '../names'
import type { ScenarioDef } from '../schema'

export const s05: ScenarioDef = {
  id: 's05',
  number: 5,
  title: 'Lights Out',
  announcement: [
    '[Main Scenario #5: Lights Out]',
    '[Objective: Stay alive for 30 hours.]',
    '[Time limit: 30 hours.]',
    '[Reward: 130 coins. Riot Vest.]',
    '[Failure: Death.]',
    '[Advisory: Riverside Park, University Hill and the Glass Towers are now more dangerous. Resting is permitted. Resting is not recommended.]',
    '[When the time limit ends, one final challenger will arrive.]',
  ].join('\n'),
  announcer: `Lights out, ${CITY}! Every light in the city, switched off at once. Well. Almost every light. We missed one. It is underground, and it is moving, and honestly we are curious too.`,
  narration: 'The dark is not empty. It is full, the way a held breath is full.',
  rules: ['Stay alive for 30 hours.', 'When the time is up, a final challenger arrives. It must be beaten.'],
  twist: 'The lights go out across the city. Something is still running underground.',
  hours: 30,
  goal: { kind: 'survive' },
  rewards: { coins: 130, itemIds: ['riot-vest'] },
  zoneChanges: { danger: { 'riverside-park': 1, 'university-hill': 1, 'glass-towers': 1 } },
  survivorDeathRate: 0.25,
  finalWave: 'bell-gargoyle',
}
