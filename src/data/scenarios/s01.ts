import { CITY } from '../names'
import type { ScenarioDef } from '../schema'

export const s01: ScenarioDef = {
  id: 's01',
  number: 1,
  title: 'First Light',
  announcement: [
    '[Main Scenario #1: First Light]',
    '[Objective: Stay alive for 24 hours.]',
    '[Time limit: 24 hours.]',
    '[Reward: 50 coins. 2 Bandages.]',
    '[Failure: Death.]',
    '[When the time limit ends, one final challenger will arrive. Please remain available.]',
  ].join('\n'),
  announcer: `Good morning, ${CITY}! Your city is a stage now, and every one of you has a part. Small parts, mostly. Do try to be memorable. The forgettable ones tend to go first.`,
  narration: 'The sky has words in it. Everyone in the street is reading them at the same time, lips moving, and nobody is reading them aloud.',
  rules: ['Stay alive for 24 hours.', 'When the time is up, a final challenger arrives. It must be beaten.'],
  twist: 'The first morning. Nobody knows the rules yet.',
  hours: 24,
  goal: { kind: 'survive' },
  rewards: { coins: 50, itemIds: ['bandage', 'bandage'] },
  zoneChanges: { danger: { 'old-market': 1 } },
  survivorDeathRate: 0.15,
  finalWave: 'feral-hound',
}
