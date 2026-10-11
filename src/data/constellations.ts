import type { ConstellationDef } from './schema'

// First draft. Task 15 grows this to eight.
export const constellations: ConstellationDef[] = [
  {
    id: 'lantern-that-will-not-go-out',
    title: 'The Lantern That Will Not Go Out',
    blurb: 'Adores anyone who stands their ground. Cannot stand a runner.',
    likes: { bravery: 4, loyalty: 2, mercy: 1, cowardice: -4 },
    lines: {
      like: ['Yes! Again! Do that again!', 'Now that is a flame worth watching.', 'Stand there. Just like that.'],
      dislike: ['You ran. I saw you run.', 'The light dims a little.', 'Disappointing. Truly.'],
      sponsor: ['Take this. Buy something sharp.', 'A little fuel for a little fire.', 'Keep burning. Here.'],
      contract: ['Burn for me and I will never let you go dark.', 'Swear to stand your ground, and I will stand behind you.'],
      death: ['Even the brightest wick runs out.', 'I will remember the light. Not the end.', 'You never once ran. Good.'],
    },
    contract: { demandTag: 'bravery', stigmaId: 'unquenched-flame', coinsPerScenario: 40 },
  },
  {
    id: 'smile-behind-the-velvet-knife',
    title: 'The Smile Behind the Velvet Knife',
    blurb: 'Loves a clever trick and a little cruelty. Finds mercy boring.',
    likes: { cunning: 4, cruelty: 2, style: 2, mercy: -2, loyalty: -1 },
    lines: {
      like: ['Oh, that was wicked. Delicious.', 'Clever, clever, clever.', 'I did not see that coming. I love that.'],
      dislike: ['How very... wholesome.', 'Yawn.', 'You could have been so much more interesting.'],
      sponsor: ['A little something for a little schemer.', 'Spend it badly, darling.', 'Coins for the clever.'],
      contract: ['Let us make an arrangement, you and I.', 'Be clever for me, and I will make you rich.'],
      death: ['Pity. You were almost fun.', 'Outplayed, at last.', 'I will find another clever one. I always do.'],
    },
    contract: { demandTag: 'cunning', stigmaId: 'velvet-exit', coinsPerScenario: 40 },
  },
]
