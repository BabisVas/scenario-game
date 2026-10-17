import type { StigmaDef } from './schema'

// One per constellation, lent to the survivor it sponsors. Level 5 is the v1 cap.
export const stigmas: StigmaDef[] = [
  {
    id: 'unquenched-flame', name: 'Unquenched Flame', kind: 'attack', power: 14, cooldown: 3, maxLevel: 5,
    blurb: 'A strike that burns hotter the longer you have stood your ground. They say the Lantern was lit by the first person who refused to run, and has been looking for the second ever since.',
  },
  {
    id: 'velvet-exit', name: 'Velvet Exit', kind: 'escape', power: 0.45, cooldown: 4, maxLevel: 5,
    blurb: 'A smile, a bow, and you were never there. The Velvet Knife has left more rooms than anyone has entered.',
  },
  {
    id: 'lullaby-cleaver', name: 'Lullaby Cleaver', kind: 'attack', power: 18, cooldown: 4, maxLevel: 5,
    blurb: 'It hums while it cuts, and the tune is one your mother sang. You do not remember telling anyone that tune.',
  },
  {
    id: 'second-bloom', name: 'Second Bloom', kind: 'heal', power: 30, cooldown: 4, maxLevel: 5,
    blurb: 'Something green closes the wound. Later, a small flower grows on the scar, and it smells like rain.',
  },
  {
    id: 'sunburst-encore', name: 'Sunburst Encore', kind: 'attack', power: 10, cooldown: 2, maxLevel: 5,
    blurb: 'Blinding, gorgeous, and again! The Peacock swallowed a sun once, to see if it could. It is still digesting.',
  },
  {
    id: 'every-door-opens', name: 'Every Door Opens', kind: 'escape', power: 0.6, cooldown: 5, maxLevel: 5,
    blurb: 'Somewhere behind you, a door you never noticed swings open. Do not ask where it leads. It leads away. That is enough.',
  },
  {
    id: 'gilded-ward', name: 'Gilded Ward', kind: 'buff', power: 10, cooldown: 3, maxLevel: 5,
    blurb: 'Gold plating, billed later. The Ledger never forgets a loan. The interest is calculated in a currency you do not have yet.',
  },
  {
    id: 'hold-the-gate', name: 'Hold the Gate', kind: 'buff', power: 14, cooldown: 4, maxLevel: 5,
    blurb: 'Nothing passes. Nothing. Somewhere very high up, something with a collar plants its feet beside yours.',
  },
]
