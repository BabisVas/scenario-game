import type { SkillDef } from './schema'

// Skills come from scenario rewards, the system shop (price) and training (trainable).
export const skills: SkillDef[] = [
  { id: 'quick-strike', name: 'Quick Strike', blurb: 'Hit first, hit twice, ask later.', kind: 'attack', power: 6, cooldown: 2, price: 40, trainable: true },
  { id: 'heavy-blow', name: 'Heavy Blow', blurb: 'Everything you have, in one swing.', kind: 'attack', power: 12, cooldown: 3, price: 120 },
  { id: 'shoulder-check', name: 'Shoulder Check', blurb: 'Lead with the bone. Doors taught you this.', kind: 'attack', power: 8, cooldown: 2, price: 60, trainable: true },
  { id: 'second-wind', name: 'Second Wind', blurb: 'Not yet. Not today.', kind: 'heal', power: 25, cooldown: 4 },
  { id: 'steady-breath', name: 'Steady Breath', blurb: 'In for four, out for four. The shaking stops.', kind: 'heal', power: 12, cooldown: 2 },
  { id: 'field-dressing', name: 'Field Dressing', blurb: 'Tear, wrap, knot, breathe. Your hands know it better than you do.', kind: 'heal', power: 18, cooldown: 3, price: 70 },
  { id: 'iron-skin', name: 'Iron Skin', blurb: 'Brace. Let it come.', kind: 'buff', power: 4, cooldown: 4 },
  { id: 'brace', name: 'Brace', blurb: 'Feet wide, chin down. Let the city break on you.', kind: 'buff', power: 8, cooldown: 4, price: 80 },
  { id: 'battle-cry', name: 'Battle Cry', blurb: 'Loud enough, and for one moment even the monsters believe you.', kind: 'buff', power: 5, cooldown: 3, trainable: true },
  { id: 'feint', name: 'Feint', blurb: 'Look left. Be right. Something always falls for it.', kind: 'buff', power: 6, cooldown: 3, trainable: true },
  { id: 'vanishing-step', name: 'Vanishing Step', blurb: 'One step sideways and you are somewhere else.', kind: 'escape', power: 0.3, cooldown: 5 },
  { id: 'sprint', name: 'Sprint', blurb: 'Your lungs will forgive you. Eventually.', kind: 'escape', power: 0.2, cooldown: 3, price: 50, trainable: true },
]
