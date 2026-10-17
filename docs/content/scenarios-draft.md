# Scenarios Draft (reviewer copy)

> **Babis has asked not to read this file.** It is for his reviewer. Everything player-facing here is a surprise for him.

Draft for Task 15. **Everything here is now in the game** (round 6): the data files were written from this draft with the round-2 review fixes. This file stays the readable copy for review; the data files under `src/data/` are what the game runs.

All player-facing text below follows the abyssal-epic-style skill in Browser Game mode:
- adventure first, with Lovecraft and Poe as spice only;
- second person, present tense;
- short blocks;
- system messages in brackets, exact and enforced.

Placeholders `«CITY»`, `«SYSTEM»` and `«ANNOUNCER»` stay until Babis picks names. Mechanics, numbers and ids are exactly as decided; the rewrite changes words, not rules.

---

## Questions for the reviewer

1. **The Regular is found by almost everyone.** Resting 5 times in the Old Market is cumulative, and the market is where everyone starts and rests through scenario 1 and its rest period. In every playtest it fired before scenario 2, usually during the rest period. Raise the count (8? 10?), make it consecutive rests, or keep it as the "welcome" hidden scenario?
2. **Enemy stats.** The draft had none; they are now set (table under [Enemies](#enemies-15)). A seeded balance test checks five player stages against every zone. The Iron-Bristled Boar and the Paper Golem had to be softened: a fresh survivor could not beat them in danger-2 zones (3% and 0%). Do the stage targets look right to you?
3. **Skill sources.** Eight of the twelve skills had no way to be earned (nothing taught skills except rewards). The system shop now teaches six of them for coins, and training can teach five (15% on a session that does not break through). Prices and which ones are in [Skills](#skills-12). OK?
4. **Survivor greetings** are now in data and written in the style: five voices, four attitude bands, three or four lines each, never the same line twice in a row. See [Survivor greetings](#survivor-greetings). Any voice off?
5. **The Harbor Cranes and the Bowl have no rest action.** A player who clears a scenario there must travel to wait out the rest period. Intended?
6. **Lifeboat swim and fleeing the Salt Eel.** The boarders are chosen before the fight. If you flee the eel, the choice re-opens (the round-1 rule for fights in choices), with the drowned already gone. Fine, or should fleeing be refused in that fight?

---

## What changed in this round (round 6, mechanics, for the reviewer)

All of review round 2 is built, each engine change test-first in its own commit.

- **Rare items** now do what nothing else does (table in [Rare](#rare-6-every-one-has-a-purpose)): a permanent stat point of your choice, a stun, a sure escape, a carried coin charm, a full heal; the Mirror Shard stays a trigger.
- **Spirit** was not used for the player anywhere (only in survivors' own survival odds). It now adds 4% per point above 5 to skill and stigma damage and to all healing.
- **The Mirror Shard** comes only from scavenging Riverside Park and the Subway Tunnels (8% each), never from an enemy. *Mirror, Mirror* fires on **arriving** in the Glass Towers while holding it, not on acting there.
- **Hidden scenarios never bring a Final Wave.** Stated in the engine and tested.
- **The Last Train** pays only if you are in the Subway Tunnels when its clock ends. Survive goals of hidden scenarios can name a required zone.
- **A hidden scenario whose target zone is sealed** does not trigger; its trigger waits and fires on the next qualifying action after the zone reopens.
- **Reach scenarios:** every action can be ambushed (not only arrivals). Scenarios 3 and 9 are 6 hours. A test checks that from every zone open at their start, the target is at least two hours inside the limit.
- **The digest's opening line** says others were less fortunate only if a survivor actually died while you were away; otherwise a neutral line.
- **Danger above 5:** ambushes cap at 50% (from danger 8); enemies keep scaling; the map shows five pips and "+N".
- **Drops:** every enemy drop has an explicit chance (validated).
- **Juno Castellane** is now **Saoirse Delacroix**.
- **Also built:** the shop teaches skills and training can teach them (question 3); items show their lore in the inventory; scenario, hidden and sub-scenario notices, clears and failures, attributes and stigmas all use the bracketed system voice; explore flavor and world rumors moved into data and were restyled.
- **Bugs found in play and fixed:** the zone panel did not follow you after travel; zone names read "the Riverside Park"; the map's breadth-first searches skipped zones (being pushed out of a sealing zone could put you two moves away); goal text read "Kill 5 beast enemies".

---

## The city

### The map

Each line is one move (1 hour, 5 energy). Connections go both ways. The Subway Tunnels touch four zones: they are the fast way everywhere and the most dangerous road in «CITY».

| Zone | Danger | Rest? | Leads to |
| --- | --- | --- | --- |
| Old Market | 1 | yes | Riverside Park, Glass Towers, Subway Tunnels |
| Riverside Park | 2 | yes | Old Market, University Hill, Harbor Cranes · scavenging can turn up the Humming Mirror Shard (8%) |
| Glass Towers | 2 | no | Old Market, Clocktower Square, Subway Tunnels |
| University Hill *(starts sealed)* | 2 | yes | Riverside Park, Clocktower Square |
| Clocktower Square | 3 | yes | Glass Towers, University Hill, The Bowl |
| Harbor Cranes | 3 | no | Riverside Park, Subway Tunnels |
| The Bowl *(starts sealed)* | 4 | no | Clocktower Square, Subway Tunnels |
| Subway Tunnels | 3 | no | Old Market, Glass Towers, Harbor Cranes, The Bowl · scavenging can turn up the Humming Mirror Shard (8%) |

**Moves to each reach target from every other zone**, with the tunnels allowed:

| From | → Harbor Cranes (sc. 3, hidden 6) | → The Bowl (sc. 9, Clocktower sealed) | → Clocktower Square (hidden 3) | → Riverside Park (sub *A Signal*, *Third Rail*, *Bell Ringer*) |
| --- | --- | --- | --- | --- |
| Old Market | 2 | 2 | 2 | 1 |
| Riverside Park | 1 | 3 | 2 | — |
| Glass Towers | 2 | 2 | 1 | 2 |
| University Hill | 2 | 4 | 1 | 1 |
| Clocktower Square | 3 | sealed | — | 2 |
| Harbor Cranes | — | 2 | 3 | 1 |
| The Bowl | 2 | — | 1 | 3 |
| Subway Tunnels | 1 | 1 | 2 | 2 |

Most targets are 2–4 moves away. Every 1-move route to a target is either next door or runs through the tunnels.

### Zone descriptions

- **Old Market.** Tarps, stalls and a thousand places to hide. Half the vendors are still open, out of pure stubbornness. One stall near the fountain has a blanket nobody owns. It is always warm.
- **Riverside Park.** Open lawns, a frozen fountain, and something long moving under the river ice. The ducks left on the first morning and did not say where.
- **Glass Towers.** The office district. Every window reflects you a little late. On every floor, in every tower, exactly one pane is missing.
- **University Hill.** Lecture halls with the lights still on and no one in them. A sign on the library gate says *Returns accepted at all hours*.
- **Clocktower Square.** Cobbles, pigeons, and a clock that is right twice a day, though not the same two times as yesterday. Someone has chalked four small marks by the clock-keeper's door.
- **Harbor Cranes.** Rusted giants over black water. The cranes creak in a rhythm, like breathing, if breathing were slow and made of iron.
- **The Bowl.** The old stadium. The scoreboard has been counting something since the sirens. It is not a score.
- **Subway Tunnels.** The trains stopped. The tunnels did not stay empty. The departure board on the main platform still updates, though it only ever shows one train.

---

## How waiting is never safe

1. **Ambushes.** In survive, protect and reach scenarios, every action (resting included) and every arrival has a 10% + 5% × danger chance of an ambush, never more than 50%.
2. **The Final Wave.** When a survive scenario's clock hits zero, one last enemy comes, and it must be beaten. There is no running. A named wave comes at normal strength. The default (the toughest enemy where you stand) is a step stronger.

| Scenario | Hours | Chance of no ambush while only resting | Final Wave |
| --- | --- | --- | --- |
| 1. First Light | 24 | 26% | **Feral Hound**, normal strength |
| 5. Lights Out | 30 | 10% | **Bell Gargoyle** |
| 10. Curtain Call | 36 | 7.5% | **The Understudy** |

Even if no ambush comes, the Final Wave does.

---

## The ten main scenarios

Difficulty rises through danger bumps, stronger enemies, and a survivor death rate that climbs from 0.15 to 0.35. Goal kinds covered: survive (1, 5, 10), kill (2, 7), reach (3, 9), protect (6) and choice (4, 8).

Each scenario shows its system notice, then «ANNOUNCER», then a line of narration. The mechanics follow underneath.

### 1. First Light *(survive)*

```
[Main Scenario #1: First Light]
[Objective: Stay alive for 24 hours.]
[Time limit: 24 hours.]
[Reward: 50 coins. 2 Bandages.]
[Failure: Death.]
[When the time limit ends, one final challenger will arrive. Please remain available.]
```

> «ANNOUNCER»: "Good morning, «CITY»! Your city is a stage now, and every one of you has a part. Small parts, mostly. Do try to be memorable. The forgettable ones tend to go first."

The sky has words in it. Everyone in the street is reading them at the same time, lips moving, and nobody is reading them aloud.

- **Goal:** survive. **Hours:** 24. **Zone changes:** Old Market danger +1. **Rewards:** 50 coins, 2 Bandages. **Death rate:** 0.15.
- **Final Wave:** Feral Hound (`feral-hound`), normal strength.

```
[Final challenger approaching: Feral Hound.]
```
> It has followed your scent since the sirens. It has been very patient. It is done being patient.

### 2. Pest Control *(kill)*

```
[Main Scenario #2: Pest Control]
[Objective: Kill 5 beasts.]
[Time limit: 18 hours.]
[Reward: 70 coins. Crowbar.]
[Failure: Death.]
[Clarification: Only creatures classified as beasts are counted. Monsters, spirits and survivors are not beasts, regardless of behavior.]
```

> «ANNOUNCER»: "Day two, and look at you, still breathing! Now be useful. «CITY» has a vermin problem. University Hill has reopened its gates, by the way. The library has not. Please do not knock."

Somewhere a dog barks, then stops mid-bark, the way a radio stops when someone pulls the plug.

- **Goal:** kill 5 enemies tagged *beast*. **Hours:** 18. **Zone changes:** open University Hill. **Rewards:** 70 coins, Crowbar. **Death rate:** 0.17.

### 3. The Long Walk *(reach)*

```
[Main Scenario #3: The Long Walk]
[Objective: Reach the Harbor Cranes.]
[Time limit: 6 hours.]
[Reward: 90 coins. Skill: Second Wind.]
[Failure: Death.]
[Notice: The Old Market is closed. Anyone inside will be relocated. Gently, where possible.]
```

> «ANNOUNCER»: "Everyone out of the market! Renovations. The harbor is lovely this time of year. The tunnels are the fastest way there, if you are in a hurry to be eaten."

The market's tarps snap shut like eyelids. The stalls stand empty, though one of them, you could swear, is still warm.

- **Goal:** reach the Harbor Cranes. **Hours:** 6. **Zone changes:** seal Old Market; Subway Tunnels danger +1. **Rewards:** 90 coins, skill *Second Wind*. **Death rate:** 0.20.

### 4. The Toll Bridge *(choice: kill someone to pass)*

```
[Main Scenario #4: The Toll Bridge]
[Objective: Cross the bridge.]
[Time limit: 8 hours.]
[Reward: 110 coins.]
[Failure: Death.]
[Toll: One life, or 40 coins. The bridge accepts either. The bridge prefers the first.]
```

> «ANNOUNCER»: "A bridge! And a toll-keeper! Isn't this traditional? The keeper is a stickler for rules, so read them twice. Then read them a third time, slowly, out loud."

The toll-keeper holds out a hand that is mostly fingers. *"One of you,"* it says, *"or the fare. I do not haggle. I have tried. It ended badly for the haggler."*

- **Goal:** choice. **Hours:** 8. **Rewards:** 110 coins. **Death rate:** 0.22.
- **Prompt:** *The bridge eats one. Feed it, or pay it yourself.*
- **Options:**
  - **Push someone you know** (`push`). Pick a living survivor you have met; they die. Witnesses remember. Tags: cruelty, cunning. Hidden if you have met nobody.
  - **Fight the toll-keeper** (`fight-keeper`). Beat the Toll-Keeper to pass. Tags: bravery, style.
  - **Pay the fare** (`pay-toll`, fallback). −40 coins, never below zero. Tags: **mercy** only.

### 5. Lights Out *(survive)*

```
[Main Scenario #5: Lights Out]
[Objective: Stay alive for 30 hours.]
[Time limit: 30 hours.]
[Reward: 130 coins. Riot Vest.]
[Failure: Death.]
[Advisory: Riverside Park, University Hill and the Glass Towers are now more dangerous. Resting is permitted. Resting is not recommended.]
[When the time limit ends, one final challenger will arrive.]
```

> «ANNOUNCER»: "Lights out, «CITY»! Every light in the city, switched off at once. Well. Almost every light. We missed one. It is underground, and it is moving, and honestly we are curious too."

The dark is not empty. It is full, the way a held breath is full.

- **Goal:** survive. **Hours:** 30. **Zone changes:** danger +1 for Riverside Park, University Hill and Glass Towers. **Rewards:** 130 coins, Riot Vest. **Death rate:** 0.25.
- **Final Wave:** Bell Gargoyle (`bell-gargoyle`).

```
[Final challenger approaching: Bell Gargoyle.]
```
> Something has been ringing in the dark all night. One note, over and over. It has finally found the right door.

### 6. The Witness *(protect)*

```
[Main Scenario #6: The Witness]
[Objective: Keep the witness alive for 24 hours.]
[Time limit: 24 hours.]
[Reward: 150 coins. Skill: Iron Skin.]
[Failure: Death. If the witness dies, so do you.]
[The witness will not move. The witness can survive three attacks. Attacks occur while you are elsewhere.]
[Notice: The Old Market has reopened.]
```

> «ANNOUNCER»: "Someone in «CITY» saw something they were not meant to see. We have decided they live anyway. Keep them breathing! They do not understand what they saw. Please do not explain it to them. You would not get it right."

Your ward sits very still and will not say what they saw. When you ask, they look past you, at a corner of the sky where there is nothing, and keep looking.

- **Goal:** protect: the ward is a met survivor, or anyone if you have met no one. **Hours:** 24. **Ward:** 3 wounds, stays put; 20% chance per action away from them. **Zone changes:** open Old Market. **Rewards:** 150 coins, skill *Iron Skin*. **Death rate:** 0.27.

### 7. Hunting Season *(kill)*

```
[Main Scenario #7: Hunting Season]
[Objective: Kill 6 monsters.]
[Time limit: 20 hours.]
[Reward: 170 coins. Arena Gauntlets.]
[Failure: Death.]
[Notice: The Bowl is open. Seating is unassigned.]
```

> «ANNOUNCER»: "The Bowl is open! Our dear old stadium, packed with champions who have been warming up for a very long time. Monsters anywhere count. Monsters in the Bowl count the same, but they look so much better on camera."

The scoreboard flickers when you look at it. For a moment the numbers make a word, and then they are numbers again.

- **Goal:** kill 6 enemies tagged *monster*. **Hours:** 20. **Zone changes:** open The Bowl (danger 4). **Rewards:** 170 coins, Arena Gauntlets. **Death rate:** 0.28.

### 8. Lifeboat *(choice: only some of a group survive)*

```
[Main Scenario #8: Lifeboat]
[Objective: Leave the harbor before it floods.]
[Time limit: 10 hours.]
[Reward: 200 coins.]
[Failure: Death.]
[Boat capacity: you, and two others.]
[Notice: The Harbor Cranes are sealed. The tunnels are filling.]
```

> «ANNOUNCER»: "The water is coming, «CITY»! We have gathered a few of you around a lovely little boat. It seats three. We checked. We checked twice. Do the math together, it's a bonding exercise."

The water is at your ankles and climbing. The boat sits low and patient. Behind you, the people the scenario gathered are very quiet, because they can count too.

- **Goal:** choice. **Hours:** 10. **Rewards:** 200 coins. **Death rate:** 0.32. **Zone changes:** seal Harbor Cranes; Subway Tunnels danger +2.
- **The group:** when the scenario starts, it gathers 4–6 living survivors where you stand, people you know first, and draws others in if the zone is nearly empty. You see them all by name.
- **Prompt:** *Three seats. Choose who takes them.*
- **Options:**
  - **Choose who boards** (`choose-boarders`). You tick up to 2 of the group; they board with you. The rest of the group drowns. Tags: loyalty, cunning.
  - **Load the reward crates** (`load-the-crates`). The seats go to the system's crates. Nobody from the group boards; they all drown. +150 coins. **News spreads:** every living survivor's attitude toward you −25. Tags: greed, cruelty.
    ```
    «ANNOUNCER»: "Attention, «CITY»! Our survivor of the hour has traded a boatful of neighbors for a stack of crates. Everyone heard that? Good. Wave, everyone. Not too close."
    ```
  - **Give up your seat and swim** (`swim`, fallback). You stay in the water. You tick **3** of the group to take the seats, and the rest of the group drowns. Then you must beat the Salt Eel. Tags: bravery, mercy.

### 9. Clockwork *(reach)*

```
[Main Scenario #9: Clockwork]
[Objective: Reach the Bowl.]
[Time limit: 6 hours.]
[Reward: 230 coins. Skill: Vanishing Step.]
[Failure: Death.]
[Notice: Clocktower Square is sealed. Its residents have relocated to the Glass Towers.]
```

> «ANNOUNCER»: "We stopped the clocktower. It was ticking too loudly. It kept ticking after we stopped it, which we felt was rude, so we sealed it in. Please make your way to the Bowl. Please hurry. We are not sure what it is counting down to."

You can still hear it from three streets away. The ticks are not evenly spaced anymore.

- **Goal:** reach The Bowl. **Hours:** 6. **Zone changes:** seal Clocktower Square; Glass Towers danger +1. **Rewards:** 230 coins, skill *Vanishing Step*. **Death rate:** 0.33.

### 10. Curtain Call *(survive)*

```
[Main Scenario #10: Curtain Call]
[Objective: Stay alive for 36 hours.]
[Time limit: 36 hours.]
[Reward: 400 coins. Encore Ticket.]
[Failure: Death.]
[Notice: All zones are now more dangerous. This is intentional.]
[When the time limit ends, one final challenger will arrive.]
```

> «ANNOUNCER»: "Ladies, gentlemen, survivors: the finale! I will be joining you in person this time. Well. Someone will. I have an understudy for everything."

The city lights its own windows one by one, like an audience settling in.

- **Goal:** survive. **Hours:** 36. **Zone changes:** danger +1 in every zone. **Rewards:** 400 coins, Encore Ticket. **Death rate:** 0.35.
- **Final Wave:** The Understudy (`the-understudy`).

```
[Final challenger approaching: The Understudy.]
```
> It wears the announcer's smile the way a coat hangs on a hook: the right shape, nobody inside. It has been rehearsing. It knows all your lines.

**After scenario 10** the game stays in a rest period:
```
[«SYSTEM» is preparing the next scenario. Please wait. Please continue to survive while you wait.]
```

---

## The eight constellations

They watch for entertainment, and they are known by their titles. Each loves one way of acting most. Lines are shown in the log as: *The constellation «title» (verb): "line"*.

| # | Title | Loves | Hates | Demand → stigma |
| --- | --- | --- | --- | --- |
| 1 | The Lantern That Will Not Go Out | bravery | cowardice | bravery → Unquenched Flame |
| 2 | The Smile Behind the Velvet Knife | cunning | mercy | cunning → Velvet Exit |
| 3 | The Butcher Who Hums Lullabies | cruelty | mercy | cruelty → Lullaby Cleaver |
| 4 | The Gardener of Second Chances | mercy | cruelty | mercy → Second Bloom |
| 5 | The Peacock Who Swallowed the Sun | style | cowardice | style → Sunburst Encore |
| 6 | The Saint of Open Doors | cowardice | bravery | cowardice → Every Door Opens |
| 7 | The Ledger With Golden Teeth | greed | mercy | greed → Gilded Ward |
| 8 | The Dog That Waits at the Gate | loyalty | cruelty | loyalty → Hold the Gate |

### 1. The Lantern That Will Not Go Out

*Loves anyone who stands their ground. Cannot stand a runner.*

- **Likes:** "Yes! Again! Do that again!" · "There. That is a flame worth watching." · "You stood your ground. The ground noticed."
- **Dislikes:** "You ran. I saw you run." · "The light dims a little." · "I expected more heat from you."
- **Sponsors:** "Take this. Buy something sharp." · "A little fuel for a little fire." · "Keep burning. Here."
- **Contract:** "Stand your ground for me, every scenario, and I will stand behind you." · "Burn where I can see you, and you will never burn alone." · "One rule: you do not run. Agree, and take my flame."
- **Your death:** "Even a good wick runs out." · "I will remember the light, not the end." · "You never once ran. Good."

### 2. The Smile Behind the Velvet Knife

*Loves a clever trick. Finds mercy boring.*

- **Likes:** "Oh, that was wicked. Delicious." · "Clever, clever, clever." · "I did not see that coming. I adore that."
- **Dislikes:** "How very... honest." · "Yawn." · "You could have been so much more interesting."
- **Sponsors:** "A little something for a little schemer." · "Spend it badly, darling." · "Coins for the clever. Count them twice."
- **Contract:** "Let us make an arrangement, you and I." · "Be clever for me every scenario, and the exits will find you." · "Sign quickly. The fine print is the fun part."
- **Your death:** "Pity. You were almost fun." · "Outplayed, at last. By whom, I wonder." · "I will find another clever one. I always do."

### 3. The Butcher Who Hums Lullabies

*Loves cruelty, done neatly. Mercy is a waste of a sharp edge.*

- **Likes:** "Shh, shh. It only hurts until it doesn't." · "Mm. Neat work." · "There's my good apprentice."
- **Dislikes:** "You let them go? Whatever for?" · "Mercy is a waste of a sharp edge." · "I hummed for nothing."
- **Sponsors:** "For the knives. Keep them clean." · "Payment for a job well done. Well. Done." · "Hush now. Coins."
- **Contract:** "Be unkind for me, little one, and I will sing you a cleaver." · "One cruelty a scenario, and I'll hum you to sleep." · "I only want one thing. You already know what it is."
- **Your death:** "Hush. Hush now. There." · "I'll sing the last verse for you." · "Lights out, little one."

### 4. The Gardener of Second Chances

*Loves mercy. Takes every death personally.*

- **Likes:** "Something grows where you were kind." · "Ah. That one will take root." · "You left them standing. Thank you."
- **Dislikes:** "That one will not grow back." · "Salt in the soil." · "I had plans for that one."
- **Sponsors:** "Water, light, and coins." · "For the seeds you planted." · "Grow. Slowly."
- **Contract:** "Spare what you can, each scenario, and I will close your wounds." · "Plant mercy for me, and I will make it bloom." · "A small promise: keep someone alive."
- **Your death:** "Rest now. Something will grow here." · "I am keeping a cutting of you." · "Even this is a kind of second chance. Not for you."

### 5. The Peacock Who Swallowed the Sun

*Loves a show. Hates a dull exit.*

- **Likes:** "Magnificent! Do it again, slower!" · "Look at the angle of that." · "Encore! Encore!"
- **Dislikes:** "Darling, at least die beautifully." · "Dreadful staging." · "Who taught you to fight, a filing cabinet?"
- **Sponsors:** "For your costume budget." · "Shine, little star." · "Coins! Throw them about, it looks wonderful."
- **Contract:** "Be dazzling for me, every scenario, and I'll lend you the sun." · "Win with flair and I will make you blinding." · "Sign here, and here, and do a little bow."
- **Your death:** "What a finish! What a waste!" · "The lights go down. I hated the ending." · "Exit, stage nowhere."

### 6. The Saint of Open Doors

*Loves the ones who get away. Thinks heroes are a waste.*

- **Likes:** "Run, little one. Running is a kind of living." · "Good. The door was there for you." · "Alive is the only score that counts."
- **Dislikes:** "Heroes are just corpses with good press." · "Why did you stay?" · "Brave and foolish. The same word, mostly."
- **Sponsors:** "For the road out." · "Keep your shoes on." · "A coin for every exit you took."
- **Contract:** "Leave when it goes bad, every scenario, and every door will open for you." · "Promise me you'll run. I'll keep the doors unlocked." · "One demand: live. Run when you must."
- **Your death:** "The door was right there." · "Why didn't you run?" · "I left it open for you. I always do."

### 7. The Ledger With Golden Teeth

*Loves profit. Treats generosity as a rounding error.*

- **Likes:** "Every coin remembers who earned it." · "Profit. Lovely word." · "Itemize that, would you?"
- **Dislikes:** "You gave it away? For free?" · "A loss. Noted." · "Charity is a rounding error."
- **Sponsors:** "An investment. I expect returns." · "Coins, with interest. Mine." · "Spend wisely, or don't. I am writing it down either way."
- **Contract:** "Take the larger share, every scenario, and I will gild you." · "Sign. Initial. Sign. Lovely." · "My terms are simple: keep more than you give."
- **Your death:** "Account closed." · "Debts outstanding: one life." · "I'll take the teeth."

### 8. The Dog That Waits at the Gate

*Loves loyalty. Never forgets a broken promise.*

- **Likes:** "You came back for them. Good." · "Stay. Good. Stay." · "There you are."
- **Dislikes:** "They trusted you. I will remember." · "You left someone at the gate." · "A low growl, from very far up."
- **Sponsors:** "Here. For coming back." · "A bone. Well. Coins." · "For the ones who stay."
- **Contract:** "Keep your word to me, every scenario, and nothing will get past you." · "Be loyal, and I will hold the gate for you." · "The fourth time you come back to someone, they stop pretending. Promise me you'll keep coming back."
- **Your death:** "I'll wait. I'm good at waiting." · "Someone should have been at the gate." · "Rest. I'll keep watch."

### What each tag comes from

| Tag | Comes from |
| --- | --- |
| bravery | beating an enemy at least as strong as you; winning at 25% HP or less; choosing a fight option in a choice |
| cowardice | running from a fight |
| cruelty | attacking or robbing a survivor; choices like *Push someone you know* |
| mercy | giving a survivor an item; choices like *Pay the fare* |
| greed | robbing or overcharging a survivor; choices like *Load the reward crates* |
| style | winning without taking damage, or finishing with a critical hit |
| loyalty | keeping your sponsor's demand at a scenario clear; giving to a survivor at attitude 30+ |
| cunning | discovering a hidden scenario; finishing a fight with a skill, stigma or item |

---

## Attributes (16)

On the first morning, «SYSTEM» gives everyone one attribute:
```
[Attribute assigned: <name> (<rarity>).]
```
Rarity is 70% common, 25% rare and 5% legendary. Backgrounds lean the roll ("×3" = three times as likely). Constellations that like one of an attribute's tags start 10 interest warmer. Survivors have attributes too, shown once you have met them.

Each entry gives the exact mechanics, then the lore.

| Attribute | Rarity | Effect | Tags | Likelier for |
| --- | --- | --- | --- | --- |
| **Stubborn** | common | +2 endurance | bravery | Night Guard ×3 |
| **Loose Change** | common | +25% coins | greed | Courier ×2 |
| **Night-Shift Hands** | common | +25% healing | mercy | Night Nurse ×3 |
| **Heavy Hands** | common | +2 strength | bravery | Line Cook ×3 |
| **Light Feet** | common | +2 agility | cunning | Courier ×3 |
| **Calm Under Sirens** | common | +2 spirit | mercy | Night Nurse ×2 |
| **Bargain Hunter** | common | +15% coins | greed, cunning | Line Cook ×2 |
| **Exterminator** | common | +25% damage vs beasts | bravery | Night Guard ×2 |
| **Side Exit** | common | +10% run chance | cowardice | Courier ×2 |
| **Scrapper** | common | +25% damage vs survivors | cruelty | Line Cook ×2 |
| **First Out the Door** | rare | +20% run chance | cowardice, cunning | Courier ×3 |
| **Golden Touch** | rare | +50% coins | greed, style | none |
| **Ghost Lamp** | rare | +40% damage vs spirits | bravery, mercy | Night Nurse ×2 |
| **Iron Constitution** | rare | +4 endurance | loyalty | Night Guard ×2 |
| **Beast Breaker** | legendary | +60% damage vs beasts **and** +2 strength | bravery, style | Line Cook ×2 |
| **Unkillable Optimist** | legendary | +75% healing **and** +2 endurance | mercy, loyalty, bravery | none |

**Lore**
- **Stubborn.** You do not fall over. You have simply never agreed to.
- **Loose Change.** Coins find their way into your pockets. They always have. You stopped asking where from.
- **Night-Shift Hands.** Steady hands, warm bandages, no questions. Your patients called you the quiet one.
- **Heavy Hands.** Everything you pick up becomes a weapon eventually. Even the kettle.
- **Light Feet.** You were halfway down the stairs before the alarm finished its first word.
- **Calm Under Sirens.** Panic is for people with more time.
- **Bargain Hunter.** You can smell a discount through a locked door. Twice, you have.
- **Exterminator.** Rats, dogs, things with too many teeth: you have a method, and the method has a bucket.
- **Side Exit.** There is always a back door. You always know where it is. You have never once used the front.
- **Scrapper.** You learned to fight in car parks, not dojos. Car parks do not give belts.
- **First Out the Door.** Fire drills, break-ups, parties: you have left them all first, and you have never once been sorry.
- **Golden Touch.** Money likes you. It follows you home. Some nights it sits at the end of the bed and watches you sleep.
- **Ghost Lamp.** Things that should not glow keep their distance. Your grandmother told you why once. You were too young to listen.
- **Iron Constitution.** Doctors stopped arguing with you years ago. One of them wrote a paper about you. It was rejected for being unbelievable.
- **Beast Breaker.** Animals can smell it on you. They are right to be worried. The old stories say your family once made a promise to something with teeth, and kept it.
- **Unkillable Optimist.** Every wound is a story you will tell later. You have so many stories. You intend to collect more.

---

## Stigmas (8, one per constellation)

A stigma is a constellation's own power, lent to the one it sponsors:
- It has its own **Stigma** button in fights.
- It hits 1.5× harder than a skill of the same power.
- It levels with use up to **level 5**, the v1 cap.
- You can have only one sponsor. A new contract ends the old one: the stigma is taken back, and the old sponsor's interest drops 30.
- A broken demand **seals** the stigma until you clear a scenario with the demand kept.

```
[Stigma granted: <name>. Lent by «<constellation title>». Terms apply.]
[Stigma sealed: <name>. The lender is displeased.]
```

| Constellation | Stigma | Kind | Power | Cooldown |
| --- | --- | --- | --- | --- |
| The Lantern That Will Not Go Out | **Unquenched Flame** | attack | 14 | 3 |
| The Smile Behind the Velvet Knife | **Velvet Exit** | escape | +45% run | 4 |
| The Butcher Who Hums Lullabies | **Lullaby Cleaver** | attack | 18 | 4 |
| The Gardener of Second Chances | **Second Bloom** | heal | 30 | 4 |
| The Peacock Who Swallowed the Sun | **Sunburst Encore** | attack | 10 | 2 |
| The Saint of Open Doors | **Every Door Opens** | escape | +60% run | 5 |
| The Ledger With Golden Teeth | **Gilded Ward** | buff | +10 armor this round | 3 |
| The Dog That Waits at the Gate | **Hold the Gate** | buff | +14 armor this round | 4 |

**Lore**
- **Unquenched Flame.** A strike that burns hotter the longer you have stood your ground. They say the Lantern was lit by the first person who refused to run, and has been looking for the second ever since.
- **Velvet Exit.** A smile, a bow, and you were never there. The Velvet Knife has left more rooms than anyone has entered.
- **Lullaby Cleaver.** It hums while it cuts, and the tune is one your mother sang. You do not remember telling anyone that tune.
- **Second Bloom.** Something green closes the wound. Later, a small flower grows on the scar, and it smells like rain.
- **Sunburst Encore.** Blinding, gorgeous, and again! The Peacock swallowed a sun once, to see if it could. It is still digesting.
- **Every Door Opens.** Somewhere behind you, a door you never noticed swings open. Do not ask where it leads. It leads away. That is enough.
- **Gilded Ward.** Gold plating, billed later. The Ledger never forgets a loan. The interest is calculated in a currency you do not have yet.
- **Hold the Gate.** Nothing passes. Nothing. Somewhere very high up, something with a collar plants its feet beside yours.

---

## Items (25)

Every item gets one line of exact mechanics, then one or two lines of lore. Rare items now each have a purpose: one is a trigger, the other five are one-use relics. They are never sold in shops or by survivors.

### Weapons (7)

| Item | Power | Price | Shop | Where from |
| --- | --- | --- | --- | --- |
| Kitchen Knife | 3 | 20 | yes | Line Cook start |
| Bike Chain | 3 | 20 | no | Courier start |
| Crowbar | 6 | 60 | yes | scenario 2; Tunnel Crawler drop |
| Rebar Spear | 7 | 90 | yes | |
| Fire Axe | 8 | 110 | yes | |
| Harbor Hook | 8 | 160 | no | hidden *The Honest Toll* |
| Arena Gauntlets | 10 | 220 | no | scenario 7 |

- **Kitchen Knife.** Still smells of onions. It has opinions about how things should be cut.
- **Bike Chain.** Wrapped twice round your fist. It has carried you across «CITY» a thousand times; now it carries you through it.
- **Crowbar.** The universal key. Every door in «CITY» knows its name.
- **Rebar Spear.** Concrete still clings to the end. Somebody's half-built house is a little more unfinished now.
- **Fire Axe.** *IN CASE OF EMERGENCY.* This counts.
- **Harbor Hook.** The dockers say it once pulled something up from the deep that was still blinking.
- **Arena Gauntlets.** Heavy, scuffed, and warm inside, as if someone took them off a moment ago.

### Armor (5)

| Item | Power | Price | Shop | Where from |
| --- | --- | --- | --- | --- |
| Padded Jacket | 2 | 25 | yes | Night Guard start |
| Hi-Vis Vest | 3 | 40 | yes | sub *Dock Workers' Strike* |
| Welding Apron | 4 | 70 | yes | |
| Riot Vest | 5 | 90 | yes | scenario 5; hidden *The Regular*; Boar drop |
| Stage Armor | 7 | 300 | no | Arena Gladiator drop (10%) |

- **Padded Jacket.** Warm, ugly, and very hard to cut through. Two out of three is excellent.
- **Hi-Vis Vest.** Makes you easy to see. That used to be the point.
- **Welding Apron.** Leather, scorched in the shape of old sparks. Fire has tried you before and lost.
- **Riot Vest.** Somebody's name is written inside the collar in marker. It has been scratched out, carefully.
- **Stage Armor.** Painted to look like steel, and somehow it is steel now. The Bowl takes its costumes seriously.

### Consumables (7)

| Item | Effect | Price | Shop |
| --- | --- | --- | --- |
| Painkillers | heal 15 | 6 | yes |
| Energy Drink | heal 20 | 12 | yes |
| Bandage | heal 25 | 10 | yes |
| Med Kit | heal 50 | 30 | yes |
| Road Flare | 20 damage | 18 | yes |
| Pepper Spray | 25 damage | 22 | yes |
| Firecracker String | 30 damage | 28 | yes |

- **Painkillers.** Take two. Ignore the expiry date. Ignore everything, briefly.
- **Energy Drink.** Tastes like a battery that went to art school.
- **Bandage.** Clean, white, and the most beautiful thing in «CITY» when you need one.
- **Med Kit.** A red cross on a white box. The oldest promise anyone still keeps.
- **Road Flare.** Red light, hot smoke, a hiss like an argument. Most things back away from it.
- **Pepper Spray.** Point away from face. Read the label. The label is mostly screaming.
- **Firecracker String.** Twenty small bangs that sound, for a moment, like a party.

### Rare (6): every one has a purpose

| Item | Purpose | Price | Where from |
| --- | --- | --- | --- |
| Humming Mirror Shard | **trigger**: arrive in the Glass Towers carrying it | 120 | scavenging Riverside Park or the Subway Tunnels (8%) |
| Ink-Stained Crown | **one use, outside fights:** +1 to a stat you choose, for good | 260 | hidden *Mirror, Mirror* |
| Bell Fragment | **one use:** 40 damage, and the enemy loses its next turn | 240 | hidden *An Old Friend* |
| Salt Pearl | **one use:** a sure escape from any fight except a Final Wave or a scenario's own fight | 280 | hidden *The Last Train* |
| Golden Tooth | **carried, never used up:** +20% coins from every source | 600 | hidden *The Honest Toll* |
| Encore Ticket | **one use:** heal to full | 400 | scenario 10 |

- **Humming Mirror Shard.** A sliver of window that hums one low note, always the same. Somewhere, a lot of glass is humming back.
- **Ink-Stained Crown.** Paper and wire, stained with ink that has never dried. Wear it once and a line of you is rewritten, for good.
- **Bell Fragment.** A shard of bronze that still remembers its note. Strike it once and the air breaks along the line of the sound. Whatever hears it forgets, for a moment, what it was doing.
- **Salt Pearl.** Found on the seat of a train that should not have been running. Crush it and the tide comes in between you and whatever was chasing you. It will not come for a fight the system arranged.
- **Golden Tooth.** The Ledger's, supposedly. Keep it in your pocket and coins start finding their way to you. The bill comes later.
- **Encore Ticket.** *Admit one. Again.* The stub has your name on it, in handwriting you almost recognize.

---

## Hidden scenarios (6)

They are never listed until found, hinted only by rumors. Mechanics:
- Discovery announces the scenario and gives every constellation +15 interest. It counts as **cunning**.
- It runs beside the main scenario on its own clock, and keeps running after the main scenario ends, into the rest period.
- One runs at a time. Failing costs only the reward. Each can be found once per game.
- Rumors: random (10% per world tick) any time before discovery. Time-limited ones also get a guaranteed rumor when the scenario before their window starts.

**When a hidden scenario is found, the system's voice slips.** Each announcement keeps the usual bracket format, then ends with one lowercase line, as if something else is speaking through it.

| # | Title | Trigger | Goal | Hours | Rewards |
| --- | --- | --- | --- | --- | --- |
| 1 | The Regular | Rest in the Old Market 5 times | Kill 3 | 10 | 150 coins, Riot Vest |
| 2 | Mirror, Mirror | Arrive in the Glass Towers carrying the Humming Mirror Shard | Kill 2 spirits | 8 | 220 coins, Ink-Stained Crown |
| 3 | An Old Friend | Talk to the same survivor 4 times | Reach Clocktower Square (its trigger waits while the square is sealed) | 8 | 200 coins, Bell Fragment |
| 4 | The Last Train | Be in the Subway Tunnels during scenario 5 | Be in the Subway Tunnels when its clock ends | 10 | 300 coins, **Salt Pearl** |
| 5 | Overdue | Be on University Hill during scenario 2 | Kill 3 spirits | 10 | 180 coins, skill Steady Breath |
| 6 | The Honest Toll | Choose *Pay the fare* (`pay-toll`) in scenario 4 | Reach the Harbor Cranes | 12 | 250 coins, Harbor Hook, Golden Tooth |

### Announcements

**1. The Regular**
```
[Hidden scenario discovered: The Regular.]
[Objective: Kill 3 of the things living under your stall.]
[Time limit: 10 hours.]
[Reward: 150 coins. Riot Vest.]
[Failure: The reward is withdrawn. Nothing else is withdrawn.]
[you sleep so soundly here. we have been listening.]
```

**2. Mirror, Mirror**
```
[Hidden scenario discovered: Mirror, Mirror.]
[Objective: Kill 2 spirits.]
[Time limit: 8 hours.]
[Reward: 220 coins. Ink-Stained Crown.]
[Failure: The reward is withdrawn.]
[the towers have been missing a piece of themselves. now they can see you through it.]
```

**3. An Old Friend**
```
[Hidden scenario discovered: An Old Friend.]
[Objective: Reach Clocktower Square.]
[Time limit: 8 hours.]
[Reward: 200 coins. Bell Fragment.]
[Failure: The reward is withdrawn.]
[four visits. they trust you now. they want to show you the door by the clock.]
```

**4. The Last Train**
```
[Hidden scenario discovered: The Last Train.]
[Objective: Be in the Subway Tunnels when the train arrives.]
[Time limit: 10 hours.]
[Reward: 300 coins. Salt Pearl.]
[Failure: The reward is withdrawn.]
[all aboard. the fare is already paid. we never said by whom.]
```

**5. Overdue**
```
[Hidden scenario discovered: Overdue.]
[Objective: Kill 3 spirits.]
[Time limit: 10 hours.]
[Reward: 180 coins. Skill: Steady Breath.]
[Failure: The reward is withdrawn.]
[returns accepted at all hours. the librarians never left. they are very behind on their shelving.]
```

**6. The Honest Toll**
```
[Hidden scenario discovered: The Honest Toll.]
[Objective: Reach the Harbor Cranes.]
[Time limit: 12 hours.]
[Reward: 250 coins. Harbor Hook. Golden Tooth.]
[Failure: The reward is withdrawn.]
[nobody pays. you paid. the bridge would like to give something back, before it forgets your face.]
```

### Rumors

Survivors pass these along as *"<name> whispers a rumor: …"*.

1. **The Regular:** "They say if you sleep in the same market stall too often, the stall starts to keep you."
2. **Mirror, Mirror:** "Somebody swears the tower windows hum back when you bring them a piece of glass."
3. **An Old Friend:** "They say if you keep coming back to the same stranger, sooner or later they stop pretending."
4. **The Last Train:** "When the lights go out, they say one train still runs under the city. It always has a seat free."
5. **Overdue:** "A sign on the university gate says the library is accepting returns. Nobody alive put it there." *(It refers only to something already true on the first morning.)*
6. **The Honest Toll:** "They say there's a bridge that remembers who paid it honestly. Most people don't."

**Guaranteed rumor timing**

| Hidden scenario | Window | Guaranteed rumor |
| --- | --- | --- |
| 4. The Last Train | during scenario 5 | when scenario 4 starts |
| 5. Overdue | during scenario 2 | when scenario 1 starts (first morning) |
| 6. The Honest Toll | the choice in scenario 4 | when scenario 3 starts |
| 1–3 | any time | random rumors only (they never close) |

### Where the clues are planted

Ordinary flavor text that a careful player can read as a hint:

| Hidden scenario | Clues |
| --- | --- |
| The Regular | Old Market description (the warm blanket nobody owns); scenario 3 narration (a stall is still warm) |
| Mirror, Mirror | Glass Towers description (one pane missing on every floor); Humming Mirror Shard lore (a lot of glass is humming back) |
| An Old Friend | Clocktower Square description (four chalk marks by the door); the Dog's third contract line ("the fourth time you come back") |
| The Last Train | Subway Tunnels description (the board shows one train); scenario 5 «ANNOUNCER» line ("We missed one. It is underground") |
| Overdue | University Hill description (*Returns accepted at all hours*); scenario 2 «ANNOUNCER» line ("The library has not. Please do not knock.") |
| The Honest Toll | scenario 4 toll notice ("read them twice"); its rumor |

---

## Sub-scenarios (8)

These are optional, offered by exploring the listed zone. Failing loses only the reward. Two were renamed so no sub-scenario shares a name with a main or hidden scenario.

| Sub-scenario | Offered in | Goal | Hours | Rewards |
| --- | --- | --- | --- | --- |
| **Stall Sweep** *(renamed from Pest Control)* | Old Market | kill 3 | 8 | 30 coins, Bandage |
| **A Signal** | Glass Towers | reach Riverside Park | 6 | 35 coins |
| **Lost Library Card** | University Hill | kill 2 | 8 | 40 coins |
| **Bell Ringer** | Clocktower Square | reach Riverside Park | 6 | 40 coins |
| **Dock Workers' Strike** | Harbor Cranes | kill 3 | 10 | 60 coins, Hi-Vis Vest |
| **Third Rail** *(renamed from Last Train)* | Subway Tunnels | reach Riverside Park | 6 | 50 coins |
| **Fountain Coins** | Riverside Park | kill 2 | 6 | 45 coins |
| **Warm-Up Act** | The Bowl | kill 4 | 12 | 80 coins, Med Kit |

Each one opens with:
```
[Sub-scenario available: <title>.]
[Objective: <goal>.]  [Time limit: <hours> hours.]  [Reward: <reward>.]
[Failure: The reward is withdrawn. Participation is optional. Participation is appreciated.]
```
…followed by one line of narration:

- **Stall Sweep.** A vendor in a paper hat points at the dark under her stall. "Three of them. I named them. Please don't tell me which ones you got."
- **A Signal.** From the Riverside, someone is flashing a mirror: long, short, long. It might be a code. It might be a cry for help. It might be bait.
- **Lost Library Card.** A student's card lies on the library steps, swollen with rain. Two things in the reading room have been using it.
- **Bell Ringer.** Someone has tied a rope to a bell and run off to Riverside Park with the other end. The bell would like it back.
- **Dock Workers' Strike.** The dockers have stopped working, and so have the cranes. Something in the water is very glad about it.
- **Third Rail.** Walk the dead line to the river. Stay off the third rail. Nobody says what is on the third rail now.
- **Fountain Coins.** The frozen fountain is full of wishes. Two things under the ice have been collecting them.
- **Warm-Up Act.** The Bowl needs an opening act. You are it. The crowd is mostly teeth.

---

## Screens: death and "while you were away"

These replace the current wording, at the data-file step. The rules are unchanged.

### Death screen

```
You died.
[Survivor record closed: <name>.]
[Cause: <cause>.]
```
Causes:
- Killed in a fight: `[Cause: <enemy>, round <n>.]`
- Failed scenario: `[Cause: Main Scenario #<n>, "<title>". The time limit expired.]`
- Lost ward: `[Cause: <ward's name> did not survive. Neither did you.]`

Then come the facts (scenarios cleared, days survived, kills, coins), then the constellations' last words. Then:

> The city does not pause. Somewhere a market stall is empty, and it will stay that way.

Single button: **Start a new life**

### Other notices

```
[Attribute assigned: <name> (<rarity>).]
[Main Scenario #<n> cleared: <title>.] [Rewards: <coins> coins. <items>.]
[Hidden scenario cleared: <title>.] [Rewards: …]
[Hidden scenario failed: <title>. The reward is withdrawn.]
[Sub-scenario cleared: <title>.] [Rewards: …]
[Sub-scenario failed: <title>. The reward is withdrawn.]
[Skill level up: <name>, level <n>.]
[Skill learned: <name>.] Something in the drill finally clicks.
```

### While you were away (digest)

Title: **While you were away**

If a survivor died while you were away:
```
[Elapsed time logged. You were not harmed. Others were less fortunate.]
```
If nobody died:
```
[Elapsed time logged. You were not harmed. Nobody died while you were away.]
```
Then the world's news, then the **Continue** button.

---

## Enemies (15)

Stats at danger 1; each danger level above 1 adds 15% to hp, strength and endurance.

| Enemy | Tags | Lives in | Str/Agi/End | HP | Behavior | Coins | Drops |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Rat Swarm | beast | Old Market, Subway Tunnels | 4/6/2 | 22 | erratic | 2–6 | Bandage 15% |
| Feral Hound | beast | Old Market, Riverside Park | 6/7/3 | 30 | aggressive | 4–9 | Bandage 20% |
| Iron-Bristled Boar | beast | Riverside Park | 7/3/4 | 46 | defensive | 8–15 | Riot Vest 8%, Painkillers 15% |
| Crane Crab | beast | Harbor Cranes | 8/3/8 | 46 | defensive | 9–16 | Painkillers 20%, Welding Apron 5% |
| Salt Eel | beast | Harbor Cranes | 9/8/4 | 42 | aggressive | 10–18 | Energy Drink 15% |
| Glass Wraith | spirit, monster | Glass Towers | 6/6/4 | 36 | erratic | 8–14 | Pepper Spray 15% |
| Ink Wisp | spirit | University Hill | 5/8/2 | 26 | erratic | 6–12 | Painkillers 20% |
| Rooftop Harpy | monster | Glass Towers | 7/8/3 | 34 | aggressive | 7–13 | Road Flare 20% |
| Tunnel Crawler | monster | Subway Tunnels | 9/5/6 | 55 | defensive | 12–22 | Crowbar 15%, Energy Drink 10% |
| Paper Golem | monster | University Hill | 7/2/4 | 44 | defensive | 10–16 | Bandage 20%, Rebar Spear 5% |
| Bell Gargoyle | monster | Clocktower Square | 9/4/7 | 58 | defensive | 14–24 | Firecracker String 15% |
| Clockwork Hound | monster | Clocktower Square | 9/8/5 | 44 | aggressive | 12–20 | Road Flare 20%, Fire Axe 5% |
| Arena Gladiator | monster | The Bowl | 10/6/7 | 64 | defensive | 20–35 | Stage Armor 10%, Med Kit 15% |
| Toll-Keeper | monster | (scenario 4 only) | 8/5/6 | 52 | defensive | 30–40 | none |
| The Understudy | monster | (scenario 10 Final Wave) | 11/8/8 | 95 | aggressive | 80–120 | none |

## Skills (12)

| Skill | Kind | Power | Cooldown | Where from |
| --- | --- | --- | --- | --- |
| Quick Strike | attack | 6 | 2 | shop 40; training |
| Heavy Blow | attack | 12 | 3 | shop 120 |
| Shoulder Check | attack | 8 | 2 | shop 60; training |
| Second Wind | heal | 25 | 4 | scenario 3 |
| Steady Breath | heal | 12 | 2 | hidden *Overdue* |
| Field Dressing | heal | 18 | 3 | shop 70 |
| Iron Skin | buff | 4 | 4 | scenario 6 |
| Brace | buff | 8 | 4 | shop 80 |
| Battle Cry | buff | 5 | 3 | training |
| Feint | buff | 6 | 3 | training |
| Vanishing Step | escape | +30% | 5 | scenario 9 |
| Sprint | escape | +20% | 3 | shop 50; training |

Lore for the new ones: **Shoulder Check.** Lead with the bone. Doors taught you this. · **Field Dressing.** Tear, wrap, knot, breathe. Your hands know it better than you do. · **Brace.** Feet wide, chin down. Let the city break on you. · **Battle Cry.** Loud enough, and for one moment even the monsters believe you. · **Feint.** Look left. Be right. Something always falls for it. · **Sprint.** Your lungs will forgive you. Eventually.

## Survivors (40, eight per personality)

- *Brave:* Mara Okonkwo, Kofi Brandt, Tamsin Oyelaran, Bruno Castellanos, Asel Nurmagan, Dagny Holmqvist, Rafael Quispe, Hana Kovaříková
- *Cautious:* Teodor Vasquez, Yuki Moreau, Eitan Albrecht, Noor Haddad, Wim Oosterhout, Lucía Ferraro, Anselm Iwu, Meiling Sørensen
- *Kind:* Ines Halloran, Dario Nakashima, Amara Lindgren, Tobiah Mensah, Sunniva Okafor, Ilse Marangoni, Jomo Varga, Rosalind Adebayo
- *Ruthless:* Ruslan Achterberg, Selin Abernathy, Viggo Strand, Kasia Wróbel, Dmitri Halvorsen, Marisol Dunne, Okan Barlas, Greta Valtonen
- *Schemer:* Pia Lindqvist, Ottilie Ferreira, Lazlo Mbatha, Corentin Aubry, Zainab Kessler, Fenna Pruitt, Ravi Okoye, Saoirse Delacroix

---

## Survivor greetings

What a survivor says when you talk to them. Bands: hostile (−50 or worse; they may attack), wary (below 0), neutral, friendly (50 or better). Lines take turns, so the same person never greets you the same way twice in a row.

**Brave**
- *hostile:* <name> squares up before you are close. "Walk away. That is the only warning you get." · <name> cracks their knuckles, one by one. "I have been hoping you would come back." · <name> plants their feet in your path. "You and me. Right here. I have the time."
- *wary:* <name> does not smile. "I remember what you did. Keep your hands where I can see them." · <name> looks you over like a door that might be rigged. "Talk fast." · <name> folds their arms. "I fought beside worse than you. Not by choice."
- *neutral:* <name> nods. "Stick close if things get loud. They always get loud." · <name> is wrapping tape round their knuckles. "You fighting today, or just looking?" · <name> points down the street with a pipe. "Something big went that way. I am going after it." · <name> grins at the sky's new words. "Say what you like. It is never boring now."
- *friendly:* <name> claps your shoulder hard enough to hurt. "Still alive! Good. I was not done with you." · <name> tosses you half a chocolate bar. "Eat. We have monsters to embarrass." · <name> grins. "Anyone gives you trouble, you send them to me. I mean it."

**Cautious**
- *hostile:* <name> backs away, eyes on your hands. "No closer. I have done the math on you." · <name> is already halfway to the exit. "You are the reason I check corners twice." · <name> keeps a table between you. "I know three ways out of here. You know none of them."
- *wary:* <name> watches you for a long moment before speaking. "Why are you here?" · <name> answers a question you did not ask. "No. I have not seen anything. Nobody has." · <name> glances at the exits, then at you, then at the exits. "Make it quick."
- *neutral:* <name> speaks without looking up from a hand-drawn map. "The ambushes come at the corners. Mostly." · <name> studies you. "You walk loud. Things here listen for that." · <name> counts something on their fingers and stops when you arrive. "Nothing. Just counting." · <name> keeps their voice low. "The board changes when nobody is reading it. Have you noticed?"
- *friendly:* <name> lowers the knife they were holding behind their back. "Oh. It is you. Good." · <name> slips you a folded note: three safe streets, one underlined. "Do not ask how I know." · <name> almost smiles. "I saved you a spot by the wall. Best view of the doors."

**Ruthless**
- *hostile:* <name> sees you and their hand goes to their weapon. "Saves me looking for you." · <name> smiles with none of their face. "Funny. I was just thinking about you." · <name> rolls their shoulders. "No crowd. No witnesses. Lucky me."
- *wary:* <name> sizes you up like a price tag, and does not like the number. · <name> keeps eating. "You owe me. I have not decided what yet." · <name> does not get up. "You are still breathing. That is your problem, not mine."
- *neutral:* <name> sizes you up like a price tag. · <name> flips a coin and catches it without looking. "Everything here costs something. Remember that." · <name> wipes a blade clean on their sleeve. "Business or pleasure?" · <name> glances at your pockets before your face. "What are you carrying?"
- *friendly:* <name> nods, which from <name> is a speech. "You are useful. Stay that way." · <name> slides a stolen bandage across the table. "Do not thank me. Thank the idiot I took it from." · <name> almost laughs. "You and I would do well, if the city lets us. It will not."

**Kind**
- *hostile:* <name> flinches at the sight of you. "Please go. I helped you once." · <name> stands in front of someone smaller. "Not them. Not today. Not you." · <name> will not look at you. "I keep a list of people I would not feed. You are on it."
- *wary:* <name> keeps their distance. "I remember you. I want to think better of you. Help me." · <name> hesitates, then holds out a water bottle anyway. "Do not make me sorry." · <name> speaks gently, which is worse. "Whatever you did, I hope it was worth it."
- *neutral:* <name> offers you half a sandwich. "You look like you need it." · <name> is stitching someone's coat with fishing line. "Sit. You are bleeding a little." · <name> hums while they sort bandages into piles. "Small ones for small hurts. We are low on small hurts." · <name> looks up from a sleeping stranger. "They have not woken since the sirens. I talk to them anyway."
- *friendly:* <name> hugs you before you can stop them. "You came back! I kept your blanket dry." · <name> presses a warm tin into your hands. "Soup. Do not ask from what. It is good." · <name> laughs, tired and real. "Every time you walk in, I count one more. Keep making me count."

**Schemer**
- *hostile:* <name> smiles too wide. "Oh, it is you. I have told everyone such stories about you." · <name> raises both hands, palms open, eyes on your back. "No hard feelings. Mine are all soft." · <name> whistles once. Somewhere behind you, someone answers.
- *wary:* <name> smiles a little too quickly. "Friends, yes? Of course yes." · <name> sighs theatrically. "You hurt my feelings. I charge interest on those." · <name> pretends to be busy with something that is not there. "I am not here. You did not see me."
- *neutral:* <name> smiles a little too quickly. "Friends, yes?" · <name> leans in close. "I know a secret about this zone. Not for free. Nothing is." · <name> offers you a coin trick, and keeps the coin. "Lesson one." · <name> drops their voice. "Everyone is lying to you. Except me. Mostly."
- *friendly:* <name> links an arm through yours. "My favorite investment! You are paying off beautifully." · <name> winks. "Someone is selling your name to a constellation. I bought it back. You owe me." · <name> tucks a rumor into your pocket like a coin. "That one is free. The next one is not."

## Explore flavor and world rumors

When exploring finds nothing else: A wall is covered in handwritten warnings. Someone has crossed out half of them and written LIES across the rest. · A radio in a parked car still plays music. Nobody comes to turn it off. You leave it on. · Footprints in the dust lead somewhere you decide not to follow. Not yet. · Someone has chalked a map on the pavement. Half of it is wrong. The wrong half is very detailed. · A vending machine hums in the dark, fully stocked, every price set to zero. Nobody has touched it. You do not either. · A dog sits on a doorstep, waiting. It watches you pass, decides you are not who it is waiting for, and goes back to waiting.

World rumors (`{zone}` is the zone): Rumor: something in {zone} has started singing at night. · Rumor: a cache of supplies is buried somewhere in {zone}. · Rumor: {zone} is safer than it looks. Nobody believes it. · Rumor: someone saw the announcer's shadow over {zone}.

---

## Decided (all rounds)

- **Final Wave** in survive scenarios: must be beaten, no running. Named waves come at normal strength.
- **Ambushes** in survive and protect scenarios. Arrival ambushes also apply in reach scenarios.
- **Tag triggers** as in the table above. Bravery is earned.
- **"Only some survive"** uses the group present (4–6 where you stand, met first). You pick who is spared, and the rest of the group dies. The Lifeboat crates spread the news (−25 citywide) and «ANNOUNCER» speaks.
- **Rare hidden scenarios stay rare.** Time-limited ones get a guaranteed rumor before their window.
- **Stigmas** cap at level 5 for v1.
- **Robbing:** 30% caught (50% if brave or ruthless). A caught robbery fails and starts a fight; win it to take the item. Everyone else in the zone loses 10 attitude.
- **Travel, the ward's 3 wounds, two-effect legendaries,** and hidden scenarios outliving their main scenario are all built.
- **Round 6:** rare relic powers, spirit, the shard's sources and arrival trigger, no Final Wave in hidden scenarios, a required zone for The Last Train, sealed targets wait, reach-scenario ambushes and 6-hour limits, a true digest line, danger past 5, explicit drop chances, the rename, greetings in data, the digest title.
