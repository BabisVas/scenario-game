import type { Background } from './schema'

export const backgrounds: Background[] = [
  {
    id: 'line-cook',
    name: 'Line Cook',
    blurb: 'Twelve-hour shifts, burns up both arms, and a knife hand that never shakes.',
    statBonus: 'strength',
    startingItemId: 'kitchen-knife',
  },
  {
    id: 'courier',
    name: 'Courier',
    blurb: 'You know every shortcut in the city and you have never once been on time by accident.',
    statBonus: 'agility',
    startingItemId: 'bike-chain',
  },
  {
    id: 'night-guard',
    name: 'Night Guard',
    blurb: 'Paid to stand still and stay awake. Turns out you are very hard to knock down.',
    statBonus: 'endurance',
    startingItemId: 'padded-jacket',
  },
  {
    id: 'night-nurse',
    name: 'Night Nurse',
    blurb: 'Calm when everyone else is screaming. You brought bandages to the end of the world.',
    statBonus: 'spirit',
    startingItemId: 'bandage',
  },
]
