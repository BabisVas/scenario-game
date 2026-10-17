import type { ScenarioDef } from '../schema'

export const s09: ScenarioDef = {
  id: 's09',
  number: 9,
  title: 'Clockwork',
  announcement: [
    '[Main Scenario #9: Clockwork]',
    '[Objective: Reach the Bowl.]',
    '[Time limit: 6 hours.]',
    '[Reward: 230 coins. Skill: Vanishing Step.]',
    '[Failure: Death.]',
    '[Notice: Clocktower Square is sealed. Its residents have relocated to the Glass Towers.]',
  ].join('\n'),
  announcer:
    'We stopped the clocktower. It was ticking too loudly. It kept ticking after we stopped it, which we felt was rude, so we sealed it in. Please make your way to the Bowl. Please hurry. We are not sure what it is counting down to.',
  narration: 'You can still hear it from three streets away. The ticks are not evenly spaced anymore.',
  rules: ['Reach the Bowl. Arriving is what counts.', 'Every step of the way can be ambushed.'],
  twist: 'The clocktower will not stop ticking. Be ready to move fast.',
  hours: 6,
  goal: { kind: 'reach', zoneId: 'the-bowl' },
  rewards: { coins: 230, skillId: 'vanishing-step' },
  zoneChanges: { seal: ['clocktower-square'], danger: { 'glass-towers': 1 } },
  survivorDeathRate: 0.33,
}
