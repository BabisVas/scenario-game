# Session handoff (for Claude, 2026-10-17, second session)

Read this first, then `CLAUDE.md`, the plan (`docs/superpowers/plans/2026-10-10-scenario-game.md`) and the spec (`docs/superpowers/specs/2026-10-10-scenario-game-design.md`).

> **Babis must not see scenario content.** Keep every reply to him spoiler-free (see `CLAUDE.md`). This file names mechanics and ids only; the text lives in `src/data/` and in `docs/content/scenarios-draft.md`, which goes to his reviewer, not to him.

## State at handoff

- Branch `main`, pushed to https://github.com/BabisVas/scenario-game (public). Every push to `main` deploys to https://babisvas.github.io/scenario-game/ (Pages source: GitHub Actions). 490 tests pass (1 skipped: the fixture writer); typecheck and build are clean. `SCHEMA_VERSION` is 3.
- **Save migration is in place** (`src/save/migrate.ts`). Babis has started playing: follow the "Saves" rule in CLAUDE.md for every change to the save format.
- Execution skill: **superpowers:executing-plans**, inline. Ledger with every ruling: `.superpowers/sdd/2026-10-10-scenario-game/progress.md` (git-ignored; first line names the plan).
- Locally excluded (`.git/info/exclude`, never commit): `review-notes.md`, `review-notes-2.md` (reviewer-only; Babis must not read them) and the root `SKILL.md`.

## Plan tasks

| Task | Status |
| --- | --- |
| 1–15 | **Done.** Each has a `Task N: complete` line in the ledger. All content data files are written (8 zones, 15 enemies, 25 items, 12 skills, 8 stigmas, 16 attributes, 6 hidden, 8 sub-scenarios, 8 constellations, 40 survivors, greetings, flavor, s01–s10). |
| 16: Publish | **Done.** Repo created with gh, Pages enabled via the API, first deploy succeeded. |
| Final review | **Done** before the push (fresh reviewer, opus). Critical and Important findings fixed test-first; deferred minors and rulings are in the ledger under `Final:`. |

## Review rounds

- `review-notes.md` (round 1) and `review-notes-2.md` (round 2): **fully done.** Round 2 said no further content review stop is needed. The draft's "Questions for the reviewer" now holds eight new questions (spoiler-free summary for Babis: about a too-easy hidden discovery, enemy stats, skill sources, two zones without rest, unfleeable scenario fights, Final Wave strength, deal costs).

## Rules added in this session (beyond the earlier handoff)

- Spirit: ×(1 + 0.04 × (spirit − 5)) on skill/stigma damage and all healing; no penalty below 5.
- Rare items: `effect.statPoint` (out of fights, the player picks the stat), `effect.stun` (with damage: the enemy skips its turn), `effect.escape` (sure flee, refused in scenario fights and Final Waves), `effect.fullHeal`; `passive.coinPercent` while carried (every coin source; sales and sponsors get only the charm, not the attribute).
- Hidden: survive goals may name a `zoneId` (pays only if you stand there); a trigger waits while its goal zone is sealed; carry-item triggers fire on arrival only; no Final Wave ever.
- Zones: `finds` (scavenge-only items), `proper` (no "the" in sentences, via `zoneRef`).
- Reach scenarios: ambush on every action; ambush chance capped at 50%.
- Named Final Waves and choice fights: `scenarioFightDanger(number) = 1 + floor(number / 3)`, wherever you stand. Fights a scenario arranges cannot be fled.
- Survivor deals (trade, sell, overcharge, rob, give) cost 5 energy and 1 hour; overcharge = 75% of price. A ward is never hostile, never attacks, cannot be attacked.
- Skills: `price` (shop) and `trainable` (15% per non-breakthrough training).
- Greetings in data by personality and attitude band, rotating per survivor. Flavor (explore lines, world rumors) in data.
- Digest opens with a true system line (losses only if someone died). Death causes and the death screen use the bracketed record voice; so do clears, failures, attributes, stigmas and level-ups.
- Load: a save that throws during catch-up shows "can't be read" and stays untouched.
- Balance: `src/data/balance.test.ts` with player profiles in `src/test/balance.ts`.

## Exact next step

Nothing is pending. Wait for Babis or his reviewer. Use superpowers:finishing-a-development-branch when he says the build is finished, then delete the plan workspace.

## Tooling notes

- Bash heredocs mangle backticks and backslashes: write edits as a `.cjs` script in the scratchpad (Write tool) or use the Edit tool. A lost backslash in a regex caused one bug this session.
- The browser pane was hidden all session: drive the dev server (`game-dev`, port 5173) with `javascript_tool` clicking real buttons; a helper source is stored in the page's localStorage under `Tsrc`.
