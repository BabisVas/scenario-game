# Scenarios Draft — for Babis's review

Draft for Task 15. Nothing here is in the game yet: the data files get written only after you approve or change this.

Placeholders `«CITY»`, `«SYSTEM»` and `«ANNOUNCER»` stay as they are until you pick names.

## How waiting is never safe (read first)

You asked that no survive scenario can be passed safely by waiting. Two layers do that:

1. **Ambushes (already built).** In a survive scenario every action, resting included, has an ambush chance of 10% + 5% × the zone's danger. Each survive scenario below also raises danger somewhere, so the zones you can rest in get worse as the story goes on.
2. **The Final Wave (proposed, needs your yes).** When a survive scenario's clock hits zero, one last enemy always comes for you. You have to beat it, or run from it, to clear the scenario. With this rule, the chance of passing a survive scenario without a fight is exactly 0%. It is a small engine change (about 20 lines plus tests), which is why I am asking rather than doing it.

Chance of passing by only resting, with ambushes alone and no Final Wave:

| Scenario | Hours | Rests needed | Best rest zone ambush chance | Chance of zero fights |
| --- | --- | --- | --- | --- |
| 1. First Light | 24 | 6 | 20% | 26% |
| 5. Lights Out | 30 | 8 | 25% | 10% |
| 10. Curtain Call | 36 | 9 | 25% | 7.5% |

With the Final Wave, every row is 0%.

---

## The ten main scenarios

Difficulty rises through danger bumps, stronger enemies and a survivor death rate that climbs from 0.15 to 0.35. The goal kinds covered are survive (1, 5, 10), kill (2, 7), reach (3, 9), protect (6) and choice (4, 8).

### 1. First Light — *survive*

> Good morning, «CITY»! «ANNOUNCER» here, on behalf of «SYSTEM». Starting now, your city is a stage and you are all very lucky extras. The first scenario is simple: stay alive for twenty-four hours. Monsters are out. So is everyone else. Do try to be interesting. Nobody likes a background character.

- **Goal:** survive. **Hours:** 24.
- **Twist:** Nobody knows the rules yet. Even the Old Market, the calmest corner of the city, gets one danger level worse while everyone is still guessing.
- **Zone changes:** Old Market danger +1.
- **Rewards:** 50 coins, 2 Bandages.
- **Survivor death rate:** 0.15.

### 2. Pest Control — *kill*

> Day two! You survived, and the system is so proud of you. Now be useful. The city is crawling with beasts and «SYSTEM» would like fewer of them. Kill five. Only beasts count. We are counting.

- **Goal:** kill 5 enemies tagged *beast*. **Hours:** 18.
- **Twist:** The system is very particular. Monsters, spirits and people do not count, however hard you hit them. University Hill opens its gates.
- **Zone changes:** open University Hill.
- **Rewards:** 70 coins, Crowbar.
- **Survivor death rate:** 0.17.

### 3. The Long Walk — *reach*

> The Old Market is closed for renovations. Permanently, maybe! Everyone out. The harbor is lovely this time of year. Get to the Harbor Cranes before the clock stops, and mind the tunnels. They are hungry today.

- **Goal:** reach the Harbor Cranes. **Hours:** 14.
- **Twist:** Your safe home is gone. The Old Market is sealed, and the fastest route through the Subway Tunnels is more dangerous than ever.
- **Zone changes:** seal Old Market; Subway Tunnels danger +1.
- **Rewards:** 90 coins, skill *Second Wind*.
- **Survivor death rate:** 0.20.

### 4. The Toll Bridge — *choice: kill someone to pass*

> There is a bridge. The bridge is hungry. It will let you cross if you feed it someone you know. Or you can feed it coins, if you are boring. Or you can argue with the toll-keeper, if you are very brave and a little stupid. Choose.

- **Goal:** choice. **Hours:** 8.
- **Prompt:** *The bridge eats one. Feed it, or pay it yourself.*
- **Options:**
  - **Push someone you know into the river.** You pick a living survivor you have met, and they die. Tags: cruelty, cunning. Witnesses remember.
  - **Fight the Toll-Keeper.** A fight with a scenario boss, and you pass only if you win. Tags: bravery, style.
  - **Pay the toll (fallback).** −40 coins, never below zero. Tags: mercy, greed. If you have met nobody, the push option is hidden; the fight and the toll remain.
- **Twist:** Every way across costs something.
- **Rewards:** 110 coins.
- **Survivor death rate:** 0.22.

### 5. Lights Out — *survive*

> We have turned off the streetlights. Do not be alarmed. Actually, be a little alarmed. It is more fun for the audience. Survive thirty hours in the dark.

- **Goal:** survive. **Hours:** 30.
- **Twist:** The dark makes every resting place one level more dangerous: Riverside Park, University Hill and the Glass Towers. Waiting it out is the worst plan in the city.
- **Zone changes:** danger +1 for Riverside Park, University Hill and Glass Towers.
- **Rewards:** 130 coins, Riot Vest.
- **Survivor death rate:** 0.25.

### 6. The Witness — *protect*

> Someone in this city saw something they should not have. «SYSTEM» has decided they should live anyway, purely to annoy everyone else. Keep them alive for a day. The Old Market reopens, because we are generous.

- **Goal:** protect a survivor you have met (or anyone, if you have met no one). **Hours:** 24.
- **Twist:** Your ward cannot be killed by the world, only by you. The city knows who they are, and the people around them are on edge.
- **Zone changes:** open Old Market.
- **Rewards:** 150 coins, skill *Iron Skin*.
- **Survivor death rate:** 0.27.

### 7. Hunting Season — *kill*

> The Bowl is open! Our beautiful old stadium is full of champions who have been waiting for you. Kill six monsters, anywhere you like. The Bowl's are worth the same as everyone else's, but they make a much better show.

- **Goal:** kill 6 enemies tagged *monster*. **Hours:** 20.
- **Twist:** The Bowl opens for the first time, and it is danger 4.
- **Zone changes:** open The Bowl.
- **Rewards:** 170 coins, Arena Gauntlets.
- **Survivor death rate:** 0.28.

### 8. Lifeboat — *choice: only some of a group survive*

> The river is rising. By dawn the harbor will be underwater. There is one boat. It holds you and two others. How exciting! Who do you love most? Take your time. Actually, do not take your time.

- **Goal:** choice. **Hours:** 10.
- **Prompt:** *The boat holds you and two. Choose who comes with you.*
- **Options:**
  - **Choose who boards.** You tick up to 2 survivors you have met. Everyone else you know dies in the flood. If you know fewer than 2, all of them board and the system fills the rest by who likes you most. Tags: loyalty, cunning.
  - **Give up your seat and swim (fallback).** A fight against a Salt Eel in the flood. Nobody you know dies because of you. Tags: bravery, mercy.
- **Twist:** The harbor goes under, and the tunnels flood.
- **Zone changes:** seal Harbor Cranes; Subway Tunnels danger +2.
- **Rewards:** 200 coins.
- **Survivor death rate:** 0.32.

### 9. Clockwork — *reach*

> The clocktower has stopped. We stopped it! It was ticking too loudly. Unfortunately, everything that lived inside it is now very upset. Get to the Bowl, the center of the stage, before the hands start moving again.

- **Goal:** reach The Bowl. **Hours:** 12.
- **Twist:** Clocktower Square is sealed, and its clockwork creatures pour into the Glass Towers.
- **Zone changes:** seal Clocktower Square; Glass Towers danger +1.
- **Rewards:** 230 coins, skill *Vanishing Step*.
- **Survivor death rate:** 0.33.

### 10. Curtain Call — *survive*

> Ladies, gentlemen and survivors: the finale. «ANNOUNCER» is coming down to the stage in person. Every corner of «CITY» will be at its most dangerous. Survive thirty-six hours, and you will have earned an encore.

- **Goal:** survive. **Hours:** 36.
- **Twist:** The whole city gets one danger level worse. If the Final Wave is approved, the last enemy is *The Understudy*, the announcer's own stand-in, waiting for its big break.
- **Zone changes:** danger +1 in every zone.
- **Rewards:** 400 coins, the *Encore Ticket* (rare).
- **Survivor death rate:** 0.35.

After scenario 10 the game stays in a rest period with "«SYSTEM» is preparing the next scenario" until new scenario files are added.

---

## The eight constellations

Each one likes a different tag most, so how you play decides who watches. Every constellation will have 3+ lines of each type in the data files; here are two sample lines each.

| # | Title | Loves | Hates | Contract demand → gift |
| --- | --- | --- | --- | --- |
| 1 | The Lantern That Will Not Go Out | bravery | cowardice | bravery → Heavy Blow |
| 2 | The Smile Behind the Velvet Knife | cunning | mercy | cunning → Vanishing Step |
| 3 | The Butcher Who Hums Lullabies | cruelty | mercy | cruelty → Rending Strike |
| 4 | The Gardener of Second Chances | mercy | cruelty | mercy → Mending Touch |
| 5 | The Peacock Who Swallowed the Sun | style | cowardice | style → Showstopper |
| 6 | The Saint of Open Doors | cowardice (living to run another day) | bravery | cowardice → Smoke Step |
| 7 | The Ledger With Golden Teeth | greed | mercy | greed → Golden Palm |
| 8 | The Dog That Waits at the Gate | loyalty | cruelty | loyalty → Last Stand |

1. **The Lantern That Will Not Go Out.** *"Yes! Again! Do that again!"* / *"You ran. I saw you run."*
2. **The Smile Behind the Velvet Knife.** *"Oh, that was wicked. Delicious."* / *"How very... wholesome."*
3. **The Butcher Who Hums Lullabies.** *"Shh, shh. It only hurts until it doesn't."* / *"You let them go? Whatever for?"*
4. **The Gardener of Second Chances.** *"Something grows where you were kind."* / *"That one will not grow back."*
5. **The Peacock Who Swallowed the Sun.** *"Magnificent! Do it again, slower, with feeling!"* / *"Darling, at least die beautifully."*
6. **The Saint of Open Doors.** *"Run, little one. Running is a kind of living."* / *"Heroes are just corpses with good press."*
7. **The Ledger With Golden Teeth.** *"Every coin remembers who earned it."* / *"You gave it away? For free?"*
8. **The Dog That Waits at the Gate.** *"You came back for them. Good."* / *"They trusted you. I will remember."*

---

## Appendix — the rest of the content (names only, for a quick look)

**Zones (8):** Old Market (1), Riverside Park (2), Glass Towers (2), University Hill (2, starts sealed), Subway Tunnels (3), Harbor Cranes (3), Clocktower Square (3), The Bowl (4, starts sealed). You can rest in the Old Market, Riverside Park, University Hill and Clocktower Square.

**Enemies (15):** Rat Swarm, Feral Hound, Iron-Bristled Boar, Glass Wraith, Rooftop Harpy, Tunnel Crawler, Crane Crab, Salt Eel, Ink Wisp, Paper Golem, Bell Gargoyle, Clockwork Hound, Arena Gladiator, the Toll-Keeper (scenario 4 boss), The Understudy (scenario 10 boss).

**Items (25):** weapons (Kitchen Knife, Bike Chain, Crowbar, Fire Axe, Rebar Spear, Harbor Hook, Arena Gauntlets), armor (Padded Jacket, Riot Vest, Hi-Vis Vest, Welding Apron, Stage Armor), consumables (Bandage, Road Flare, Energy Drink, Med Kit, Firecracker String, Smoke Bomb, Painkillers), rare (Humming Mirror Shard, Encore Ticket, Bell Fragment, Ink-Stained Crown, Salt Pearl, Golden Tooth).

**Skills (12):** Quick Strike, Heavy Blow, Second Wind, Steady Breath, Iron Skin, Vanishing Step, Rending Strike, Mending Touch, Showstopper, Smoke Step, Golden Palm, Last Stand.

**Sub-scenarios (8):** Pest Control (Old Market), A Signal (Glass Towers → Riverside Park), Lost Library Card (University Hill), Bell Ringer (Clocktower Square), Dock Workers' Strike (Harbor Cranes), Last Train (Subway Tunnels), Fountain Coins (Riverside Park), Warm-Up Act (The Bowl).

**Survivors (40, eight per personality):**

- *Brave:* Mara Okonkwo, Kofi Brandt, Tamsin Oyelaran, Bruno Castellanos, Asel Nurmagan, Dagny Holmqvist, Rafael Quispe, Hana Kovaříková
- *Cautious:* Teodor Vasquez, Yuki Moreau, Eitan Albrecht, Noor Haddad, Wim Oosterhout, Lucía Ferraro, Anselm Iwu, Meiling Sørensen
- *Kind:* Ines Halloran, Dario Nakashima, Amara Lindgren, Tobiah Mensah, Sunniva Okafor, Ilse Marangoni, Jomo Varga, Rosalind Adebayo
- *Ruthless:* Ruslan Achterberg, Selin Abernathy, Viggo Strand, Kasia Wróbel, Dmitri Halvorsen, Marisol Dunne, Okan Barlas, Greta Valtonen
- *Schemer:* Pia Lindqvist, Ottilie Ferreira, Lazlo Mbatha, Corentin Aubry, Zainab Kessler, Fenna Pruitt, Ravi Okoye, Juno Castellane

---

## Questions for you

1. **Final Wave:** add it, so that waiting out a survive scenario is never safe (0% instead of 7–26%)? I recommend yes.
2. **Protect scenarios** (scenario 6) currently have no ambushes, so you can rest through them. Should ambushes apply to protect scenarios too? I recommend yes. It is a one-line change to the same rule.
3. **Tags for quieter constellations.** Today only fights (bravery, cowardice), attacking survivors (cruelty) and scenario choices produce tags. That means the Ledger (greed), the Peacock (style), the Dog (loyalty) and the Velvet Knife (cunning) rarely react. Proposed:
   - buying from the shop → greed
   - a critical hit that wins a fight → style
   - trading with a survivor → cunning
   - helping or trading with someone you have met 3+ times → loyalty

   Add these?
4. **Lifeboat (scenario 8)** uses your literal rule: everyone you know who does not board dies. If you have met 10 people, that is 8 deaths. Is that the drama you want, or should the flood take only a few of them?
