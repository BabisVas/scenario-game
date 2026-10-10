import type { SkillDef } from './schema'

export const skills: SkillDef[] = [
  { id: 'quick-strike', name: 'Quick Strike', blurb: 'Hit first, hit twice, ask later.', kind: 'attack', power: 6, cooldown: 2 },
  { id: 'heavy-blow', name: 'Heavy Blow', blurb: 'Everything you have, in one swing.', kind: 'attack', power: 12, cooldown: 3 },
  { id: 'second-wind', name: 'Second Wind', blurb: 'Not yet. Not today.', kind: 'heal', power: 25, cooldown: 4 },
  { id: 'steady-breath', name: 'Steady Breath', blurb: 'In for four, out for four. The shaking stops.', kind: 'heal', power: 12, cooldown: 2 },
  { id: 'iron-skin', name: 'Iron Skin', blurb: 'Brace. Let it come.', kind: 'buff', power: 4, cooldown: 4 },
  { id: 'vanishing-step', name: 'Vanishing Step', blurb: 'One step sideways and you are somewhere else.', kind: 'escape', power: 0.3, cooldown: 5 },
]
