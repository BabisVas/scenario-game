# Scenario Browser Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-player, menu-driven browser game in which an ordinary survivor lives through deadly system-issued scenarios in an original modern city, with one life per game.

**Architecture:** All game rules live in pure TypeScript functions under `src/engine/` that take a `GameState`, an explicit `now` and a seeded `Rng`, and return a new state plus `GameEvent`s. All content (zones, enemies, items, skills, scenarios, constellations, survivor templates) lives in `src/data/` and is checked by a validator at test time. React screens under `src/ui/` only read state and dispatch actions through one `useGame` store that autosaves to `localStorage`.

**Tech Stack:** Vite, React 18, TypeScript (strict), Vitest, React Testing Library, plain CSS with custom properties, GitHub Actions + GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-10-10-scenario-game-design.md`

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

## Review Focus

1. **Device clock goes backwards or jumps years ahead** — the game should treat negative elapsed time as zero and cap catch-up at 7 days, never crash or grant huge rewards. Test in Task 4.
2. **Real-time world tick touches something the scenario depends on** (protected survivor dies, PvP target pool empties while away) — the player must never fail a scenario because the tab was closed. Tests in Task 11.
3. **Corrupt, outdated or half-written save** — the game should show "This save can't be read" with a New Game button, not a white screen. Test in Task 3.
4. **Game open in two tabs** — the older tab should stop acting and say the game is open elsewhere, so the two never overwrite each other's progress. Test in Task 3.
5. **Hard-choice scenario with no eligible survivors** (all met survivors dead or none met) — the scenario must fall back to its fallback option instead of soft-locking. Test in Task 9.

---

### Task 1: Project setup

**Files:**
- Create: project scaffold via Vite (`npm create vite@latest . -- --template react-ts`)
- Create: `CLAUDE.md`, `src/engine/config.ts`, `src/data/names.ts`, `vitest.config.ts`, `src/test/setup.ts`
- Modify: `package.json` (scripts), `vite.config.ts` (`base: './'`)

**Interfaces:**
- Produces: `config.ts` constants used everywhere:
  - `ENERGY_MAX = 100`
  - `ENERGY_REGEN_MS_PER_POINT = 288_000` (full refill in 8 h)
  - `CATCHUP_CAP_MS = 7 * 24 * 60 * 60 * 1000`
  - `WORLD_TICK_MS = 20 * 60 * 1000`
  - `WORLD_TICKS_MAX_PER_CATCHUP = 72`
  - `DIGEST_MAX_ENTRIES = 12`
  - `LOG_MAX_ENTRIES = 300`
  - `REST_PERIOD_HOURS = 24`
  - `SURVIVOR_COUNT = 40`
  - `STAT_START = 5`, `BACKGROUND_STAT_BONUS = 2`
  - `CONTRACT_INTEREST = 60`, `HOSTILE_INTEREST = -40`
  - `SAVE_KEY = 'scenario-game/save/v1'`, `SCHEMA_VERSION = 1`
- Produces: `names.ts` exporting `CITY = '«CITY»'`, `SYSTEM = '«SYSTEM»'`, `ANNOUNCER = '«ANNOUNCER»'`.

- [ ] **Step 1:** Scaffold with Vite react-ts in the repo root, install `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`.
- [ ] **Step 2:** Add scripts `"test": "vitest run"`, `"test:watch": "vitest"`, `"typecheck": "tsc --noEmit"`. Set `"strict": true` in tsconfig.
- [ ] **Step 3:** Write `CLAUDE.md` with: the Global Constraints above verbatim; folder rules (`engine` pure, `data` content only, `ui` screens only); "every engine function takes `now` and `rng` as arguments"; "stop and ask Babis at every STOP step".
- [ ] **Step 4:** Create `config.ts` and `names.ts` with the values above. Delete the Vite demo content.
- [ ] **Step 5:** Run `npm test -- --passWithNoTests && npm run typecheck && npm run build`. Expected: all succeed.
- [ ] **Step 6:** `git init`, commit `chore: project setup`.

---

### Task 2: Core types, seeded RNG, new game

**Files:**
- Create: `src/engine/types.ts`, `src/engine/rng.ts`, `src/engine/newGame.ts`
- Test: `src/engine/rng.test.ts`, `src/engine/newGame.test.ts`

**Interfaces:**
- Produces (`rng.ts`): `createRng(state: number): Rng` where `Rng = { next(): number; int(min: number, max: number): number; chance(p: number): boolean; pick<T>(arr: readonly T[]): T; getState(): number }`. Algorithm: mulberry32.
- Produces (`types.ts`):
  - `StatKey = 'strength' | 'agility' | 'endurance' | 'spirit'`
  - `Player = { name: string; backgroundId: string; stats: Record<StatKey, number>; hp: number; coins: number; inventory: ItemStack[]; equipped: { weapon?: string; armor?: string }; skills: SkillState[]; points: number; kills: number }`
  - `ItemStack = { itemId: string; qty: number }`, `SkillState = { skillId: string; level: number; uses: number }`
  - `Phase = { kind: 'scenario'; scenarioId: string; hoursLeft: number; progress: number; protectedSurvivorId?: string } | { kind: 'rest'; nextScenarioId: string | null; hoursLeft: number } | { kind: 'dead'; cause: string }`
  - `LogKind = 'system' | 'constellation' | 'survivor' | 'fight' | 'player' | 'digest'`
  - `LogEntry = { id: number; kind: LogKind; text: string; inGameHour: number }`
  - `GameEvent = { kind: LogKind; text: string; tags?: Tag[] }`
  - `Tag = 'bravery' | 'cruelty' | 'cunning' | 'mercy' | 'style' | 'cowardice' | 'greed' | 'loyalty'`
  - `Survivor`, `ZoneState`, `ConstellationState`, `FightState`, `PendingChoice`, `ActiveSubScenario` — defined in the tasks that own them (6–11) and added to `types.ts` there.
  - `GameState = { schemaVersion: 1; rngState: number; createdAt: number; lastSeenAt: number; player: Player; energy: number; energyUpdatedAt: number; worldTickAt: number; inGameHour: number; phase: Phase; clearedScenarioIds: string[]; subScenario: ActiveSubScenario | null; fight: FightState | null; pendingChoice: PendingChoice | null; zones: Record<string, ZoneState>; survivors: Survivor[]; constellations: Record<string, ConstellationState>; rankingOpen: boolean; log: LogEntry[]; nextLogId: number; digest: LogEntry[] | null }`
  - `Step = { state: GameState; events: GameEvent[] }`
- Produces (`newGame.ts`): `newGame(input: { name: string; backgroundId: string; seed: number; now: number }, content: Content): GameState` — full energy, `STAT_START` in every stat plus the background's `+BACKGROUND_STAT_BONUS`, the background's starting item, `hp` = `maxHp(stats)`, phase = first scenario with its `hours`, `rankingOpen: false`, survivors generated by `generateSurvivors` (Task 11 — until then an empty array), first log line is the first scenario's announcement.
- Produces: `maxHp(stats: Record<StatKey, number>): number` = `50 + stats.endurance * 10`.

- [ ] **Step 1: Write failing tests**

```ts
test('same seed gives same sequence', () => {
  const a = createRng(42), b = createRng(42);
  expect([a.next(), a.next(), a.int(1, 6)]).toEqual([b.next(), b.next(), b.int(1, 6)]);
});
test('getState resumes the sequence', () => {
  const a = createRng(7); a.next();
  const b = createRng(a.getState());
  expect(b.next()).toBe(a.next());
});
test('int is inclusive and in range', () => {
  const r = createRng(1);
  for (let i = 0; i < 1000; i++) { const v = r.int(2, 4); expect(v >= 2 && v <= 4).toBe(true); }
});
test('new game applies background bonus and starts scenario 1', () => {
  const s = newGame({ name: 'Ari', backgroundId: 'courier', seed: 1, now: 1000 }, testContent);
  expect(s.player.stats.agility).toBe(7);
  expect(s.player.stats.strength).toBe(5);
  expect(s.energy).toBe(100);
  expect(s.phase).toMatchObject({ kind: 'scenario', scenarioId: testContent.scenarios[0].id });
  expect(s.rankingOpen).toBe(false);
  expect(s.player.hp).toBe(100);
});
```

`testContent` is a minimal fixture in `src/engine/testContent.ts` (one background `courier` with `+agility`, one scenario). Grow it in later tasks as needed.

- [ ] **Step 2:** Run `npx vitest run src/engine` — expect FAIL (modules missing).
- [ ] **Step 3:** Implement `rng.ts`, `types.ts`, `newGame.ts` with the signatures above.
- [ ] **Step 4:** Run `npx vitest run src/engine` — expect PASS.
- [ ] **Step 5:** Commit `feat(engine): core types, seeded rng, new game`.

---

### Task 3: Log, save and load

**Files:**
- Create: `src/engine/log.ts`, `src/save/save.ts`, `src/save/tabGuard.ts`
- Test: `src/engine/log.test.ts`, `src/save/save.test.ts`, `src/save/tabGuard.test.ts`

**Interfaces:**
- Consumes: `GameState`, `GameEvent`, `LogEntry`, `SAVE_KEY`, `SCHEMA_VERSION`, `LOG_MAX_ENTRIES`.
- Produces: `appendEvents(state: GameState, events: GameEvent[]): GameState` — numbers entries with `nextLogId`, stamps `inGameHour`, trims to the newest `LOG_MAX_ENTRIES`.
- Produces: `saveGame(state: GameState, storage: Storage): void`, `loadGame(storage: Storage): { ok: true; state: GameState } | { ok: false; reason: 'none' | 'corrupt' | 'version' }`, `deleteSave(storage: Storage): void`.
- Produces: `createTabGuard(opts: { storage: Storage; tabId: string; onTakenOver: () => void; window: Pick<Window, 'addEventListener' | 'removeEventListener'> }): { claim(): void; dispose(): void }` — `claim` writes `{ tabId, at }` to key `scenario-game/active-tab`; a `storage` event on that key with a different `tabId` calls `onTakenOver`.

- [ ] **Step 1: Write failing tests**

```ts
test('log keeps only the newest 300 entries', () => {
  let s = baseState();
  s = appendEvents(s, Array.from({ length: 305 }, (_, i) => ({ kind: 'system', text: `e${i}` })));
  expect(s.log).toHaveLength(300);
  expect(s.log.at(-1)!.text).toBe('e304');
});
test('save then load round-trips', () => {
  const st = memoryStorage(); const s = baseState();
  saveGame(s, st);
  expect(loadGame(st)).toEqual({ ok: true, state: s });
});
test('garbage save reports corrupt', () => {
  const st = memoryStorage(); st.setItem(SAVE_KEY, '{not json');
  expect(loadGame(st)).toEqual({ ok: false, reason: 'corrupt' });
});
test('wrong schema version reports version', () => {
  const st = memoryStorage(); st.setItem(SAVE_KEY, JSON.stringify({ ...baseState(), schemaVersion: 99 }));
  expect(loadGame(st)).toEqual({ ok: false, reason: 'version' });
});
test('a newer tab claiming the game takes over the older one', () => {
  const onTakenOver = vi.fn();
  const win = fakeWindow(); const st = memoryStorage();
  createTabGuard({ storage: st, tabId: 'A', onTakenOver, window: win }).claim();
  win.fireStorage('scenario-game/active-tab', JSON.stringify({ tabId: 'B', at: 2 }));
  expect(onTakenOver).toHaveBeenCalledOnce();
});
```

`memoryStorage`, `fakeWindow`, `baseState` go in `src/test/fixtures.ts`. `loadGame` also returns `corrupt` when required top-level fields (`player`, `phase`, `log`) are missing.

- [ ] **Step 2:** Run `npx vitest run src/engine/log.test.ts src/save` — expect FAIL.
- [ ] **Step 3:** Implement the three modules.
- [ ] **Step 4:** Run the same command — expect PASS.
- [ ] **Step 5:** Commit `feat: log, save/load, tab guard`.

---

### Task 4: Real time — energy and catch-up

**Files:**
- Create: `src/engine/time.ts`
- Test: `src/engine/time.test.ts`

**Interfaces:**
- Consumes: config energy and catch-up constants; `worldTick` from Task 11 is injected as a parameter so this task does not depend on it.
- Produces: `refillEnergy(state: GameState, now: number): GameState` — adds `floor(elapsed / ENERGY_REGEN_MS_PER_POINT)` up to `ENERGY_MAX`, advances `energyUpdatedAt` by the consumed whole points only (remainder kept); elapsed < 0 → resets `energyUpdatedAt` to `now`, energy unchanged.
- Produces: `msUntilNextEnergy(state: GameState, now: number): number` (0 when full).
- Produces: `catchUp(state: GameState, now: number, rng: Rng, tick: (s: GameState, rng: Rng) => Step): Step` — refills energy; runs `min(floor(min(elapsed, CATCHUP_CAP_MS) / WORLD_TICK_MS), WORLD_TICKS_MAX_PER_CATCHUP)` ticks; sets `worldTickAt` and `lastSeenAt` to `now`; if any events were produced, sets `state.digest` to the newest `DIGEST_MAX_ENTRIES` of them as `kind: 'digest'` entries. Never changes `player.hp`, `phase.hoursLeft` or `inGameHour`.

- [ ] **Step 1: Write failing tests**

```ts
test('8 hours away refills from 0 to full', () => {
  const s = { ...baseState(), energy: 0, energyUpdatedAt: 0 };
  expect(refillEnergy(s, 8 * 3600_000).energy).toBe(100);
});
test('partial refill keeps the remainder', () => {
  const s = { ...baseState(), energy: 10, energyUpdatedAt: 0 };
  const r = refillEnergy(s, 288_000 * 3 + 1000);
  expect(r.energy).toBe(13);
  expect(r.energyUpdatedAt).toBe(288_000 * 3);
});
test('clock going backwards changes nothing but the timestamp', () => {
  const s = { ...baseState(), energy: 40, energyUpdatedAt: 10_000 };
  const r = refillEnergy(s, 5_000);
  expect(r.energy).toBe(40);
  expect(r.energyUpdatedAt).toBe(5_000);
});
test('catch-up after a year runs at most 72 ticks', () => {
  const tick = vi.fn((s: GameState) => ({ state: s, events: [] }));
  catchUp({ ...baseState(), worldTickAt: 0 }, 365 * 24 * 3600_000, createRng(1), tick);
  expect(tick).toHaveBeenCalledTimes(72);
});
test('catch-up never touches hp, scenario hours or in-game time', () => {
  const s = baseState();
  const tick = (x: GameState) => ({ state: x, events: [{ kind: 'survivor' as const, text: 'x' }] });
  const r = catchUp(s, s.worldTickAt + 3600_000, createRng(1), tick).state;
  expect(r.player.hp).toBe(s.player.hp);
  expect(r.phase).toEqual(s.phase);
  expect(r.inGameHour).toBe(s.inGameHour);
  expect(r.digest).toHaveLength(3);
});
```

- [ ] **Step 2:** Run `npx vitest run src/engine/time.test.ts` — expect FAIL.
- [ ] **Step 3:** Implement `time.ts`.
- [ ] **Step 4:** Run — expect PASS.
- [ ] **Step 5:** Commit `feat(engine): real-time energy and catch-up`.

---

### Task 5: Content schema, validator and starter content

**Files:**
- Create: `src/data/schema.ts`, `src/data/validate.ts`, `src/data/index.ts`
- Create: `src/data/backgrounds.ts`, `src/data/zones.ts`, `src/data/enemies.ts`, `src/data/items.ts`, `src/data/skills.ts`
- Create: `src/data/scenarios/` (one file per scenario, `s01.ts` … ; Task 15 writes the real ones — here only `s01.ts` as a working draft)
- Create: `src/data/constellations.ts`, `src/data/survivorTemplates.ts` (Task 15 fills them; here 2 constellations and 10 name entries)
- Test: `src/data/content.test.ts`

**Interfaces:**
- Produces (`schema.ts`), all ids are kebab-case strings:
  - `Background = { id; name; blurb; statBonus: StatKey; startingItemId: string }`
  - `ActionId = 'scavenge' | 'explore' | 'train' | 'trade' | 'rest' | 'talk' | 'hunt'`
  - `ZoneDef = { id; name; blurb; danger: 1|2|3|4|5; actions: ActionId[]; enemyIds: string[]; startsSealed?: boolean }`
  - `EnemyDef = { id; name; tags: string[]; stats: Record<StatKey, number>; hp: number; behavior: 'aggressive' | 'defensive' | 'erratic'; coins: [number, number]; drops: { itemId: string; chance: number }[] }`
  - `ItemDef = { id; name; kind: 'weapon' | 'armor' | 'consumable' | 'rare'; power: number; price: number; inShop: boolean; effect?: { heal?: number; damage?: number } }`
  - `SkillDef = { id; name; blurb; kind: 'attack' | 'heal' | 'buff' | 'escape'; power: number; cooldown: number }`
  - `ScenarioGoal = { kind: 'survive' } | { kind: 'kill'; count: number; enemyTag?: string } | { kind: 'reach'; zoneId: string } | { kind: 'protect' } | { kind: 'choice'; prompt: string; options: ChoiceOption[]; fallbackOptionId: string }`
  - `ChoiceOption = { id; label; tags: Tag[]; target?: 'met-survivor'; outcome: { kill?: boolean; spareCount?: number; coins?: number; fight?: string } }` — `target: 'met-survivor'` means the player picks a living survivor they have met; `fight` names an enemy the player must beat.
  - `ScenarioDef = { id; number: number; title; announcement: string; rules: string[]; twist: string; hours: number; goal: ScenarioGoal; rewards: { coins: number; itemIds?: string[]; skillId?: string }; zoneChanges?: { seal?: string[]; open?: string[]; danger?: Record<string, number> }; survivorDeathRate: number }`
  - `ConstellationDef = { id; title; blurb; likes: Partial<Record<Tag, number>>; lines: { like: string[]; dislike: string[]; sponsor: string[]; contract: string[]; death: string[] }; contract: { demandTag: Tag; giftSkillId: string; coinsPerScenario: number } }`
  - `SurvivorTemplate = { name: string; personality: 'brave' | 'cautious' | 'ruthless' | 'kind' | 'schemer' }`
  - `Content = { backgrounds; zones; enemies; items; skills; scenarios: ScenarioDef[] (sorted by number); constellations; survivorTemplates; subScenarios: SubScenarioDef[] }`
  - `SubScenarioDef = { id; zoneIds: string[]; title; goal: { kind: 'kill'; count: number } | { kind: 'reach'; zoneId: string }; hours: number; rewards: { coins: number; itemIds?: string[] } }`
- Produces: `validateContent(c: Content): string[]` — returns human-readable problems; `[]` means valid. Checks: unique ids per collection; every referenced id exists (zone enemies, drops, starting items, rewards, contract gifts, reach zones, fight enemies); scenario numbers are 1..n with no gaps; every `choice` goal's `fallbackOptionId` is one of its options and that option has no `target`; every zone has at least one action; no text contains the strings in `BANNED_NAMES` (a list in `validate.ts` the builder fills with Omniscient Reader proper nouns).
- Produces: `content: Content` from `src/data/index.ts`.

Starter content for this task: 4 backgrounds (one per stat), 4 zones (danger 1–3), 6 enemies, 8 items, 6 skills, scenario `s01` (survive, 12 hours), 2 constellations, 2 sub-scenarios, 10 survivor templates. All flavor text is a first draft.

- [ ] **Step 1: Write failing tests**

```ts
test('shipped content is valid', () => {
  expect(validateContent(content)).toEqual([]);
});
test('dangling enemy reference is reported', () => {
  const bad = { ...content, zones: [{ ...content.zones[0], enemyIds: ['nope'] }] };
  expect(validateContent(bad)).toContainEqual(expect.stringContaining('nope'));
});
test('choice without a target-free fallback is reported', () => {
  const s = { ...content.scenarios[0], goal: { kind: 'choice', prompt: 'p', fallbackOptionId: 'a',
    options: [{ id: 'a', label: 'A', tags: [], target: 'met-survivor', outcome: { kill: true } }] } } as ScenarioDef;
  expect(validateContent({ ...content, scenarios: [s] })).toContainEqual(expect.stringContaining('fallback'));
});
```

- [ ] **Step 2:** Run `npx vitest run src/data` — expect FAIL.
- [ ] **Step 3:** Implement schema, validator and starter content.
- [ ] **Step 4:** Run — expect PASS. Switch `newGame`'s tests to use `content` where `testContent` duplicated it.
- [ ] **Step 5:** Commit `feat(data): content schema, validator, starter content`.

---

### Task 6: Character growth — stats, skills, items, shop

**Files:**
- Create: `src/engine/growth.ts`, `src/engine/inventory.ts`
- Test: `src/engine/growth.test.ts`, `src/engine/inventory.test.ts`

**Interfaces:**
- Produces: `statCost(current: number): number` = `10 * (current - 4)` (5→6 costs 10, 6→7 costs 20).
- Produces: `buyStat(state: GameState, stat: StatKey): Step` — refuses with a `system` event and unchanged state when coins are short; raising endurance raises current `hp` by 10.
- Produces: `recordSkillUse(state: GameState, skillId: string): Step` — `uses + 1`; at `uses >= 5 * level`, `level + 1`, `uses = 0`, and a level-up event.
- Produces: `addItem(state, itemId, qty = 1): GameState`, `removeItem(state, itemId, qty = 1): GameState | null` (null when not enough), `equip(state, itemId): GameState`, `buyFromShop(state, itemId, content): Step`, `sellToShop(state, itemId, content): Step` (sell price = `floor(price / 2)`), `useConsumable(state, itemId, content): Step` (heals up to `maxHp`).

- [ ] **Step 1: Write failing tests**

```ts
test('stat cost rises each point', () => {
  expect([statCost(5), statCost(6), statCost(9)]).toEqual([10, 20, 50]);
});
test('cannot buy a stat without coins', () => {
  const s = withCoins(baseState(), 5);
  const r = buyStat(s, 'strength');
  expect(r.state.player.stats.strength).toBe(5);
  expect(r.events[0].text).toMatch(/not enough coins/i);
});
test('skill levels up after 5 uses at level 1', () => {
  let s = withSkill(baseState(), 'quick-strike');
  for (let i = 0; i < 5; i++) s = recordSkillUse(s, 'quick-strike').state;
  expect(s.player.skills[0]).toMatchObject({ level: 2, uses: 0 });
});
test('healing never exceeds max hp', () => {
  const s = withItem({ ...baseState(), player: { ...baseState().player, hp: 95 } }, 'bandage');
  expect(useConsumable(s, 'bandage', content).state.player.hp).toBe(100);
});
```

- [ ] **Step 2:** Run `npx vitest run src/engine/growth.test.ts src/engine/inventory.test.ts` — expect FAIL.
- [ ] **Step 3:** Implement both modules.
- [ ] **Step 4:** Run — expect PASS.
- [ ] **Step 5:** Commit `feat(engine): stats, skills, inventory, shop`.

---

### Task 7: Turn-based fights

**Files:**
- Create: `src/engine/combat.ts`
- Test: `src/engine/combat.test.ts`

**Interfaces:**
- Consumes: `recordSkillUse`, `useConsumable`, `maxHp`, `Rng`.
- Produces (types): `Combatant = { name: string; stats: Record<StatKey, number>; hp: number; maxHp: number; behavior: EnemyDef['behavior'] | 'survivor'; weaponPower: number; armorPower: number }`; `FightState = { enemy: Combatant; enemyId?: string; survivorId?: string; round: number; cooldowns: Record<string, number>; origin: 'hunt' | 'scenario' | 'survivor' | 'sub' }`.
- Produces: `startFight(state: GameState, enemy: Combatant, origin: FightState['origin'], ids: { enemyId?: string; survivorId?: string }): Step` — costs 1 in-game hour (via `spendHours` from Task 9; until then a local helper in `time.ts` exported as `spendHours(state, hours): GameState`).
- Produces: `fightTurn(state: GameState, action: { kind: 'attack' } | { kind: 'skill'; skillId: string } | { kind: 'item'; itemId: string } | { kind: 'run' }, rng: Rng, content: Content): Step & { result: 'ongoing' | 'won' | 'lost' | 'fled' }`.
- Formulas:
  - damage = `max(1, round((atk.strength * 2 + atk.weaponPower - def.endurance - def.armorPower) * rng between 0.85 and 1.15))`; crit (×1.5) with chance `min(0.3, atk.agility * 0.02)`.
  - run chance = clamp(`0.4 + 0.05 * (player.agility - enemy.agility)`, 0.1, 0.9); success costs 1 more hour; failure gives the enemy a free action.
  - Enemy behavior: aggressive always attacks; defensive halves incoming damage on a round it "guards" (every 3rd round); erratic attacks twice at 25 %, skips at 25 %.
  - Every round emits 1–2 `fight` events, each one short line.
  - Won: enemy coins in range, drops by chance, `player.kills + 1`, events tagged `bravery`. Fled: tagged `cowardice`. Lost: returns `result: 'lost'`; death is applied by Task 9's `killPlayer`.

- [ ] **Step 1: Write failing tests**

```ts
test('attack lowers enemy hp and logs it', () => {
  const s = inFight(baseState(), weakEnemy());
  const r = fightTurn(s, { kind: 'attack' }, createRng(3), content);
  expect(r.state.fight!.enemy.hp).toBeLessThan(weakEnemy().hp);
  expect(r.events.some(e => e.kind === 'fight')).toBe(true);
});
test('killing the enemy wins and clears the fight', () => {
  const s = inFight(baseState(), { ...weakEnemy(), hp: 1 });
  const r = fightTurn(s, { kind: 'attack' }, createRng(3), content);
  expect(r.result).toBe('won');
  expect(r.state.fight).toBeNull();
  expect(r.state.player.kills).toBe(1);
});
test('player at 0 hp loses', () => {
  const s = inFight({ ...baseState(), player: { ...baseState().player, hp: 1 } }, brutalEnemy());
  expect(fightTurn(s, { kind: 'attack' }, createRng(9), content).result).toBe('lost');
});
test('run chance is clamped to 10..90 percent', () => {
  expect(runChance(1, 40)).toBe(0.1);
  expect(runChance(40, 1)).toBe(0.9);
});
test('a skill on cooldown cannot be used', () => {
  const s = { ...inFight(withSkill(baseState(), 'quick-strike'), weakEnemy()) };
  s.fight!.cooldowns['quick-strike'] = 2;
  const r = fightTurn(s, { kind: 'skill', skillId: 'quick-strike' }, createRng(1), content);
  expect(r.events[0].text).toMatch(/not ready/i);
  expect(r.state.fight!.round).toBe(s.fight!.round);
});
```

- [ ] **Step 2:** Run `npx vitest run src/engine/combat.test.ts` — expect FAIL.
- [ ] **Step 3:** Implement `combat.ts` (export `runChance(playerAgility, enemyAgility)` too).
- [ ] **Step 4:** Run — expect PASS.
- [ ] **Step 5:** Commit `feat(engine): turn-based fights`.

---

### Task 8: Zone actions

**Files:**
- Create: `src/engine/actions.ts`
- Test: `src/engine/actions.test.ts`

**Interfaces:**
- Produces: `ACTION_COST: Record<ActionId, { energy: number; hours: number }>` = scavenge 10/2, explore 15/3, train 20/4, trade 5/1, rest 0/4, talk 5/1, hunt 15/1.
- Produces: `canAct(state: GameState, zoneId: string, action: ActionId, content: Content): { ok: true } | { ok: false; reason: 'energy' | 'sealed' | 'not-here' | 'busy' | 'dead' }` — `busy` while `fight` or `pendingChoice` is set.
- Produces: `doAction(state: GameState, zoneId: string, action: ActionId, rng: Rng, content: Content): Step` — spends energy and hours (hours via `spendHours`), then:
  - scavenge: coins `danger * 3..danger * 8`, 20 % chance of a zone-appropriate item.
  - explore: 30 % starts a sub-scenario from `content.subScenarios` for this zone if none active; else a flavor event; 25 % random fight.
  - train: +2 uses to a random owned skill, or +1 stat point at 10 % chance.
  - rest: heals 30 % of max hp.
  - hunt: starts a fight with `rng.pick(zone.enemyIds)`, scaled by zone danger + scenario zoneChanges danger.
  - talk / trade: delegated to Task 11's `meetSurvivor` / `tradeWithSurvivor` (until then, a placeholder event).
  - After the action, calls Task 9's `checkScenarioClock` (until Task 9, a no-op injected later — keep the call site at the end of `doAction`).

- [ ] **Step 1: Write failing tests**

```ts
test('scavenge spends 10 energy and 2 hours', () => {
  const s = baseState();
  const r = doAction(s, 'old-market', 'scavenge', createRng(1), content).state;
  expect(r.energy).toBe(s.energy - 10);
  expect(r.inGameHour).toBe(s.inGameHour + 2);
});
test('no energy blocks the action', () => {
  expect(canAct({ ...baseState(), energy: 4 }, 'old-market', 'scavenge', content)).toEqual({ ok: false, reason: 'energy' });
});
test('sealed zone blocks the action', () => {
  const s = sealZone(baseState(), 'old-market');
  expect(canAct(s, 'old-market', 'rest', content)).toEqual({ ok: false, reason: 'sealed' });
});
test('cannot act during a fight', () => {
  expect(canAct(inFight(baseState(), weakEnemy()), 'old-market', 'rest', content)).toEqual({ ok: false, reason: 'busy' });
});
```

(Zone ids in tests must match starter content; rename in the tests if Task 5 chose different ids.)

- [ ] **Step 2:** Run `npx vitest run src/engine/actions.test.ts` — expect FAIL.
- [ ] **Step 3:** Implement `actions.ts`. Add `ZoneState = { sealed: boolean; dangerBonus: number }` to `types.ts`.
- [ ] **Step 4:** Run — expect PASS.
- [ ] **Step 5:** Commit `feat(engine): zone actions`.

---

### Task 9: Scenarios engine

**Files:**
- Create: `src/engine/scenario.ts`, `src/engine/death.ts`
- Test: `src/engine/scenario.test.ts`

**Interfaces:**
- Produces (types): `ActiveSubScenario = { defId: string; hoursLeft: number; progress: number }`; `PendingChoice = { source: 'scenario'; scenarioId: string } | { source: 'contract'; constellationId: string }`.
- Produces: `spendHours(state: GameState, hours: number): GameState` — moves here from Task 7's helper; decrements `phase.hoursLeft` (scenario or rest) and `subScenario.hoursLeft`, increments `inGameHour`.
- Produces: `recordProgress(state, kind: 'kill' | 'reach', detail: { enemyTags?: string[]; zoneId?: string }, content): GameState` — called by combat wins and by entering a zone (any action in it).
- Produces: `checkScenarioClock(state: GameState, rng: Rng, content: Content): Step` — skipped while `fight` or `pendingChoice` is set (a fight always resolves before the clock is judged). Then:
  - scenario goal met (kill count reached, reach zone visited, survive with `hoursLeft <= 0`, protect with `hoursLeft <= 0` and the protected survivor alive, choice resolved) → `clearScenario`.
  - `hoursLeft <= 0` and not met → `killPlayer(state, cause)`.
  - protect target dead (only possible through player action) → `killPlayer`.
  - `choice` goal starts as `pendingChoice` when the scenario begins.
  - sub-scenario: goal met → rewards; hours out → it ends with a `system` event, no penalty but lost rewards.
  - rest phase `hoursLeft <= 0` → start next scenario, or stay in rest with `nextScenarioId: null` and a "«SYSTEM» is preparing the next scenario" event when content runs out (game keeps playing).
- Produces: `startScenario(state, def: ScenarioDef, rng, content): Step` — announcement event, applies `zoneChanges`, sets `protectedSurvivorId` for `protect` goals (a random living survivor the player has met, else any living survivor), sets `pendingChoice` for `choice` goals.
- Produces: `clearScenario(state, rng, content): Step` — rewards, `clearedScenarioIds`, `player.points += 10 + kills this scenario`, calls Task 11's `resolveScenarioForSurvivors`, sets `rankingOpen = true` after the first clear, enters rest with `REST_PERIOD_HOURS` and announces the next scenario's title and twist.
- Produces: `resolveChoice(state, optionId: string, targetSurvivorId: string | null, rng, content): Step` — when the chosen option has `target: 'met-survivor'`, requires a living met survivor; if none exist the UI only offers the fallback, and the engine coerces to `fallbackOptionId`. Applies outcome (kill target → survivor dead, memories updated for survivors who were present; `fight` → starts fight with `origin: 'scenario'`), emits the option's tags for constellations.
- Produces (`death.ts`): `killPlayer(state, cause: string, content): Step` — phase `dead`, constellation death lines (Task 10's `deathReactions`), emits final events. Deleting the save is the store's job (Task 12).

- [ ] **Step 1: Write failing tests**

```ts
test('surviving the clock clears a survive scenario and opens the ranking', () => {
  let s = inScenario(baseState(), surviveDef({ hours: 2 }));
  s = spendHours(s, 2);
  const r = checkScenarioClock(s, createRng(1), content).state;
  expect(r.phase.kind).toBe('rest');
  expect(r.rankingOpen).toBe(true);
});
test('running out of hours on a kill scenario kills the player', () => {
  let s = inScenario(baseState(), killDef({ hours: 2, count: 3 }));
  s = spendHours(s, 2);
  expect(checkScenarioClock(s, createRng(1), content).state.phase.kind).toBe('dead');
});
test('the clock waits for an open fight', () => {
  let s = inFight(inScenario(baseState(), killDef({ hours: 1, count: 3 })), weakEnemy());
  s = spendHours(s, 1);
  expect(checkScenarioClock(s, createRng(1), content).state.phase.kind).toBe('scenario');
});
test('a choice with no living met survivors falls back', () => {
  const s = inScenario(withNoMetSurvivors(baseState()), choiceDef());
  const r = resolveChoice(s, 'kill-one', null, createRng(1), content);
  expect(r.state.pendingChoice).toBeNull();
  expect(r.events.some(e => /fallback-marker/.test(e.text))).toBe(true);
});
test('failing a sub-scenario costs nothing but the reward', () => {
  let s = { ...baseState(), subScenario: { defId: content.subScenarios[0].id, hoursLeft: 1, progress: 0 } };
  const coins = s.player.coins;
  s = checkScenarioClock(spendHours(s, 1), createRng(1), content).state;
  expect(s.subScenario).toBeNull();
  expect(s.phase.kind).not.toBe('dead');
  expect(s.player.coins).toBe(coins);
});
test('after the last scenario the game stays in rest', () => {
  const s = inRest(clearedAll(baseState(), content), 0);
  const r = checkScenarioClock(s, createRng(1), content).state;
  expect(r.phase).toMatchObject({ kind: 'rest', nextScenarioId: null });
});
```

`choiceDef()` builds a choice scenario whose fallback option's outcome text contains `fallback-marker`.

- [ ] **Step 2:** Run `npx vitest run src/engine/scenario.test.ts` — expect FAIL.
- [ ] **Step 3:** Implement `scenario.ts` and `death.ts`; replace Task 7's local `spendHours` and wire `checkScenarioClock` at the end of `doAction` and after `fightTurn` resolves.
- [ ] **Step 4:** Run `npx vitest run src/engine` — expect PASS (all engine tests).
- [ ] **Step 5:** Commit `feat(engine): scenarios, sub-scenarios, choices, death`.

---

### Task 10: Constellations

**Files:**
- Create: `src/engine/constellations.ts`
- Test: `src/engine/constellations.test.ts`

**Interfaces:**
- Produces (types): `ConstellationState = { interest: number; contract: 'none' | 'offered' | 'active' | 'declined' | 'broken'; demandMetThisScenario: boolean }` — interest clamped to −100..100.
- Produces: `initConstellations(content): Record<string, ConstellationState>` (interest 0) — used by `newGame`.
- Produces: `reactTo(state: GameState, tags: Tag[], rng: Rng, content: Content): Step` — for each constellation, `delta = sum(likes[tag] ?? 0)`; interest += delta. When `|delta| >= 3`, 40 % chance of a `constellation` event with a line from `like` or `dislike`, formatted `The constellation «title» … : "line"`. When `delta > 0` and interest ≥ 20, 30 % chance of sponsorship: coins = `rng.int(5, 15) + floor(interest / 10)`, `sponsor` line. When interest ≥ `CONTRACT_INTEREST` and contract is `none`, sets `pendingChoice = { source: 'contract', constellationId }` and emits the `contract` line. Interest ≤ `HOSTILE_INTEREST` emits a hostile line once.
- Produces: `resolveContract(state, accept: boolean, content): Step` — accept: `active`, gift skill added; decline: `declined`, interest −10.
- Produces: `onScenarioCleared(state, content): Step` — active contracts pay `coinsPerScenario` if `demandMetThisScenario`, else `broken` and interest −30; resets the flag. `reactTo` sets the flag when a tag equal to `demandTag` occurs.
- Produces: `deathReactions(state, rng, content): GameEvent[]` — one `death` line from every constellation with `|interest| >= 20`, at most 3, highest |interest| first.
- Wire: every `Step` from `doAction`, `fightTurn`, `resolveChoice` passes its event tags through `reactTo` (do this in one helper `withReactions(step, rng, content)`).

- [ ] **Step 1: Write failing tests**

```ts
test('liked tag raises interest', () => {
  const s = baseState(); const id = braveryLover(content);
  expect(reactTo(s, ['bravery'], createRng(1), content).state.constellations[id].interest).toBeGreaterThan(0);
});
test('reaching 60 interest offers a contract once', () => {
  const s = withInterest(baseState(), braveryLover(content), 58);
  const r = reactTo(s, ['bravery', 'bravery'], createRng(1), content).state;
  expect(r.pendingChoice).toEqual({ source: 'contract', constellationId: braveryLover(content) });
  const again = reactTo({ ...r, pendingChoice: null }, ['bravery'], createRng(1), content).state;
  expect(again.pendingChoice).toBeNull();
});
test('an unmet demand breaks the contract at scenario clear', () => {
  const s = withContract(baseState(), braveryLover(content), { demandMetThisScenario: false });
  const r = onScenarioCleared(s, content).state.constellations[braveryLover(content)];
  expect(r.contract).toBe('broken');
});
test('death reactions come only from interested constellations, max 3', () => {
  const s = withInterest(withInterest(baseState(), 'a', 50), 'b', 5);
  const ev = deathReactions(s, createRng(1), contentWith(['a', 'b']));
  expect(ev).toHaveLength(1);
});
```

`braveryLover(content)` returns the id of a starter constellation whose `likes.bravery > 0`.

- [ ] **Step 2:** Run `npx vitest run src/engine/constellations.test.ts` — expect FAIL.
- [ ] **Step 3:** Implement and wire `withReactions`.
- [ ] **Step 4:** Run `npx vitest run src/engine` — expect PASS.
- [ ] **Step 5:** Commit `feat(engine): constellations`.

---

### Task 11: Survivors — generation, world tick, memory, ranking

**Files:**
- Create: `src/engine/survivors.ts`, `src/engine/ranking.ts`
- Test: `src/engine/survivors.test.ts`, `src/engine/ranking.test.ts`

**Interfaces:**
- Produces (types): `Survivor = { id: string; name: string; personality: SurvivorTemplate['personality']; stats: Record<StatKey, number>; hp: number; alive: boolean; zoneId: string; partyId: string | null; met: boolean; attitude: number; memories: string[]; points: number; deathNote?: string }` — `attitude` −100..100, `memories` newest 5.
- Produces: `generateSurvivors(content, rng): Survivor[]` — `SURVIVOR_COUNT` survivors; names drawn from templates without repeats (templates may be fewer than 40: combine first and last name parts — `SurvivorTemplate` gains `surname?: string` pools in Task 15; until then, suffix with a number). Stats 3–9 by personality. Wire into `newGame`.
- Produces: `worldTick(state: GameState, rng: Rng, content: Content): Step` — the real-time tick passed to `catchUp`. Picks 1–3 living survivors and rolls one of: form party, leave party, betray party member (`ruthless`/`schemer` only; never kills), trade, move zone, rumor, constellation chatter (20 %), death in zone with chance `zone.danger * 0.01 * (1 - power / 40)`. **Never kills or moves away** the survivor whose id equals `phase.protectedSurvivorId`, and never reduces living met survivors below 1 while a `choice` scenario is current or pending. Never touches `player`.
- Produces: `resolveScenarioForSurvivors(state, def: ScenarioDef, rng): Step` — each living survivor dies with chance `def.survivorDeathRate` adjusted by power, the protected one excepted; survivors gain `points` 3–12; emits a summary event ("23 survivors remain") plus up to 3 named deaths.
- Produces: `survivorsInZone(state, zoneId): Survivor[]`; `meetSurvivor(state, zoneId, rng): Step` (marks `met`, a greeting coloured by attitude and personality; hostile survivors with attitude ≤ −50 start a fight with `origin: 'survivor'` at 50 %); `tradeWithSurvivor(state, survivorId, itemId, mode: 'buy' | 'sell', content): Step` (price × `1 - attitude / 200`); `remember(state, survivorId, memory: 'helped' | 'robbed' | 'spared' | 'attacked' | 'betrayed' | 'traded', delta: number): GameState`; `attackSurvivor(state, survivorId): Step` (starts a fight, tag `cruelty`, every survivor in that zone remembers `attacked` with −20).
- Produces (`ranking.ts`): `rankingRows(state): { name: string; points: number; alive: boolean; isPlayer: boolean }[]` — empty when `!rankingOpen`; otherwise player plus all survivors, living first by points desc, then dead by points desc.

- [ ] **Step 1: Write failing tests**

```ts
test('generates 40 survivors with unique names', () => {
  const sv = generateSurvivors(content, createRng(1));
  expect(sv).toHaveLength(40);
  expect(new Set(sv.map(s => s.name)).size).toBe(40);
});
test('world tick never touches the player', () => {
  const s = baseStateWithSurvivors();
  let r = s;
  for (let i = 0; i < 200; i++) r = worldTick(r, createRng(i), content).state;
  expect(r.player).toEqual(s.player);
});
test('world tick never kills the protected survivor', () => {
  const s = protecting(baseStateWithSurvivors(), 's-0');
  let r = s;
  for (let i = 0; i < 2000; i++) r = worldTick(r, createRng(i), content).state;
  expect(r.survivors.find(x => x.id === 's-0')!.alive).toBe(true);
});
test('world tick keeps one met survivor alive during a choice scenario', () => {
  const s = inScenario(metOnly(baseStateWithSurvivors(), ['s-1']), choiceDef());
  let r = s;
  for (let i = 0; i < 2000; i++) r = worldTick(r, createRng(i), content).state;
  expect(r.survivors.find(x => x.id === 's-1')!.alive).toBe(true);
});
test('no ranking rows before the first clear', () => {
  expect(rankingRows(baseStateWithSurvivors())).toEqual([]);
});
test('ranking lists the living before the dead', () => {
  const s = { ...killSurvivor(baseStateWithSurvivors(), 's-2'), rankingOpen: true };
  const rows = rankingRows(s);
  expect(rows.at(-1)).toMatchObject({ alive: false });
});
test('attacking a survivor makes witnesses remember', () => {
  const s = twoInZone(baseStateWithSurvivors(), 'old-market', ['s-1', 's-2']);
  const r = attackSurvivor(s, 's-1').state;
  expect(r.survivors.find(x => x.id === 's-2')!.memories).toContain('attacked');
});
```

- [ ] **Step 2:** Run `npx vitest run src/engine/survivors.test.ts src/engine/ranking.test.ts` — expect FAIL.
- [ ] **Step 3:** Implement both modules; replace the talk/trade placeholders in `doAction`.
- [ ] **Step 4:** Run `npx vitest run` — expect PASS (everything).
- [ ] **Step 5:** Commit `feat(engine): simulated survivors and ranking`.

---

### Task 12: Game store — wiring engine, time and saves

**Files:**
- Create: `src/ui/useGame.ts`
- Test: `src/ui/useGame.test.tsx`

**Interfaces:**
- Consumes: everything in `src/engine`, `src/save`, `content`.
- Produces: `useGame(): { status: 'loading' | 'no-save' | 'unreadable' | 'playing' | 'dead' | 'taken-over'; state: GameState | null; now: number; act: (a: PlayerAction) => void; newGame: (name: string, backgroundId: string) => void; dismissDigest: () => void }`.
- Produces: `PlayerAction = { kind: 'zone'; zoneId: string; action: ActionId } | { kind: 'fight'; turn: Parameters<typeof fightTurn>[1] } | { kind: 'choice'; optionId: string; targetSurvivorId: string | null } | { kind: 'contract'; accept: boolean } | { kind: 'buyStat'; stat: StatKey } | { kind: 'shop'; mode: 'buy' | 'sell'; itemId: string } | { kind: 'equip'; itemId: string } | { kind: 'useItem'; itemId: string } | { kind: 'meet'; zoneId: string } | { kind: 'trade'; survivorId: string; itemId: string; mode: 'buy' | 'sell' } | { kind: 'attack'; survivorId: string }`.
- Behavior: on mount load the save → `catchUp(state, Date.now(), rng, worldTick)`; claim the tab guard; every `act` builds `rng` from `state.rngState`, runs the engine, `appendEvents`, writes `rngState`, saves; a 1-second interval updates `now` and runs `catchUp` when `now - worldTickAt >= WORLD_TICK_MS` (energy refills while the tab is open). On death: `deleteSave`, keep the dead state in memory for the death screen. `taken-over` stops all saving.

- [ ] **Step 1: Write failing tests** (React Testing Library `renderHook`, fake timers, injected memory storage via a `GameStorageContext`)

```ts
test('no save shows no-save', () => {
  const { result } = renderHook(() => useGame(), { wrapper: withStorage(memoryStorage()) });
  expect(result.current.status).toBe('no-save');
});
test('an action is saved immediately', () => {
  const st = memoryStorage();
  const { result } = renderHook(() => useGame(), { wrapper: withStorage(st) });
  act(() => result.current.newGame('Ari', 'courier'));
  act(() => result.current.act({ kind: 'zone', zoneId: 'old-market', action: 'rest' }));
  expect(loadGame(st)).toMatchObject({ ok: true, state: { inGameHour: 4 } });
});
test('death deletes the save', () => {
  const st = memoryStorage();
  saveGame(nearDeathInLosingFight(), st);
  const { result } = renderHook(() => useGame(), { wrapper: withStorage(st) });
  act(() => result.current.act({ kind: 'fight', turn: { kind: 'attack' } }));
  expect(result.current.status).toBe('dead');
  expect(loadGame(st)).toEqual({ ok: false, reason: 'none' });
});
test('a corrupt save shows unreadable', () => {
  const st = memoryStorage(); st.setItem(SAVE_KEY, 'x');
  const { result } = renderHook(() => useGame(), { wrapper: withStorage(st) });
  expect(result.current.status).toBe('unreadable');
});
```

- [ ] **Step 2:** Run `npx vitest run src/ui` — expect FAIL.
- [ ] **Step 3:** Implement `useGame.ts` and `GameStorageContext` (defaults to `window.localStorage`).
- [ ] **Step 4:** Run `npx vitest run` — expect PASS.
- [ ] **Step 5:** Commit `feat(ui): game store with autosave and catch-up`.

---

### Task 13: Screens — new game, home, map, zone

**Files:**
- Create: `src/ui/theme.css`, `src/ui/App.tsx`, `src/ui/screens/NewGame.tsx`, `src/ui/screens/Unreadable.tsx`, `src/ui/screens/TakenOver.tsx`, `src/ui/screens/Home.tsx`
- Create: `src/ui/panels/StatusPanel.tsx`, `ScenarioPanel.tsx`, `LogPanel.tsx`, `MapPanel.tsx`, `ZonePanel.tsx`, `DigestModal.tsx`, `ChoiceModal.tsx`
- Test: `src/ui/screens/Home.test.tsx`

**Interfaces:**
- Consumes: `useGame`, `canAct`, `ACTION_COST`, `msUntilNextEnergy`, `survivorsInZone`.
- Look (load the `frontend-design` skill before writing CSS): dark "system window" panels — near-black background, thin bright border, monospace headings, a single accent color for system text and a second for constellation text; all colors as CSS custom properties in `theme.css`. Desktop ≥ 900 px: three columns (status | map + zone | scenario + log). Below 700 px: one column with a bottom tab bar `Status · Map · Scenario · Log`.
- Home shows: status window (name, HP bar, energy bar with "next +1 in m:ss", four stats, coins), current scenario (title, goal, hours left, twist) or rest countdown, log (newest first, kind-coloured), map (zones with danger pips; sealed zones greyed), selected zone (actions with energy/hour cost; disabled with the reason from `canAct`; survivors present when met, "someone" otherwise).
- `DigestModal` opens when `state.digest` is set: title "While you were gone", the entries, a Continue button calling `dismissDigest`.
- `ChoiceModal` opens on `pendingChoice`: scenario choices list options; options with `target: 'met-survivor'` show a picker of living met survivors and are hidden when there are none (fallback stays). Contract offers show the constellation line plus Accept / Decline.
- `NewGame`: name field (1–20 chars, trimmed) and background cards; Start disabled until both are set.
- `Unreadable`: "This save can't be read" + New Game. `TakenOver`: "The game is open in another tab."

- [ ] **Step 1: Write failing tests**

```ts
test('home shows scenario hours and disables an action without energy', () => {
  renderWithGame({ ...playingState(), energy: 0 });
  expect(screen.getByText(/hours left/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /scavenge/i })).toBeDisabled();
});
test('no ranking tab before the first clear', () => {
  renderWithGame(playingState());
  expect(screen.queryByText(/ranking/i)).toBeNull();
});
test('the digest shows on return', () => {
  renderWithGame({ ...playingState(), digest: [{ id: 1, kind: 'digest', text: 'A party formed', inGameHour: 0 }] });
  expect(screen.getByText(/while you were gone/i)).toBeInTheDocument();
});
```

`renderWithGame(state)` renders `App` with a storage pre-loaded with `state`.

- [ ] **Step 2:** Run `npx vitest run src/ui` — expect FAIL.
- [ ] **Step 3:** Implement the screens and panels.
- [ ] **Step 4:** Run `npx vitest run` — expect PASS. Run `npm run dev` and check the home screen at 375 px and 1280 px wide in the browser.
- [ ] **Step 5:** Commit `feat(ui): new game, home, map and zone screens`.

---

### Task 14: Screens — fight, shop and inventory, ranking, death

**Files:**
- Create: `src/ui/screens/Fight.tsx`, `src/ui/screens/Death.tsx`, `src/ui/panels/ShopPanel.tsx`, `src/ui/panels/InventoryPanel.tsx`, `src/ui/panels/RankingPanel.tsx`, `src/ui/panels/StatShop.tsx`
- Test: `src/ui/screens/Fight.test.tsx`, `src/ui/screens/Death.test.tsx`

**Interfaces:**
- Fight takes over the screen while `state.fight` is set: both HP bars, round number, the last fight log lines, buttons Attack / Skills (owned skills, cooldown shown, disabled when not ready) / Items (consumables) / Run (shows run chance as a percent).
- Shop: system shop items with `inShop`, buy/sell with prices; disabled when coins are short. Stat shop: four stats with `statCost`. Inventory: equip weapon/armor, use consumables.
- Ranking: `rankingRows`; dead survivors struck through; the player row highlighted. Tab appears only when `rankingOpen`.
- Death: "You died", cause, how far (scenarios cleared, in-game days survived = `floor(inGameHour / 24)`, kills, coins), constellation death lines, a single "Start a new life" button that opens `NewGame`.

- [ ] **Step 1: Write failing tests**

```ts
test('run button shows the run chance', () => {
  renderWithGame(inFight(playingState(), weakEnemy()));
  expect(screen.getByRole('button', { name: /run \(\d+%\)/i })).toBeInTheDocument();
});
test('a skill on cooldown is disabled', () => {
  const s = inFight(withSkill(playingState(), 'quick-strike'), weakEnemy());
  s.fight!.cooldowns['quick-strike'] = 1;
  renderWithGame(s);
  expect(screen.getByRole('button', { name: /quick strike/i })).toBeDisabled();
});
test('death screen shows cause and offers a new life only', () => {
  renderWithGame(deadState('Torn apart in the subway'));
  expect(screen.getByText(/torn apart in the subway/i)).toBeInTheDocument();
  expect(screen.getAllByRole('button')).toHaveLength(1);
});
```

- [ ] **Step 2:** Run `npx vitest run src/ui` — expect FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `npx vitest run && npm run typecheck && npm run build` — expect PASS. Play from new game through scenario 1 in `npm run dev`.
- [ ] **Step 5:** Commit `feat(ui): fight, shop, ranking, death screens`.
- [ ] **Step 6: STOP.** Tell Babis the first playable version is ready, how to run it (`npm run dev`), and ask for his feedback before writing the real content.

---

### Task 15: Content — 10 scenarios, 8 constellations, 40 survivors

**Files:**
- Create/Modify: `src/data/scenarios/s01.ts` … `s10.ts`, `src/data/scenarios/index.ts`, `src/data/constellations.ts`, `src/data/survivorTemplates.ts`, `src/data/zones.ts`, `src/data/enemies.ts`, `src/data/items.ts`, `src/data/skills.ts`, `src/data/subScenarios.ts`
- Create: `docs/content/scenarios-draft.md`
- Test: `src/data/content.test.ts` (existing validator test)

**Content requirements (from the spec):**
- 10 main scenarios, difficulty rising (hours tighter, enemies stronger, `survivorDeathRate` from about 0.15 to 0.35). Goals across the set must include every kind: survive, kill, reach, protect and choice. At least two `choice` scenarios turn survivors against each other (kill someone to pass; only some of a group can survive), each with a fallback. Each scenario has a distinct twist and at least one `zoneChanges` across the set seals, opens and raises danger.
- 8 constellations, each original, known by a title (e.g. "The Ember Who Laughs at Kings" style, but invent them), each with a clearly different taste across the eight tags, 3+ lines per line type, and a contract.
- 40 unique survivor names from an original, mixed-origin name pool; all five personalities represented.
- Zones grown to about 8, enemies to about 15, items to about 25, skills to about 12, sub-scenarios to about 8.
- Tone: adventure, dangerous but exciting. Announcer voice playful and a little cruel. No names from Omniscient Reader; fill `BANNED_NAMES` first.

- [ ] **Step 1:** Fill `BANNED_NAMES` in `validate.ts`.
- [ ] **Step 2:** Write `docs/content/scenarios-draft.md`: for each of the 10 scenarios, title, one-paragraph announcement, goal, hours, twist, rewards; then the 8 constellations (title, taste, two sample lines). Keep it readable as a story outline.
- [ ] **Step 3: STOP.** Show Babis the draft and wait for his changes. Do not write the data files before he approves.
- [ ] **Step 4:** Write the data files from the approved draft.
- [ ] **Step 5:** Run `npx vitest run` — expect PASS (validator returns `[]`).
- [ ] **Step 6:** Commit `content: first ten scenarios, constellations, survivors`.

---

### Task 16: Publish to GitHub Pages

**Files:**
- Create: `.github/workflows/deploy.yml`, `README.md`

**Interfaces:**
- Workflow: on push to `main`, `npm ci`, `npm test`, `npm run build`, upload `dist/` with `actions/upload-pages-artifact`, deploy with `actions/deploy-pages`. `vite.config.ts` keeps `base: './'`.
- README: one paragraph on what the game is, `npm install`, `npm run dev`, `npm test`, how to add a scenario (copy a scenario file, add it to `scenarios/index.ts`, run the tests), and that saves live per browser.

- [ ] **Step 1:** Write the workflow and README.
- [ ] **Step 2:** Run `npm test && npm run build` — expect PASS.
- [ ] **Step 3:** Commit `ci: deploy to GitHub Pages`.
- [ ] **Step 4: STOP.** Ask Babis to create an empty GitHub repository and give its URL (or, if `gh` is signed in, ask permission to create it). Then add the remote, push `main`, and tell him to set Settings → Pages → Source to "GitHub Actions". Report the game's URL once the workflow succeeds.
