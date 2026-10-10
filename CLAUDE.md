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

## Commands

- `npm run dev` — play locally
- `npm test` — run all tests
- `npm run typecheck` — type-check
- `npm run build` — production build

## Working rules

- Stop and ask Babis at every STOP step in the plan.
