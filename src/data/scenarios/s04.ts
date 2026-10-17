import type { ScenarioDef } from '../schema'

export const s04: ScenarioDef = {
  id: 's04',
  number: 4,
  title: 'The Toll Bridge',
  announcement: [
    '[Main Scenario #4: The Toll Bridge]',
    '[Objective: Cross the bridge.]',
    '[Time limit: 8 hours.]',
    '[Reward: 110 coins.]',
    '[Failure: Death.]',
    '[Toll: One life, or 40 coins. The bridge accepts either. The bridge prefers the first.]',
  ].join('\n'),
  announcer:
    "A bridge! And a toll-keeper! Isn't this traditional? The keeper is a stickler for rules, so read them twice. Then read them a third time, slowly, out loud.",
  narration:
    'The toll-keeper holds out a hand that is mostly fingers. "One of you," it says, "or the fare. I do not haggle. I have tried. It ended badly for the haggler."',
  rules: ['Cross the bridge: pay with a life, pay 40 coins, or beat the keeper.'],
  twist: 'A toll is due. One life, or 40 coins.',
  hours: 8,
  goal: {
    kind: 'choice',
    prompt: 'The bridge eats one. Feed it, or pay it yourself.',
    fallbackOptionId: 'pay-toll',
    options: [
      { id: 'push', label: 'Push someone you know', tags: ['cruelty', 'cunning'], target: 'met-survivor', outcome: { kill: true } },
      { id: 'fight-keeper', label: 'Fight the toll-keeper', tags: ['bravery', 'style'], outcome: { fight: 'toll-keeper' } },
      { id: 'pay-toll', label: 'Pay the fare (40 coins)', tags: ['mercy'], outcome: { coins: -40 } },
    ],
  },
  rewards: { coins: 110 },
  survivorDeathRate: 0.22,
}
