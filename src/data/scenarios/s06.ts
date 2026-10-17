import { CITY } from '../names'
import type { ScenarioDef } from '../schema'

export const s06: ScenarioDef = {
  id: 's06',
  number: 6,
  title: 'The Witness',
  announcement: [
    '[Main Scenario #6: The Witness]',
    '[Objective: Keep the witness alive for 24 hours.]',
    '[Time limit: 24 hours.]',
    '[Reward: 150 coins. Skill: Iron Skin.]',
    '[Failure: Death. If the witness dies, so do you.]',
    '[The witness will not move. The witness can survive three attacks. Attacks occur while you are elsewhere.]',
    '[Notice: The Old Market has reopened.]',
  ].join('\n'),
  announcer: `Someone in ${CITY} saw something they were not meant to see. We have decided they live anyway. Keep them breathing! They do not understand what they saw. Please do not explain it to them. You would not get it right.`,
  narration:
    'Your ward sits very still and will not say what they saw. When you ask, they look past you, at a corner of the sky where there is nothing, and keep looking.',
  rules: ['Keep the witness alive for 24 hours.', 'They stay where they are and can survive three attacks.', 'While you are away from them, they may be attacked.'],
  twist: 'Someone saw too much. You will be asked to keep them alive.',
  hours: 24,
  goal: { kind: 'protect' },
  rewards: { coins: 150, skillId: 'iron-skin' },
  zoneChanges: { open: ['old-market'] },
  survivorDeathRate: 0.27,
}
