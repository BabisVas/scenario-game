import { CITY } from '../names'
import type { ScenarioDef } from '../schema'

export const s02: ScenarioDef = {
  id: 's02',
  number: 2,
  title: 'Pest Control',
  announcement: [
    '[Main Scenario #2: Pest Control]',
    '[Objective: Kill 5 beasts.]',
    '[Time limit: 18 hours.]',
    '[Reward: 70 coins. Crowbar.]',
    '[Failure: Death.]',
    '[Clarification: Only creatures classified as beasts are counted. Monsters, spirits and survivors are not beasts, regardless of behavior.]',
  ].join('\n'),
  announcer: `Day two, and look at you, still breathing! Now be useful. ${CITY} has a vermin problem. University Hill has reopened its gates, by the way. The library has not. Please do not knock.`,
  narration: 'Somewhere a dog barks, then stops mid-bark, the way a radio stops when someone pulls the plug.',
  rules: ['Kill 5 beasts.', 'Monsters, spirits and survivors do not count.'],
  twist: 'Only beasts count. University Hill opens its gates.',
  hours: 18,
  goal: { kind: 'kill', count: 5, enemyTag: 'beast' },
  rewards: { coins: 70, itemIds: ['crowbar'] },
  zoneChanges: { open: ['university-hill'] },
  survivorDeathRate: 0.17,
}
