# Part 1: The City Arc — Design

As of 2026-10-18 · Babis

Builds on `docs/superpowers/specs/2026-10-10-scenario-game-design.md` and everything decided since
(recorded in `CLAUDE.md`, `docs/HANDOFF.md` and the progress ledger). This document is
spoiler-free on purpose: it fixes mechanics and direction, and leaves every scenario, character,
encounter and line of text to the builder, written as a surprise for Babis.

## Why

The first version has solid systems but feels empty, and its scenarios play like game objectives
(kill 5, reach X, survive 24 hours). Babis wants it to feel like the novel he loves: scenarios that
are situations, where survivors are under pressure together, the rules hide loopholes, the story
builds through big turning points, and the people around you matter.

Part 1 rebuilds the scenario arc around that rhythm and adds the systems that make the time between
scenarios full: companions, survivor groups, zone encounters, and live events you can step into.

Part 2 (sketched at the end) takes the story beyond the city.

## Goals

- Every main scenario is a situation that involves other survivors, not a solo objective.
- Every main scenario's rules hide at least one real loophole.
- The arc builds: proof → journey → siege → war → catastrophe, marked by two sponsor selections.
- Survivors matter: some travel with you, fight beside you, ask things of you, and can die or turn
  on you.
- Exploring produces small stories, not just numbers.
- What survivors do to each other happens somewhere you can be, and you can step in.

## Non-goals

- Part 2 (other worlds, scenarios 6–10). Part 1 must not block it, but doesn't build it.
- Real multiplayer.
- Turn-by-turn control of companions in fights.

## Anti-goals (failure even if it works)

- A loophole that is only flavor text. If the rules say it, the engine enforces it, and the clever
  reading actually works.
- Betrayal out of nowhere. Every betrayal has warning signs the player could have read.
- Companions as stat sticks with no voice.
- Encounters that are walls of text. Same format rules as all game text: short blocks, phone-sized.
- Copying the novel. The arc's *shape* follows it; no scenario, rule, character or event does. The
  proof scenario must not be "kill a living thing within a time limit"; it must be its own test.
- Anything harming the player while the tab is closed (unchanged rule).

## Constraints (unchanged, restated)

- Permadeath, one long life, nothing carried between games.
- Original world, placeholders `«CITY»`, `«SYSTEM»`, `«ANNOUNCER»`.
- All player-facing text written with the abyssal-epic-style skill in Browser Game mode.
- Babis never sees content. Status reports to him are spoiler-free; content goes to his reviewer.
- Save migration: existing saves must upgrade (see "Saves" below).
- **Superseded:** the original "the player fights alone in v1" constraint and the "contract offer at
  interest 60" rule. Update `CLAUDE.md` and the original spec to point here.

---

## 1. The new arc (replaces the current 10 main scenarios)

Five main scenarios, in this order. Each one changes the city for the rest of the game.

| # | Shape | What it must do |
| --- | --- | --- |
| 1 | **Proof** | A short, sharp first test that forces every survivor into a hard act within a tight limit, with a deadly penalty and a loophole for whoever reads the rules carefully. Sets the tone. |
| 2 | **Journey** | The survivors must cross the city together. Who travels with whom matters; the route is dangerous; people fall behind. |
| 3 | **Siege** | Hold a place for several in-game days against waves that come at night. Defenses, shared supplies and the other survivors holding it with you all matter. |
| 4 | **War** | Survivor groups compete for something only one group can have. You join a side, lead one, or try to stay out of it, and staying out has its own cost. |
| 5 | **Catastrophe** | One overwhelming enemy that changes the city. A step above anything before it. |

Two **sponsor selections** mark the arc (section 2): one right after scenario 1 clears, one at the
end of the rest period before scenario 5.

After scenario 5, the game rests with the existing "«SYSTEM» is preparing the next scenario"
until Part 2.

### Rules every main scenario follows

- **Others are in it too.** Survivors and groups face the same rules, act on them, and the world
  tick reflects that (who cooperates, who cheats, who dies).
- **At least one real loophole** per scenario, supported by the engine and findable from the
  scenario's own text plus things already shown in the game. Finding one is worth something
  (cunning, constellation attention, an easier or better clear).
- **A clear penalty.** Failure is still death unless the scenario says otherwise.
- **Builder's freedom:** goal kinds, hours, rewards, zone changes and twists are the builder's to
  design. New goal kinds are expected (holding a place, group victory, defeating the catastrophe,
  and whatever the loopholes need). Each new goal kind is engine code, tested.

### The siege needs time of day

Add a time of day derived from `inGameHour` (day and night). The siege's waves come at night. The
builder may use night elsewhere (encounters, ambush odds) if it serves the game; keep it
consistent and shown on screen.

### The catastrophe

- It is one enemy, but more than one fight: it should take stages, and it should be possible to
  prepare for it (companions, items, loopholes, the groups you helped or hurt).
- *(Claude's call, builder may refine)* It moves between zones on a schedule the player can learn,
  damaging the zones it passes through, so where and when you face it matters.
- The existing Final Wave rules do not apply to it; it has its own.
- Survivors die in large numbers during it. The city after it is visibly different.

### Old content

The current 10 main scenarios are replaced. The other content (zones, enemies, items, skills,
attributes, stigmas, constellations, survivors) stays and may be extended or adjusted to fit.
Hidden scenarios and sub-scenarios tied to old scenarios are re-tied to the new arc; keep at least
6 hidden scenarios with the same rules (rumors, guaranteed warning before time-limited windows,
failing never kills).

---

## 2. Sponsor selections (replace free contract offers)

- **When:** right after scenario 1 clears, and at the end of the rest period before scenario 5.
  Sponsors change only at these two moments.
- **Who bids:** the 3 constellations with the highest interest in the player, even if it's low.
  Each shows its stigma (mechanics line plus lore), its demand, and a pitch in its own voice.
- **The choice:** accept one, or decline all.
- **Declining all** *(Claude's call)* is a real path, not a non-choice: you get no stigma, but you
  stay "unclaimed". Every constellation watches you a little more closely: sponsorship coins are
  larger and reactions more frequent, and the second selection's bids are stronger. The exact
  numbers are the builder's.
- **At the second selection,** a current sponsor bids to keep you, and you can keep it, switch,
  or go unclaimed.
- Between selections, interest still builds and decides who bids next time. Demands, sealing and
  sponsorship coins work as now.
- The current "offer a contract when interest reaches 60" mechanic is removed. Active contracts in
  existing saves are kept.

---

## 3. Companions

- **Party size:** up to 3 companions *(Claude's call)*.
- **Recruiting:** you ask a survivor you know. Whether they say yes depends on attitude,
  personality and what they've seen you do. Some name a price or a favor first. Some never join.
- **They travel with you.** Moving, resting and acting take the same time and energy as before.
  Resting heals them too.
- **In fights** *(Claude's call)*, companions act automatically each round according to who they
  are (the brave press in, the kind heal, the cautious guard, schemers play dirty, the ruthless
  finish the job). Outside fights you can set each one to *aggressive* or *careful*. Enemies can
  target companions. Their health shows in the fight screen.
- **They grow** when they fight and when scenarios clear.
- **Loyalty** (0–100) moves with your choices, through the same tags the constellations use, read
  against each companion's personality (a kind companion dislikes cruelty; a ruthless one dislikes
  mercy). Favors, gifts and shared danger raise it.
- **Favors:** now and then a companion asks for something personal, built from existing goal kinds
  (go somewhere, deal with something, give something). Helping raises loyalty; ignoring it costs.
- **Low loyalty:** they leave. **Very low loyalty plus the right personality:** they betray you
  (steal and run, abandon you mid-fight, or turn on you in a choice scenario). Warning signs always
  come first, in the log and in how they speak.
- **Death is permanent.** Constellations react; other companions' loyalty shifts; the survivors who
  knew them remember.
- **Their voice:** companions comment on events, choices and each other, in their own voices.
- **Choice scenarios** treat companions as people: they can be in a group that a choice decides
  about, and they react to what you choose.
- **The tab-closed rule covers companions:** nothing harms them while you're away.

---

## 4. Survivor groups

- **3–4 groups** *(Claude's call)* form during the early scenarios, seeded from the survivors. Each
  has a leader, a home zone, members, and a character of its own. Groups recruit, lose people,
  split and merge over time through the world tick.
- **Your party is a group** once you have at least one companion.
- **You can:** join a group (your companions come with you; the leader gives you tasks; you can
  later leave, or challenge the leader), lead your own, or stay alone.
- **Groups have standing with you,** built from how you've treated their members.
- **They matter in scenarios:** who holds the siege with you, who you fight in the war, who helps
  against the catastrophe.
- **The ranking board** also shows group rankings once it's open.

---

## 5. Zone encounters

- **Exploring** (and sometimes arriving in a zone) can start an encounter from that zone's pool:
  a short situation and 2–3 choices.
- **Outcomes** use a fixed, validated vocabulary built from existing effects: coins, items, health,
  a fight, tags, survivor attitude, companion loyalty, group standing, a rumor or clue, starting a
  favor or chain. The validator rejects outcomes the engine can't run, as with choice outcomes.
- **Conditions:** scenario phase, time of day, items carried, companions present, group
  membership, earlier choices. Encounters are once-only or repeatable with a cooldown.
- **Chains:** some encounters continue in a later one, across scenarios.
- **Size** *(Claude's call)*: about 6 per zone plus about 10 that can happen anywhere. More can be
  added later as data.
- **Safety:** an encounter never kills outright. Danger comes from fights it starts.
- Encounters are a main place for hidden-scenario clues and companion moments.

---

## 6. Live events: stepping into the world

- When the world tick produces something between survivors (a fight, a robbery, a group clash, a
  betrayal, a rescue), it becomes a **live event** in that zone for a while.
- If you're there, or arrive while it's live, you can step in: take a side, stop it, profit from
  it, or walk away. Outcomes move attitudes, group standing, companion loyalty and tags.
- An event nobody steps into resolves on its own. While the tab is closed they resolve by default,
  and none of that touches the player or companions.
- How long an event stays open, given that the world runs in real time and the player's clock runs
  on actions, is the builder's call. The one rule: missing an event is never a punishment.

---

## 7. Saves

- Every change follows the save rules in `CLAUDE.md`: new save version, migration, fixture.
- **Old saves upgrade.** A save in the middle of an old main scenario moves to the rest period
  before the nearest fitting new scenario, keeping the character, inventory, survivors,
  constellations and contracts. The exact mapping is the builder's, tested with the existing
  fixtures.

## 8. Get ready for Part 2 without building it

Zones should belong to a **world** (only the city exists in Part 1), so Part 2 can add other
worlds, each with its own map, without reworking travel, saves or content.

---

## Part 2 sketch (not designed yet)

- After the catastrophe, the system sends survivors to places it controls beyond the city, each
  its own world with its own map, enemies and people.
- Scenarios 6–10 happen there, with the stakes growing in scale.
- The city you come back to has changed.
- It builds on Part 1's systems; mostly new places and content.
- To be designed with Babis once Part 1 is playable.

---

## Who decided what

| Decision | Choice | By |
| --- | --- | --- |
| Feel | Like the novel and webtoon | Babis |
| Additions | Companions, zone encounters, live events | Babis |
| Scenarios | Rebuilt; direction set, details a surprise | Babis |
| Arc rhythm | Proof, journey, siege, war, catastrophe | Babis (agreed) |
| Sponsor selections | After scenario 1 and before the catastrophe | Babis (agreed) |
| After the catastrophe | Beyond the city (Part 2) | Babis |
| Two parts | City arc first, beyond the city second | Babis (agreed) |
| Party size | Up to 3 companions | Claude |
| Companions in fights | Act automatically by personality; aggressive/careful setting | Claude |
| Declining all sponsors | "Unclaimed": no stigma, more attention and coins | Claude |
| Groups | 3–4, with leaders; join, lead or stay alone | Claude |
| Catastrophe | Moves between zones on a learnable schedule, multi-stage | Claude |
| Encounter count | About 6 per zone plus about 10 anywhere | Claude |
| Old saves | Move to the rest period before the nearest new scenario | Claude |
| Scenario goals, hours, rewards, numbers, live-event timing, all content | — | Builder |

## How the build runs

1. Claude Code writes the implementation plan from this design with superpowers:writing-plans,
   since it knows the code as it is now.
2. Systems first (time of day, worlds, sponsor selections, companions, groups, encounters, live
   events), each test-first.
3. Then the content draft in Babis's style, for his reviewer. STOP: Babis passes it on without
   reading it.
4. Then data files, a playtest of the whole arc, a final code review, and deploy.
