# Scenarios Draft — for Babis's review

Draft for Task 15. Nothing here is in the game yet: the data files get written only after you approve or change this.

Placeholders `«CITY»`, `«SYSTEM»` and `«ANNOUNCER»` stay as they are until you pick names.

**Updated 2026-10-11** with the three new systems: [16 attributes](#attributes-16), [8 stigmas](#stigmas-8-one-per-constellation) and [6 hidden scenarios](#hidden-scenarios-6). Constellation contracts now lend a stigma instead of a skill. Scenario 4 and 8 options now have ids, because hidden scenarios can trigger on them.

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
  - **Push someone you know into the river** (`push`). You pick a living survivor you have met, and they die. Tags: cruelty, cunning. Witnesses remember.
  - **Fight the Toll-Keeper** (`fight-keeper`). A fight with a scenario boss, and you pass only if you win. Tags: bravery, style.
  - **Pay the toll** (`pay-toll`, fallback). −40 coins, never below zero. Tags: mercy, greed. If you have met nobody, the push option is hidden; the fight and the toll remain.
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
  - **Choose who boards** (`choose-boarders`). You tick up to 2 survivors you have met. Everyone else you know dies in the flood. If you know fewer than 2, all of them board and the system fills the rest by who likes you most. Tags: loyalty, cunning.
  - **Give up your seat and swim** (`swim`, fallback). A fight against a Salt Eel in the flood. Nobody you know dies because of you. Tags: bravery, mercy.
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

| # | Title | Loves | Hates | Contract demand → stigma |
| --- | --- | --- | --- | --- |
| 1 | The Lantern That Will Not Go Out | bravery | cowardice | bravery → Unquenched Flame |
| 2 | The Smile Behind the Velvet Knife | cunning | mercy | cunning → Velvet Exit |
| 3 | The Butcher Who Hums Lullabies | cruelty | mercy | cruelty → Lullaby Cleaver |
| 4 | The Gardener of Second Chances | mercy | cruelty | mercy → Second Bloom |
| 5 | The Peacock Who Swallowed the Sun | style | cowardice | style → Sunburst Encore |
| 6 | The Saint of Open Doors | cowardice (living to run another day) | bravery | cowardice → Every Door Opens |
| 7 | The Ledger With Golden Teeth | greed | mercy | greed → Gilded Ward |
| 8 | The Dog That Waits at the Gate | loyalty | cruelty | loyalty → Hold the Gate |

1. **The Lantern That Will Not Go Out.** *"Yes! Again! Do that again!"* / *"You ran. I saw you run."*
2. **The Smile Behind the Velvet Knife.** *"Oh, that was wicked. Delicious."* / *"How very... wholesome."*
3. **The Butcher Who Hums Lullabies.** *"Shh, shh. It only hurts until it doesn't."* / *"You let them go? Whatever for?"*
4. **The Gardener of Second Chances.** *"Something grows where you were kind."* / *"That one will not grow back."*
5. **The Peacock Who Swallowed the Sun.** *"Magnificent! Do it again, slower, with feeling!"* / *"Darling, at least die beautifully."*
6. **The Saint of Open Doors.** *"Run, little one. Running is a kind of living."* / *"Heroes are just corpses with good press."*
7. **The Ledger With Golden Teeth.** *"Every coin remembers who earned it."* / *"You gave it away? For free?"*
8. **The Dog That Waits at the Gate.** *"You came back for them. Good."* / *"They trusted you. I will remember."*

---

## Attributes (16)

On the first morning, «SYSTEM» hands everyone one attribute: a title for who they are, with an effect that is always on. You do not choose it. The rarity roll is 70% common, 25% rare and 5% legendary. Your background makes some attributes likelier: "×3" means three times as likely as an attribute with no leaning. Constellations that like any of an attribute's tags start 10 interest warmer. Survivors roll attributes too, and you see theirs once you have met them.

| Attribute | Rarity | Effect | Tags | Likelier for |
| --- | --- | --- | --- | --- |
| **Stubborn**: *You do not fall over. You have simply never agreed to.* | common | +2 endurance | bravery | Night Guard ×3 |
| **Loose Change**: *Coins find their way into your pockets. Nobody knows how.* | common | +25% coins | greed | Courier ×2 |
| **Night-Shift Hands**: *Steady hands, warm bandages, no questions.* | common | +25% healing | mercy | Night Nurse ×3 |
| **Heavy Hands**: *Everything you pick up becomes a weapon eventually.* | common | +2 strength | bravery | Line Cook ×3 |
| **Light Feet**: *You were halfway down the stairs before the alarm finished.* | common | +2 agility | cunning | Courier ×3 |
| **Calm Under Sirens**: *Panic is for people with more time.* | common | +2 spirit | mercy | Night Nurse ×2 |
| **Bargain Hunter**: *You can smell a discount through a locked door.* | common | +15% coins | greed, cunning | Line Cook ×2 |
| **Exterminator**: *Rats, dogs, things with too many teeth: you have a method.* | common | +25% damage vs beasts | bravery | Night Guard ×2 |
| **Side Exit**: *There is always a back door. You always know where it is.* | common | +10% run chance | cowardice | Courier ×2 |
| **Scrapper**: *You learned to fight in car parks, not dojos.* | common | +25% damage vs survivors | cruelty | Line Cook ×2 |
| **First Out the Door**: *You always know where the exits are.* | rare | +20% run chance | cowardice, cunning | Courier ×3 |
| **Golden Touch**: *Money likes you. It shows.* | rare | +50% coins | greed, style | none |
| **Ghost Lamp**: *Things that should not glow keep away from you.* | rare | +40% damage vs spirits | bravery, mercy | Night Nurse ×2 |
| **Iron Constitution**: *Doctors stopped arguing with you years ago.* | rare | +4 endurance | loyalty | Night Guard ×2 |
| **Beast Breaker**: *Animals can smell it on you. They are right to be worried.* | legendary | +60% damage vs beasts | bravery, style | Line Cook ×2 |
| **Unkillable Optimist**: *Every wound is a story you will tell later.* | legendary | +75% healing | mercy, loyalty, bravery | none |

The mix is 10 common, 4 rare and 2 legendary. Each attribute has exactly one effect. Every background has at least two attributes it leans toward.

---

## Stigmas (8, one per constellation)

A stigma is a constellation's own power, lent to the survivor it sponsors. It replaces the plain skill a contract used to give. It has its own **Stigma** button in fights, hits 1.5× harder than a skill of the same power, and levels with use up to level 5.

You can have only one sponsor. Accepting a new contract ends the old one: the old stigma is taken back, and the old sponsor's interest drops 30. If you break a sponsor's demand in a scenario, the stigma is **sealed** until you clear a scenario with the demand kept.

| Constellation | Stigma | Kind | What it does |
| --- | --- | --- | --- |
| The Lantern That Will Not Go Out | **Unquenched Flame** | attack | *A strike that burns hotter the longer you have stood your ground.* Heavy hit, cooldown 3. |
| The Smile Behind the Velvet Knife | **Velvet Exit** | escape | *A smile, a bow, and you were never there.* A run with much better odds, cooldown 4. |
| The Butcher Who Hums Lullabies | **Lullaby Cleaver** | attack | *It hums while it cuts.* The heaviest hit of all, cooldown 4. |
| The Gardener of Second Chances | **Second Bloom** | heal | *Something green closes the wound.* Big heal, cooldown 4. |
| The Peacock Who Swallowed the Sun | **Sunburst Encore** | attack | *Blinding, gorgeous, and again!* A lighter hit, but on a short cooldown of 2. |
| The Saint of Open Doors | **Every Door Opens** | escape | *Somewhere behind you, a door you never noticed swings open.* Near-certain escape, cooldown 5. |
| The Ledger With Golden Teeth | **Gilded Ward** | buff | *Gold plating, billed later.* Heavy armor against the next blow, cooldown 3. |
| The Dog That Waits at the Gate | **Hold the Gate** | buff | *Nothing passes. Nothing.* The strongest brace of all, cooldown 4. |

---

## Hidden scenarios (6)

Hidden scenarios are never listed anywhere until you stumble into one. The only hints are rumors that survivors pass around: each world tick has a 10% chance of a rumor about one you have not found yet.

When you find one:
- «SYSTEM» announces it, and every constellation's interest rises by 15.
- It runs beside the main scenario on its own clock. Only one hidden scenario runs at a time.
- Failing it costs you the reward, never your life.
- Each one can be found once per game.

| # | Title | Trigger | Goal | Hours | Rewards |
| --- | --- | --- | --- | --- | --- |
| 1 | **The Regular** | Rest in the Old Market 5 times | Kill 3 things living under your favorite stall | 10 | 150 coins, Riot Vest |
| 2 | **Mirror, Mirror** | Carry the Humming Mirror Shard into the Glass Towers | Kill 2 spirits | 8 | 220 coins, Ink-Stained Crown |
| 3 | **An Old Friend** | Talk to the same survivor 4 times | Reach Clocktower Square: they want to show you something | 8 | 200 coins, Bell Fragment |
| 4 | **The Last Train** | Be in the Subway Tunnels during scenario 5, *Lights Out* | Survive on the train that should not be running | 10 | 300 coins, Encore Ticket |
| 5 | **Overdue** | Be on University Hill during scenario 2, *Pest Control* | Kill 3 spirits in the library | 10 | 180 coins, skill Steady Breath |
| 6 | **The Honest Toll** | Choose *Pay the toll* in scenario 4, *The Toll Bridge* | Reach the Harbor Cranes before the bridge forgets you | 12 | 250 coins, Harbor Hook, Golden Tooth |

Hidden rewards are two to four times a sub-scenario's.

**Announcements** (one line each; the full text is in the data files):
1. *The Regular:* "Five naps in the same market stall! The stall has noticed. So have the things living under it."
2. *Mirror, Mirror:* "The towers recognize their missing piece. Their reflections would like a word. Several words. With claws."
3. *An Old Friend:* "You keep coming back to the same face. They have decided to trust you. Fools."
4. *The Last Train:* "All aboard! Tickets are free. Getting off is the expensive part."
5. *Overdue:* "The university library would like its books back. And its librarians. They have been out since the morning."
6. *The Honest Toll:* "You paid! Nobody pays! The bridge is so moved it has decided to let you keep your life. Now run, before it changes its mind."

**Rumors** (what survivors whisper while each one is undiscovered):
1. "They say the market stalls get jealous if you sleep in the same one too often."
2. "Somebody swears the tower windows hum back when you bring them a piece of themselves."
3. "They say if you keep talking to the same stranger, sooner or later they tell you the truth."
4. "When the lights go out, they say a train still runs under the city."
5. "Somebody saw the university library lights on during the pest hunt. Nobody works there anymore."
6. "They say the bridge remembers who paid it honestly."

Hidden scenarios 4 and 5 can only be found during one scenario each, and 6 only by one choice. Missing them is part of the game.

---

## Appendix — the rest of the content (names only, for a quick look)

**Zones (8):** Old Market (1), Riverside Park (2), Glass Towers (2), University Hill (2, starts sealed), Subway Tunnels (3), Harbor Cranes (3), Clocktower Square (3), The Bowl (4, starts sealed). You can rest in the Old Market, Riverside Park, University Hill and Clocktower Square.

**Enemies (15):** Rat Swarm, Feral Hound, Iron-Bristled Boar, Glass Wraith, Rooftop Harpy, Tunnel Crawler, Crane Crab, Salt Eel, Ink Wisp, Paper Golem, Bell Gargoyle, Clockwork Hound, Arena Gladiator, the Toll-Keeper (scenario 4 boss), The Understudy (scenario 10 boss).

**Items (25):** weapons (Kitchen Knife, Bike Chain, Crowbar, Fire Axe, Rebar Spear, Harbor Hook, Arena Gauntlets), armor (Padded Jacket, Riot Vest, Hi-Vis Vest, Welding Apron, Stage Armor), consumables (Bandage, Road Flare, Energy Drink, Med Kit, Firecracker String, Smoke Bomb, Painkillers), rare (Humming Mirror Shard, Encore Ticket, Bell Fragment, Ink-Stained Crown, Salt Pearl, Golden Tooth).

**Skills (12):** from scenario rewards, the shop and training. Quick Strike, Heavy Blow, Second Wind, Steady Breath, Iron Skin, Vanishing Step, Shoulder Check, Feint, Field Dressing, Sprint, Battle Cry, Brace. Constellations no longer give skills; they lend stigmas.

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
5. **Hidden scenarios found by one choice or during one scenario** (4, 5 and 6) can be missed for good. Keep them that rare, or give each a second trigger?
6. **A stigma levels to 5 and stops.** Should a maxed stigma do anything more later (for example, "evolve"), or is level 5 the end for v1?
