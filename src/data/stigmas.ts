import type { StigmaDef } from './schema'

// Starter set: one per constellation. Task 15 grows this to eight.
export const stigmas: StigmaDef[] = [
  {
    id: 'unquenched-flame',
    name: 'Unquenched Flame',
    blurb: 'The Lantern lends you its fire. It does not go out, so neither do you.',
    kind: 'attack',
    power: 14,
    cooldown: 3,
    maxLevel: 5,
  },
  {
    id: 'velvet-exit',
    name: 'Velvet Exit',
    blurb: 'A smile, a bow, and you were never there.',
    kind: 'escape',
    power: 0.45,
    cooldown: 4,
    maxLevel: 5,
  },
]
