import type { ScenarioDef } from '../schema'

export const s03: ScenarioDef = {
  id: 's03',
  number: 3,
  title: 'The Long Walk',
  announcement: [
    '[Main Scenario #3: The Long Walk]',
    '[Objective: Reach the Harbor Cranes.]',
    '[Time limit: 6 hours.]',
    '[Reward: 90 coins. Skill: Second Wind.]',
    '[Failure: Death.]',
    '[Notice: The Old Market is closed. Anyone inside will be relocated. Gently, where possible.]',
  ].join('\n'),
  announcer:
    'Everyone out of the market! Renovations. The harbor is lovely this time of year. The tunnels are the fastest way there, if you are in a hurry to be eaten.',
  narration: "The market's tarps snap shut like eyelids. The stalls stand empty, though one of them, you could swear, is still warm.",
  rules: ['Reach the Harbor Cranes. Arriving is what counts.', 'Every step of the way can be ambushed.'],
  twist: 'The Old Market closes. The harbor is the place to be, and the road there is not safe.',
  hours: 6,
  goal: { kind: 'reach', zoneId: 'harbor-cranes' },
  rewards: { coins: 90, skillId: 'second-wind' },
  zoneChanges: { seal: ['old-market'], danger: { 'subway-tunnels': 1 } },
  survivorDeathRate: 0.2,
}
