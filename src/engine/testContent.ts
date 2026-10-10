// Minimal content fixture for engine tests that predate the real content.

import type { Content } from '../data/schema'

export const testContent: Content = {
  backgrounds: [
    { id: 'courier', name: 'Courier', blurb: 'Fast on foot.', statBonus: 'agility', startingItemId: 'bike-chain' },
  ],
  scenarios: [
    {
      id: 'test-s01',
      number: 1,
      title: 'Test',
      announcement: 'TEST ANNOUNCEMENT',
      rules: [],
      twist: '',
      hours: 12,
      rewards: { coins: 10 },
      survivorDeathRate: 0.1,
    },
  ],
}
