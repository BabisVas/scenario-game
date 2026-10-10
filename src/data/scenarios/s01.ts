import { ANNOUNCER, CITY, SYSTEM } from '../names'
import type { ScenarioDef } from '../schema'

// Working draft. Task 15 replaces it with the reviewed version.
export const s01: ScenarioDef = {
  id: 's01',
  number: 1,
  title: 'First Light',
  announcement:
    `Good morning, ${CITY}! ${ANNOUNCER} here, on behalf of ${SYSTEM}. ` +
    'Starting now, your city is a stage. The first scenario is simple: stay alive for twelve hours. ' +
    'Monsters are out. So is everyone else. Do try to be interesting.',
  rules: ['Stay alive until the clock runs out.', 'Every action spends hours.'],
  twist: 'Nobody knows the rules yet, and everyone is guessing.',
  hours: 12,
  goal: { kind: 'survive' },
  rewards: { coins: 50, itemIds: ['bandage'] },
  survivorDeathRate: 0.15,
}
