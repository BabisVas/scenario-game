import type { SubScenarioDef } from './schema'

export const subScenarios: SubScenarioDef[] = [
  {
    id: 'market-pest-control',
    zoneIds: ['old-market'],
    title: 'Pest Control: clear three creatures out of the market stalls',
    goal: { kind: 'kill', count: 3 },
    hours: 8,
    rewards: { coins: 30, itemIds: ['bandage'] },
  },
  {
    id: 'signal-from-the-park',
    zoneIds: ['glass-towers'],
    title: 'A Signal: someone is flashing a mirror from Riverside Park. Get there.',
    goal: { kind: 'reach', zoneId: 'riverside-park' },
    hours: 6,
    rewards: { coins: 25 },
  },
]
