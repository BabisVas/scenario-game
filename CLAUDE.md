# Scenario Browser Game

A single-player, menu-driven browser game: an ordinary survivor lives through deadly system-issued scenarios in an original modern city, with one life per game.

- Spec: `docs/superpowers/specs/2026-10-10-scenario-game-design.md`
- Plan: `docs/superpowers/plans/2026-10-10-scenario-game.md`

## Global Constraints

- The world is original. No character, place, constellation, skill or event names from Omniscient Reader or any other existing work.
- Names not yet chosen (city, system, announcers) are placeholders written as `«CITY»`, `«SYSTEM»`, `«ANNOUNCER»` and defined once in `src/data/names.ts`.
- Nothing bad can happen to the player while the tab is closed. Real-time catch-up may refill energy, move survivors and add log lines, and must never damage the player, spend scenario hours, fail a scenario, or kill a survivor the current scenario depends on.
- Scenario clocks run only on in-game hours spent by player actions.
- One life per game. Death deletes the save. Nothing carries over to a new game.
- Ranking board does not exist until the first main scenario is cleared.
- Coins are the only currency. No experience levels.
- The player fights alone in v1.
- Game must be playable at 375 px wide (phone) and on desktop.
- Engine code (`src/engine/`) never imports React, never reads `Date.now()`, never calls `Math.random()`.
- Tone of all written content: adventure, dangerous but exciting, not dread.

## Folder rules

- `src/engine/` — pure game rules only. Every engine function takes `now` and `rng` as arguments when it needs time or randomness; nothing reads the clock or `Math.random()`. No React.
- `src/data/` — content only (zones, enemies, items, skills, scenarios, constellations, survivor templates). Adding a scenario means adding a data file, not changing the engine.
- `src/ui/` — screens only. Screens read state and dispatch actions through the `useGame` store.
- `src/save/` — saving, loading and the one-tab guard.

## Saves

Updates must never make an existing save unreadable.

- **A change to the save format** (anything stored in `GameState`: a field added, removed, renamed or retyped) must:
  1. bump `SCHEMA_VERSION` in `src/engine/config.ts` (and the `schemaVersion` type in `src/engine/types.ts`);
  2. add a migration from the previous version to the new one in `MIGRATIONS` in `src/save/migrate.ts`;
  3. run `npm run save:fixtures` to record the new version's saved game and save shape in `src/save/fixtures/`, and commit them.
  The tests load the real saved game of every version from `FIRST_SUPPORTED_VERSION` up (the previous version's file is the test of the new migration), and fail if the save format changes without a new version.
- **Never edit or delete a shipped `save-v<N>.json` or `shape-v<N>.json`.** They are the saves players have.
- **Content-only updates must not change the save version.** Content may add anything, but must keep every id an existing save can refer to (items, skills, stigmas, attributes, zones, scenarios, hidden and sub-scenarios, enemies, constellations, backgrounds). The save tests check the recorded saves against the content.

## Commands

- `npm run dev` — play locally
- `npm test` — run all tests
- `npm run typecheck` — type-check
- `npm run build` — production build
- `npm run save:fixtures` — record the current save version's saved game and shape (after a save-format change)

## Working rules

- Stop and ask Babis at every STOP step in the plan.
- **Task 15 (content) is a surprise for Babis.** Never show him scenario text, hidden-scenario details, rumors, announcer lines, constellation lines, item lore or survivor dialogue: not in chat, not in summaries, not in commit messages. At a Task 15 STOP, tell him only what was built (mechanics, in general terms), the test/typecheck/build status, and that the draft (`docs/content/scenarios-draft.md`) is ready to attach to his chat for his reviewer. Questions for Babis must be spoiler-free; anything that needs the content to answer goes in a "Questions for the reviewer" section at the top of the draft.
- All player-facing game text follows the abyssal-epic-style skill (`.claude/skills/abyssal-epic-style/SKILL.md`) in its Browser Game mode.
