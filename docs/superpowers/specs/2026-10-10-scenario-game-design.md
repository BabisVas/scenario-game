# Scenario Browser Game — Design

As of 2026-10-10 · Babis

## What this is

A personal browser game for Babis: an MMO-style game client wrapped around an Omniscient Reader–style scenario system, set in an original world. You play an ordinary survivor in a modern city the morning a system takes over and starts issuing deadly scenarios.

It is not a classic CYOA (a page of story, then pick A or B). It plays like the old menu-driven browser games: a status window, places to go, and actions that cost energy and time, with the story happening around those choices.

The player is not trying to become someone. There is no throne to climb to; the point is surviving whatever the system throws next and seeing what happens. The game is for Babis alone, so there is no audience, multiplayer or monetization to design for.

## Goals, non-goals, anti-goals

The game succeeds if opening the tab feels like checking in on a living, dangerous world where one wrong move ends everything.

**Goals**

- The world feels populated and alive, even with only one real player.
- Scenarios are dangerous but exciting: adventure, not dread.
- Death matters: one life per game.
- New scenarios, constellations, zones and enemies are easy to add over time.

**Non-goals**

- Real multiplayer, accounts or servers.
- A fixed ending, for now.

**Anti-goals** (failure even if everything technically works)

- It feels like a classic CYOA: a wall of text, then pick A or B.
- It feels like a roguelike: repeated runs, unlocks or anything carried between games.
- Real time punishes absence: you never lose anything because the tab was closed.
- It borrows Omniscient Reader's own characters, names or events. The world is original.

## The world

An invented modern city, ordinary until the morning the system arrives. Everyone sees the same notification at once, the first scenario starts, and from then on the city runs on the system's rules.

- **Tone:** adventure. The system is a threat and a thrill at the same time: new skills, rare drops, a constellation suddenly paying attention. People die in scenarios, but the mood is "what's next?", not dread.
- **The system** speaks through announcers who introduce each scenario, explain its rules and hand out rewards. They are our own invention, playful and a little cruel.
- **The city** is split into districts that become zones on the map. Scenarios can change zones: seal them off, flood them with monsters, open new ones.
- **Names** for the city, the system and its announcers are not chosen yet. The builder uses clearly marked placeholders in data files so they are easy to rename.

## The home screen and map

The home screen looks like an MMO client, with everything the player needs to decide their next action in view at once.

- **Status window:** name, health, energy, stats, attributes and skills.
- **Coins and inventory:** the coin balance, items, and a link to the system shop.
- **Current scenario:** its goal, its rules and the in-game hours left.
- **Message log:** system notifications, constellation reactions, survivor news, and a "while you were gone" digest when the game is reopened.
- **Ranking board:** appears after the first scenario, once the system has something to rank survivors by.
- **City map:** the zones. Each zone shows its danger level and its own actions, such as scavenge, explore, train, trade, rest, talk to survivors, or hunt monsters. Every action costs energy and in-game hours.

The look is text-driven: dark system-window panels in the style of game status screens, with no character art needed for the first version. It works on both a desktop browser and a phone.

## Time and energy

Nothing bad can happen while the tab is closed, but something new is always waiting when it opens.

- **Energy refills in real time**, up to a cap. A day away means a full tank, never a loss. The refill rate is a tuning value; a starting point is a full refill in about 8 real hours.
- **The world moves in real time.** While the player is away, survivors form parties, fight, trade and die, rankings shift, rumors spread and constellations chatter. On return, the log shows a short "while you were gone" digest.
- **Scenario clocks run on actions, not real time.** A scenario gives a budget of in-game hours, and each action spends some. The player can never fail a scenario because they were asleep or at work.
- **Between scenarios** there is breathing room: a rest period measured in in-game hours, with the next scenario announced in advance so the player can prepare.

The game has no server, so real-time changes are worked out when the game opens, from how much time has passed since it was last played.

## Scenarios

The first version ships with 10 hand-written main scenarios, and the story stays open-ended: more are added later as new data files, like new chapters.

Every main scenario has:

- an announcement from the system, with its goal and rules
- a budget of in-game hours
- a twist or special rule that makes it different from the last one
- rewards for clearing it: coins, items, sometimes a skill
- death for failing it

Goals vary between scenarios: survive until time runs out, kill a number of monsters, reach a place, protect someone, or make a hard choice. Some scenarios turn survivors against each other: kill someone to pass, or only some of a group can survive. The player faces those choices too, and the survivors and constellations remember what they chose. Difficulty rises from scenario to scenario.

Alongside the main scenarios, smaller optional sub-scenarios pop up in zones. They offer extra rewards, and failing one costs those rewards, not your life.

The 10 scenarios themselves are not written yet. They get drafted during the build and reviewed by Babis before they go in. If an ending idea comes along later, it becomes the last scenario.

## Fights

Fights are turn-based, so skills and items feel exciting because the player chooses when to use them.

1. Each round, the player picks one: attack, use a skill, use an item, or run.
2. The enemy acts according to its own behavior.
3. The log narrates what happened in a line or two.
4. Repeat until one side falls or the player escapes.

Losing a fight means death. Running is the way out of a fight going badly, but it can fail, and a successful escape still costs in-game hours.

Enemies live in data files, each with stats, a behavior pattern, the zones it appears in and what it drops. In the first version the player fights alone; survivor allies joining fights can come later.

## Character growth

Coins are the single currency, and spending them is how the character gets stronger. There are no experience levels.

- **Stats** (four or five, such as strength, agility, endurance and spirit) go up by spending coins on them, with each point costing more than the last.
- **Skills** come from scenario rewards, constellations, the shop and repeated actions, and they level up with use.
- **Items** come from fights, scavenging and the shop: weapons, armor, consumables, and rare drops.
- **Coins** come from clearing scenarios, killing monsters, constellation sponsorship and trading with survivors.

This gives every coin a real choice: get stronger now, or save for something in the shop.

## Constellations

Constellations are powerful beings watching the survivors for entertainment, and which ones take an interest in you depends on how you play.

- Each constellation is original, known by a title rather than a name, with its own taste: one loves bravery, another cruelty, cunning, mercy or style.
- They react in the log as things happen, in short in-character lines.
- Each one tracks its interest in the player. Impress it and it sponsors you with coins; bore or offend it and it loses interest or turns hostile.
- A constellation that is interested enough can offer a sponsorship contract: regular support and a gift such as a skill, in exchange for demands about how you act.

The first version has about 8 constellations, defined in data files so more can be added.

## Other survivors

The MMO feel comes from simulated survivors: the city is full of them, and they live, fight and die whether or not the player is watching.

- About 40 survivors exist at the start of a game, each with a name, stats, a personality and goals.
- At the start they are strangers. The player meets them in zones, where they can talk, trade or fight with them.
- They act on their own over time: forming parties, betraying each other, clearing or failing scenarios, and dying. All of it shows up in the log.
- They remember how the player treated them, and that changes how they act toward the player later.
- There is no ranking board on day one. The system opens it after the first scenario, ranking survivors by what they achieved in scenarios so far. From then on, as their numbers fall, the board tells the story of the city.

## Death

There is one life per game. Losing a fight or failing a main scenario kills the character, and the save is gone for good.

- The death screen shows how far the character got, what killed them, and a few last reactions from the constellations.
- A new game starts completely from zero: new character, new survivors, nothing carried over.
- The game is not built around repeated runs. Its stakes come from that permanence, not from repetition.

## How it gets made

The game is a React project built and maintained in Claude Code, with the game's content kept apart from the code that runs it.

- **Code:** React with TypeScript, set up with Vite. The game rules (fights, time, constellations, survivors) live in plain logic files, separate from the screens.
- **Content:** scenarios, zones, enemies, items, skills, constellations and survivor templates are data files. Adding a scenario means adding a file, not changing the engine.
- **Saving:** automatic, in the browser. Each browser keeps its own save, so the phone and the PC have separate games. Exporting and importing a save can come later.
- **Hosting:** free on GitHub Pages, so the game can be played from any browser, including a phone.
- **Workflow:** this design is approved here first, then turned into a step-by-step build plan for Claude Code.

## Who decided what

| Decision | Choice | Decided by |
| --- | --- | --- |
| Kind of game | Menu-driven browser game, not classic CYOA | Babis |
| Inspiration | MMO mixed with Omniscient Reader | Babis |
| World | Original, not Omniscient Reader's own | Babis |
| Player goal | Not trying to become someone | Babis |
| Tone | Adventure: dangerous but exciting | Babis |
| Time | Real-time energy and world, action-based scenario clocks | Babis |
| Fights | Turn-based | Babis |
| Death | Permadeath, nothing carried over, not a roguelike | Babis |
| Ending | Open-ended, 10 scenarios to start | Babis |
| Survivor-vs-survivor | Scenarios can force the player to harm other survivors | Babis |
| Ranking board | Opens after the first scenario, not on day one | Babis |
| Build | React project in Claude Code | Babis |
| Setting | Invented modern city | Claude |
| Growth | Coins buy stats; no experience levels | Claude |
| Sub-scenarios | Optional; failing costs rewards, not life | Claude |
| Character creation | A name and one starting background, no classes | Claude |
| Numbers | About 8 constellations, about 40 survivors | Claude |
| Fighting alone | No survivor allies in fights in the first version | Claude |
| Look | Dark system-window panels, no art, phone-friendly | Claude |
| Hosting | GitHub Pages; saves per browser | Claude |
| Names, balance, scenario drafts | Placeholders and tuning values; scenarios reviewed by Babis | Builder |
