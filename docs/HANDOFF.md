# Session handoff (for Claude, 2026-10-17)

The next session should read this first, then `CLAUDE.md`, the plan (`docs/superpowers/plans/2026-10-10-scenario-game.md`) and the spec (`docs/superpowers/specs/2026-10-10-scenario-game-design.md`).

> **Babis must not see scenario content.** Keep every reply to him spoiler-free (see `CLAUDE.md`). This file names mechanics and ids only; the actual text lives in `docs/content/scenarios-draft.md`, which goes to his reviewer, not to him.

## State at handoff

- Branch `main`. Last work commit `2edabe6`; this handoff file is committed on top of it. The working tree is clean.
- 346/346 tests pass; typecheck and build are clean. `SCHEMA_VERSION` is 3.
- Execution skill: **superpowers:executing-plans**, inline (no subagents per task). The user asked for one fresh whole-project review with **superpowers:requesting-code-review** before saying the project is finished.
- Progress ledger (git-ignored, the authoritative task log with every ruling): `.superpowers/sdd/2026-10-10-scenario-game/progress.md`. Its first line names the plan.
- Locally excluded (`.git/info/exclude`, never commit): `review-notes.md` and the root `SKILL.md`. The style skill's committed copy is `.claude/skills/abyssal-epic-style/SKILL.md`.

## Plan tasks

| Task | Status |
| --- | --- |
| 1–14 | **Done.** Each has a `Task N: complete` line in the ledger. Task 14's STOP is passed: Babis gave feedback. |
| 15: Content | **In progress, at step 3 (STOP).** Step 1 (BANNED_NAMES, 48 entries) and step 2 (the draft) are done. The draft has gone through five review rounds. **Steps 4–6 are not started**: no real content data files are written. `src/data/*` still holds the small starter set (4 zones, 6 enemies, 8 items, 6 skills, 1 scenario `s01`, 2 constellations, 2 stigmas, 5 attributes, 1 hidden scenario, 2 sub-scenarios, 10 survivor templates). |
| 16: Publish | **Not started.** It has its own STOP: ask Babis for the repo URL. `gh` is logged in as BabisVas; ask permission before creating a repo. |
| Final review | **Not done.** Run it after Task 16, per the user's original instruction. |

## Review notes

- **`review-notes.md` (round 1): fully done.** Everything it lists is built and committed: §0 leftovers, §1 engine fixes 1–5, §2 content fixes, §3 style rewrite of the draft. See the ledger lines `Round 5 …`. Commits run from `0fb4198` to `2edabe6`.
- **`review-notes-2.md`: not present.** No such file existed anywhere in the project at handoff (searched on 2026-10-17). Babis referred to it, so it is probably still to come from his reviewer.
  - When it appears: read it yourself and never show it to Babis. Follow it the way round 1 was followed: engine items test-first, one commit each; content changes in the draft; generic commit messages; then STOP with a spoiler-free status.
  - If its items conflict with this handoff, the notes win: they are the reviewer speaking for Babis.

## Decisions made in this session that are not in the spec or CLAUDE.md

The **current** rules are listed here; superseded intermediate rules are left out. Full reasoning and costs are in the ledger.

**Engine and rules**
- **Time:** a refill that reaches max resets `energyUpdatedAt` to now (no banked time). `catchUp` restores the player, phase and inGameHour after ticks, so a buggy tick cannot hurt the player.
- **Combat:**
  - damage rolls variance first, then crit;
  - attack skills add power, ×1.25 per level above 1;
  - heal skills restore power HP;
  - buff skills add power as armor against this round's hits;
  - escape skills add power to run odds, capped at 95%;
  - cooldown n means unusable for the next n rounds;
  - defensive enemies still attack on guard rounds.
- **Enemies** scale by danger: hp, strength and endurance × (1 + 0.15 × (danger − 1)). Scenario-fight enemies use danger 1 + floor(number / 3).
- **Actions:** a hunt's hour is the fight's hour (not 1 + 1). Scavenged items come from the zone enemies' drop pools.
- **Travel** (`travel`, `canTravel`, `TRAVEL_COST` 5 energy / 1 hour):
  - you can only act where you stand (`GameState.zoneId`; `canAct` reason `away`);
  - reach goals are met **on arrival only**;
  - arriving rolls the ambush chance in survive, protect and reach scenarios;
  - a zone that seals under you pushes you to the nearest open zone (breadth-first);
  - `ZoneDef.connections` are validated: real zones, both ways, all reachable.
- **Ambushes:** 10% + 5% × effective danger (danger + dangerBonus), in survive and protect scenarios. They never come in rest periods, and the clock waits for the fight.
- **Final Wave:** survive scenarios only. It must be beaten: Run, escape skills and escape stigmas are refused without spending a turn. `ScenarioDef.finalWave` names the enemy at the zone's normal strength. Without one, it is the zone's highest-hp enemy at danger + 1. Hidden survive goals never get one.
- **Protect:** the ward stays in their zone and has `wardWounds` = 3 (`WARD_WOUNDS`).
  - Each zone action or travel arrival **away** from the ward has a 20% chance to wound them (`WARD_ATTACK_CHANCE`).
  - In the ward's zone you get normal ambushes instead.
  - At 0 wounds the ward dies and the scenario fails. World ticks never wound them.
- **Choices:**
  - A `fight` outcome resolves only when won; fleeing re-pends the choice.
  - "Only some survive" (`spareCount`): a group of 4–6 forms at scenario start (`phase.groupIds`), from the player's zone, met survivors first. If the zone is short, others are drawn in; all of them become met and stand in the player's zone.
  - The player picks up to `spareCount` of the group (first picks win), and the rest of the group dies. `spareCount: 0` is a plain button with a warning. The world never kills or moves group members while the choice is open.
  - Outcomes can also carry `cityAttitude` (every living survivor's attitude) and `announce` (an «ANNOUNCER» line).
  - The validator rejects:
    - unknown outcome fields;
    - `kill` without a target;
    - a bad `spareCount`, or a `spareCount` with a target;
    - `cityAttitude` outside ±100;
    - an empty `announce`.
- **Tags (constellation triggers):**
  - bravery: an enemy at least as strong as you (`combatRating`), a win at 25% HP or less, or a fight option in a choice;
  - style: a win with no damage taken, or a crit finish;
  - cunning: a hidden-scenario discovery, or finishing with a skill, stigma or item;
  - loyalty: a kept demand at clear, or giving to a survivor at attitude 30+;
  - greed: robbing or overcharging;
  - cruelty: attacking or robbing;
  - mercy: giving.
- **Survivors:**
  - Trade opens through the zone's `trade` action. Each trade after that is free.
  - Survivors sell non-rare items at `round(price × (1 − attitude/200))` and buy at `floor(price/2)`.
  - **Rob:** caught 30% (50% if brave or ruthless). Caught means no item and a fight (`FightState.loot`); win it to take the item. The victim −40, everyone else in the zone −10 (`witnessed`).
  - **Overcharge** sells at full price (−15). **Give** is +15.
  - Beating a survivor in a fight kills them.
- **Constellations:**
  - One sponsor at a time. A new contract ends the old one (`ended`, interest −30, farewell line).
  - A broken demand **seals** the stigma (contract stays active, no pay, interest −10) until a clear with the demand kept.
  - Offers never overwrite a pending choice. Hidden-scenario discovery gives +15 to all, directly.
- **Stigmas:** power ×1.5, +35% per level, cap `maxLevel` (5). Cooldown key `stigma:<id>`.
- **Attributes:**
  - `effects[]`: one for common and rare, two of different kinds for legendary (validated).
  - Stat effects are applied to the starting stats.
  - Coin bonus applies to scavenging, loot and scenario, sub and hidden rewards; healing bonus to rest, consumables and heal skills/stigmas.
  - The first log line announces the attribute, and liked tags give +10 interest.
- **Hidden scenarios:**
  - one runs at a time; it keeps its clock after the main scenario ends;
  - "carry an item" means held when the action or arrival began;
  - repeat-action counts are cumulative per zone and action (`actionCounts`);
  - meet-N counts talks (`timesMet`);
  - a choose-option trigger met while another hidden scenario runs is lost;
  - rumors: 10% per world tick for undiscovered ones, plus a guaranteed rumor (`windowRumors`) when the scenario before a time-bound window starts.
- **Items:** rare items with an `effect` are usable once (`isUsable`); rare items are never sold by survivors or the shop. Starting gear starts equipped.
- **Store and UI:**
  - `runAction` is pure and exported from `useGame.ts`.
  - The in-tab interval refills energy every second and runs world catch-up every 20 minutes, without a new digest (the digest only appears on load).
  - Content is injectable via `GameContentContext`.
  - The error boundary wraps `App` in `main.tsx` and never touches the save.
- **Saves:** `SCHEMA_VERSION` 3; older saves load as unreadable.

**Process**
- The spec and plan were moved to their correct folders (`git mv`).
- React is pinned to 18. The typecheck script is `tsc -b --noEmit`; bare `tsc --noEmit` checks nothing here.
- Test fixtures (`src/test/fixtures.ts`):
  - `baseState` and `playingState` use `plainContent` (no attributes).
  - `fixtureContent` copies the shipped content plus registered fixture scenarios, hidden scenarios, attributes and items.
  - `seqRng` replays fixed rolls.
- At the Task 15 STOPs, Babis gets only spoiler-free status (CLAUDE.md), and content questions go at the top of the draft under "Questions for the reviewer". The plan's own Task 15 step 3 wording ("show Babis the draft") is superseded.

## Exact next step

1. **Check for `review-notes-2.md`** in the project root.
   - **If present:** read it privately and add it to `.git/info/exclude`. Do what it asks: engine items test-first, one commit each; draft edits in `docs/content/scenarios-draft.md`, kept in the abyssal-epic-style skill's Browser Game mode. Then STOP, telling Babis only what was built in general terms, the test/typecheck/build status, and that the draft is ready for his reviewer.
   - **If absent and Babis says the reviewer approved the draft:** go to Task 15 step 4.
2. **Task 15 step 4:** write the data files from the approved draft.
   - Grow to 8 zones with connections and blurbs, 15 enemies (tags and drops as in the draft), 25 items, 12 skills, 8 stigmas, 16 attributes, 6 hidden scenarios, 8 sub-scenarios, 8 constellations with full line sets, 40 survivor templates, and `s01`–`s10` in `src/data/scenarios/` (add each to `scenarios/index.ts`).
   - Apply the draft's death-screen and digest wording to the UI.
   - Then `npx vitest run` must pass with the validator returning `[]` (step 5), then commit with a generic message (step 6).
   - **Expect fixture breakage** where tests lean on starter content. Before changing ids or numbers, grep the tests:
     - starter ids: `old-market`, `courier`, `quick-strike`, `bandage`, `feral-hound`, `iron-boar`, `flare`, `crowbar`, `mirror-shard`, `rat-swarm`;
     - `s01`'s 12 hours: UI tests expect "8 hours left" after a rest;
     - the starter zone graph: tests assume Riverside Park is not adjacent to the Glass Towers, and `old-market`'s first neighbor is `riverside-park`;
     - danger-3 Subway Tunnels scavenge ranges;
     - the feral hound's coin range 4–9;
     - the rarity-distribution test needs at least one attribute of each rarity;
     - the digest title test (`/while you were gone/i`) changes if the draft's "While you were away" is approved.
   - Prefer keeping load-bearing ids, and adjust tests only where the content truly changes.
3. **Task 16:** deployment workflow and README, then its STOP for the repo URL.
4. **Final review:** run `review-package` and dispatch the code reviewer on the most capable model with superpowers:requesting-code-review. Fix Critical and Important findings test-first, then report: rulings list, deferred minors.

## Tooling notes

- Bash heredocs containing backticks get mangled by the tool wrapper. Write multi-line edits as a `.cjs` script in the scratchpad with the Write tool, then run `node <script> .`.
- Inside `node -e` strings, `/tmp/...` is not translated; use `cygpath -w`.
- The skill scripts live under the plugin directory. `task-start` and `task-done` are in `executing-plans/scripts`; `sdd-workspace` and `review-package` are in `subagent-driven-development/scripts`. The ledger wrapper `vt.sh` is in the workspace dir.
- Dev server: `.claude/launch.json` config `game-dev` (port 5173) via `preview_start`. The browser pane sometimes cannot draw while the app is in the background; retry, or read the page with `find` and `get_page_text`. If Vite serves a stale module after quick successive edits, restart the server.
