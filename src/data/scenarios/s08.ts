import { CITY } from '../names'
import type { ScenarioDef } from '../schema'

export const s08: ScenarioDef = {
  id: 's08',
  number: 8,
  title: 'Lifeboat',
  announcement: [
    '[Main Scenario #8: Lifeboat]',
    '[Objective: Leave the harbor before it floods.]',
    '[Time limit: 10 hours.]',
    '[Reward: 200 coins.]',
    '[Failure: Death.]',
    '[Boat capacity: you, and two others.]',
    '[Notice: The Harbor Cranes are sealed. The tunnels are filling.]',
  ].join('\n'),
  announcer: `The water is coming, ${CITY}! We have gathered a few of you around a lovely little boat. It seats three. We checked. We checked twice. Do the math together, it's a bonding exercise.`,
  narration:
    'The water is at your ankles and climbing. The boat sits low and patient. Behind you, the people the scenario gathered are very quiet, because they can count too.',
  rules: ['Three seats. You choose who takes them.', 'Everyone in the group who does not board drowns.'],
  twist: 'The water rises. Not everyone will fit.',
  hours: 10,
  goal: {
    kind: 'choice',
    prompt: 'Three seats. Choose who takes them.',
    fallbackOptionId: 'swim',
    options: [
      { id: 'choose-boarders', label: 'Choose who boards with you', tags: ['loyalty', 'cunning'], outcome: { spareCount: 2 } },
      {
        id: 'load-the-crates',
        label: 'Load the reward crates (+150 coins)',
        tags: ['greed', 'cruelty'],
        outcome: {
          spareCount: 0,
          coins: 150,
          cityAttitude: -25,
          announce: `Attention, ${CITY}! Our survivor of the hour has traded a boatful of neighbors for a stack of crates. Everyone heard that? Good. Wave, everyone. Not too close.`,
        },
      },
      { id: 'swim', label: 'Give up your seat and swim', tags: ['bravery', 'mercy'], outcome: { spareCount: 3, fight: 'salt-eel' } },
    ],
  },
  rewards: { coins: 200 },
  zoneChanges: { seal: ['harbor-cranes'], danger: { 'subway-tunnels': 2 } },
  survivorDeathRate: 0.32,
}
