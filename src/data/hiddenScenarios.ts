import type { HiddenScenarioDef } from './schema'

// Starter set. Task 15 grows this to six.
export const hiddenScenarios: HiddenScenarioDef[] = [
  {
    id: 'the-regular',
    title: 'The Regular',
    announcement:
      'Five naps in the same market stall! The stall has noticed. So have the things living under it. Clear out three of them before they decide you live here.',
    trigger: { kind: 'repeat-action', zoneId: 'old-market', action: 'rest', count: 5 },
    goal: { kind: 'kill', count: 3 },
    hours: 10,
    rewards: { coins: 120, itemIds: ['riot-vest'] },
    rumor: 'They say the market stalls get jealous if you sleep in the same one too often.',
  },
]
