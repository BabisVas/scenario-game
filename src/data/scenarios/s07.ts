import type { ScenarioDef } from '../schema'

export const s07: ScenarioDef = {
  id: 's07',
  number: 7,
  title: 'Hunting Season',
  announcement: [
    '[Main Scenario #7: Hunting Season]',
    '[Objective: Kill 6 monsters.]',
    '[Time limit: 20 hours.]',
    '[Reward: 170 coins. Arena Gauntlets.]',
    '[Failure: Death.]',
    '[Notice: The Bowl is open. Seating is unassigned.]',
  ].join('\n'),
  announcer:
    'The Bowl is open! Our dear old stadium, packed with champions who have been warming up for a very long time. Monsters anywhere count. Monsters in the Bowl count the same, but they look so much better on camera.',
  narration: 'The scoreboard flickers when you look at it. For a moment the numbers make a word, and then they are numbers again.',
  rules: ['Kill 6 monsters, anywhere.', 'Beasts, survivors and spirits that are not monsters do not count.'],
  twist: 'The Bowl opens. Only monsters count.',
  hours: 20,
  goal: { kind: 'kill', count: 6, enemyTag: 'monster' },
  rewards: { coins: 170, itemIds: ['arena-gauntlets'] },
  zoneChanges: { open: ['the-bowl'] },
  survivorDeathRate: 0.28,
}
