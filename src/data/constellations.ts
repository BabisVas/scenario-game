import type { ConstellationDef } from './schema'

// They watch for entertainment and are known by their titles. Each loves one way of acting most.
export const constellations: ConstellationDef[] = [
  {
    id: 'lantern-that-will-not-go-out',
    title: 'The Lantern That Will Not Go Out',
    blurb: 'Loves anyone who stands their ground. Cannot stand a runner.',
    likes: { bravery: 4, loyalty: 2, mercy: 1, cowardice: -4 },
    lines: {
      like: ['Yes! Again! Do that again!', 'There. That is a flame worth watching.', 'You stood your ground. The ground noticed.'],
      dislike: ['You ran. I saw you run.', 'The light dims a little.', 'I expected more heat from you.'],
      sponsor: ['Take this. Buy something sharp.', 'A little fuel for a little fire.', 'Keep burning. Here.'],
      contract: [
        'Stand your ground for me, every scenario, and I will stand behind you.',
        'Burn where I can see you, and you will never burn alone.',
        'One rule: you do not run. Agree, and take my flame.',
      ],
      death: ['Even a good wick runs out.', 'I will remember the light, not the end.', 'You never once ran. Good.'],
    },
    contract: { demandTag: 'bravery', stigmaId: 'unquenched-flame', coinsPerScenario: 40 },
  },
  {
    id: 'smile-behind-the-velvet-knife',
    title: 'The Smile Behind the Velvet Knife',
    blurb: 'Loves a clever trick. Finds mercy boring.',
    likes: { cunning: 4, style: 2, cruelty: 1, mercy: -3 },
    lines: {
      like: ['Oh, that was wicked. Delicious.', 'Clever, clever, clever.', 'I did not see that coming. I adore that.'],
      dislike: ['How very... honest.', 'Yawn.', 'You could have been so much more interesting.'],
      sponsor: ['A little something for a little schemer.', 'Spend it badly, darling.', 'Coins for the clever. Count them twice.'],
      contract: [
        'Let us make an arrangement, you and I.',
        'Be clever for me every scenario, and the exits will find you.',
        'Sign quickly. The fine print is the fun part.',
      ],
      death: ['Pity. You were almost fun.', 'Outplayed, at last. By whom, I wonder.', 'I will find another clever one. I always do.'],
    },
    contract: { demandTag: 'cunning', stigmaId: 'velvet-exit', coinsPerScenario: 40 },
  },
  {
    id: 'butcher-who-hums-lullabies',
    title: 'The Butcher Who Hums Lullabies',
    blurb: 'Loves cruelty, done neatly. Mercy is a waste of a sharp edge.',
    likes: { cruelty: 4, greed: 1, style: 1, mercy: -4 },
    lines: {
      like: ["Shh, shh. It only hurts until it doesn't.", 'Mm. Neat work.', "There's my good apprentice."],
      dislike: ['You let them go? Whatever for?', 'Mercy is a waste of a sharp edge.', 'I hummed for nothing.'],
      sponsor: ['For the knives. Keep them clean.', 'Payment for a job well done. Well. Done.', 'Hush now. Coins.'],
      contract: [
        'Be unkind for me, little one, and I will sing you a cleaver.',
        "One cruelty a scenario, and I'll hum you to sleep.",
        'I only want one thing. You already know what it is.',
      ],
      death: ['Hush. Hush now. There.', "I'll sing the last verse for you.", 'Lights out, little one.'],
    },
    contract: { demandTag: 'cruelty', stigmaId: 'lullaby-cleaver', coinsPerScenario: 50 },
  },
  {
    id: 'gardener-of-second-chances',
    title: 'The Gardener of Second Chances',
    blurb: 'Loves mercy. Takes every death personally.',
    likes: { mercy: 4, loyalty: 2, cruelty: -4 },
    lines: {
      like: ['Something grows where you were kind.', 'Ah. That one will take root.', 'You left them standing. Thank you.'],
      dislike: ['That one will not grow back.', 'Salt in the soil.', 'I had plans for that one.'],
      sponsor: ['Water, light, and coins.', 'For the seeds you planted.', 'Grow. Slowly.'],
      contract: [
        'Spare what you can, each scenario, and I will close your wounds.',
        'Plant mercy for me, and I will make it bloom.',
        'A small promise: keep someone alive.',
      ],
      death: ['Rest now. Something will grow here.', 'I am keeping a cutting of you.', 'Even this is a kind of second chance. Not for you.'],
    },
    contract: { demandTag: 'mercy', stigmaId: 'second-bloom', coinsPerScenario: 40 },
  },
  {
    id: 'peacock-who-swallowed-the-sun',
    title: 'The Peacock Who Swallowed the Sun',
    blurb: 'Loves a show. Hates a dull exit.',
    likes: { style: 4, bravery: 2, cowardice: -4 },
    lines: {
      like: ['Magnificent! Do it again, slower!', 'Look at the angle of that.', 'Encore! Encore!'],
      dislike: ['Darling, at least die beautifully.', 'Dreadful staging.', 'Who taught you to fight, a filing cabinet?'],
      sponsor: ['For your costume budget.', 'Shine, little star.', 'Coins! Throw them about, it looks wonderful.'],
      contract: [
        "Be dazzling for me, every scenario, and I'll lend you the sun.",
        'Win with flair and I will make you blinding.',
        'Sign here, and here, and do a little bow.',
      ],
      death: ['What a finish! What a waste!', 'The lights go down. I hated the ending.', 'Exit, stage nowhere.'],
    },
    contract: { demandTag: 'style', stigmaId: 'sunburst-encore', coinsPerScenario: 45 },
  },
  {
    id: 'saint-of-open-doors',
    title: 'The Saint of Open Doors',
    blurb: 'Loves the ones who get away. Thinks heroes are a waste.',
    likes: { cowardice: 4, cunning: 1, mercy: 1, bravery: -3 },
    lines: {
      like: ['Run, little one. Running is a kind of living.', 'Good. The door was there for you.', 'Alive is the only score that counts.'],
      dislike: ['Heroes are just corpses with good press.', 'Why did you stay?', 'Brave and foolish. The same word, mostly.'],
      sponsor: ['For the road out.', 'Keep your shoes on.', 'A coin for every exit you took.'],
      contract: [
        'Leave when it goes bad, every scenario, and every door will open for you.',
        "Promise me you'll run. I'll keep the doors unlocked.",
        'One demand: live. Run when you must.',
      ],
      death: ['The door was right there.', "Why didn't you run?", 'I left it open for you. I always do.'],
    },
    contract: { demandTag: 'cowardice', stigmaId: 'every-door-opens', coinsPerScenario: 35 },
  },
  {
    id: 'ledger-with-golden-teeth',
    title: 'The Ledger With Golden Teeth',
    blurb: 'Loves profit. Treats generosity as a rounding error.',
    likes: { greed: 4, cunning: 2, mercy: -3 },
    lines: {
      like: ['Every coin remembers who earned it.', 'Profit. Lovely word.', 'Itemize that, would you?'],
      dislike: ['You gave it away? For free?', 'A loss. Noted.', 'Charity is a rounding error.'],
      sponsor: ['An investment. I expect returns.', 'Coins, with interest. Mine.', "Spend wisely, or don't. I am writing it down either way."],
      contract: [
        'Take the larger share, every scenario, and I will gild you.',
        'Sign. Initial. Sign. Lovely.',
        'My terms are simple: keep more than you give.',
      ],
      death: ['Account closed.', 'Debts outstanding: one life.', "I'll take the teeth."],
    },
    contract: { demandTag: 'greed', stigmaId: 'gilded-ward', coinsPerScenario: 60 },
  },
  {
    id: 'dog-that-waits-at-the-gate',
    title: 'The Dog That Waits at the Gate',
    blurb: 'Loves loyalty. Never forgets a broken promise.',
    likes: { loyalty: 4, mercy: 2, bravery: 1, cruelty: -4 },
    lines: {
      like: ['You came back for them. Good.', 'Stay. Good. Stay.', 'There you are.'],
      dislike: ['They trusted you. I will remember.', 'You left someone at the gate.', 'A low growl, from very far up.'],
      sponsor: ['Here. For coming back.', 'A bone. Well. Coins.', 'For the ones who stay.'],
      contract: [
        'Keep your word to me, every scenario, and nothing will get past you.',
        'Be loyal, and I will hold the gate for you.',
        "The fourth time you come back to someone, they stop pretending. Promise me you'll keep coming back.",
      ],
      death: ["I'll wait. I'm good at waiting.", 'Someone should have been at the gate.', "Rest. I'll keep watch."],
    },
    contract: { demandTag: 'loyalty', stigmaId: 'hold-the-gate', coinsPerScenario: 40 },
  },
]
