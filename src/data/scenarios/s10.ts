import type { ScenarioDef } from '../schema'

export const s10: ScenarioDef = {
  id: 's10',
  number: 10,
  title: 'Curtain Call',
  announcement: [
    '[Main Scenario #10: Curtain Call]',
    '[Objective: Stay alive for 36 hours.]',
    '[Time limit: 36 hours.]',
    '[Reward: 400 coins. Encore Ticket.]',
    '[Failure: Death.]',
    '[Notice: All zones are now more dangerous. This is intentional.]',
    '[When the time limit ends, one final challenger will arrive.]',
  ].join('\n'),
  announcer: 'Ladies, gentlemen, survivors: the finale! I will be joining you in person this time. Well. Someone will. I have an understudy for everything.',
  narration: 'The city lights its own windows one by one, like an audience settling in.',
  rules: ['Stay alive for 36 hours.', 'When the time is up, a final challenger arrives. It must be beaten.'],
  twist: 'The finale. Every zone grows more dangerous.',
  hours: 36,
  goal: { kind: 'survive' },
  rewards: { coins: 400, itemIds: ['encore-ticket'] },
  zoneChanges: {
    danger: {
      'old-market': 1,
      'riverside-park': 1,
      'glass-towers': 1,
      'university-hill': 1,
      'clocktower-square': 1,
      'harbor-cranes': 1,
      'the-bowl': 1,
      'subway-tunnels': 1,
    },
  },
  survivorDeathRate: 0.35,
  finalWave: 'the-understudy',
}
