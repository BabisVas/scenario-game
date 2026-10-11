import type { AttributeDef } from './schema'

// Starter set. Task 15 grows this to sixteen.
export const attributes: AttributeDef[] = [
  {
    id: 'stubborn',
    name: 'Stubborn',
    blurb: 'You do not fall over. You have simply never agreed to.',
    rarity: 'common',
    effect: { kind: 'stat', stat: 'endurance', amount: 2 },
    tags: ['bravery'],
    backgroundWeights: { 'night-guard': 3 },
  },
  {
    id: 'loose-change',
    name: 'Loose Change',
    blurb: 'Coins find their way into your pockets. Nobody knows how.',
    rarity: 'common',
    effect: { kind: 'coins', percent: 25 },
    tags: ['greed'],
    backgroundWeights: { courier: 2 },
  },
  {
    id: 'night-shift-hands',
    name: 'Night-Shift Hands',
    blurb: 'Steady hands, warm bandages, no questions.',
    rarity: 'common',
    effect: { kind: 'healing', percent: 25 },
    tags: ['mercy'],
    backgroundWeights: { 'night-nurse': 3 },
  },
  {
    id: 'first-out-the-door',
    name: 'First Out the Door',
    blurb: 'You always know where the exits are.',
    rarity: 'rare',
    effect: { kind: 'run', bonus: 0.15 },
    tags: ['cowardice', 'cunning'],
    backgroundWeights: { courier: 3 },
  },
  {
    id: 'beast-breaker',
    name: 'Beast Breaker',
    blurb: 'Animals can smell it on you. They are right to be worried.',
    rarity: 'legendary',
    effect: { kind: 'damage-vs', enemyTag: 'beast', percent: 50 },
    tags: ['bravery', 'style'],
    backgroundWeights: { 'line-cook': 2 },
  },
]
