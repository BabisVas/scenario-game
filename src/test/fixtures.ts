// Shared test helpers. Test-only: nothing in src/engine, src/data or src/ui imports this.

import { appendEvents } from '../engine/log'
import { newGame } from '../engine/newGame'
import { content } from '../data'
import type { AttributeDef, AttributeEffect, Content, HiddenScenarioDef, ScenarioDef } from '../data/schema'
import type { Rng } from '../engine/rng'
import type { Combatant, ConstellationState, GameState, StigmaState, Survivor, Tag } from '../engine/types'

/** Content with no attributes, so states built from it have none: tests of other rules stay deterministic. */
export const plainContent: Content = { ...content, attributes: [] }

export function baseState(): GameState {
  return newGame({ name: 'Ari', backgroundId: 'courier', seed: 1, now: 0 }, plainContent)
}

/** An in-memory Storage, so tests never touch the real localStorage. */
export function memoryStorage(): Storage {
  const data = new Map<string, string>()
  return {
    get length() {
      return data.size
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, String(v)),
  }
}

type Listener = (e: StorageEvent) => void

/** A window stand-in whose `storage` events the test fires by hand. */
export function fakeWindow() {
  const listeners = new Set<Listener>()
  return {
    addEventListener: ((type: string, fn: Listener) => {
      if (type === 'storage') listeners.add(fn)
    }) as Window['addEventListener'],
    removeEventListener: ((type: string, fn: Listener) => {
      if (type === 'storage') listeners.delete(fn)
    }) as Window['removeEventListener'],
    fireStorage(key: string, newValue: string | null) {
      const e = { key, newValue } as StorageEvent
      for (const fn of [...listeners]) fn(e)
    },
  }
}

export function withCoins(s: GameState, coins: number): GameState {
  return { ...s, player: { ...s.player, coins } }
}

export function withSkill(s: GameState, skillId: string, level = 1): GameState {
  return { ...s, player: { ...s.player, skills: [...s.player.skills, { skillId, level, uses: 0 }] } }
}

export function unarmed(s: GameState): GameState {
  return { ...s, player: { ...s.player, equipped: {} } }
}

export function withItem(s: GameState, itemId: string, qty = 1): GameState {
  return { ...s, player: { ...s.player, inventory: [...s.player.inventory, { itemId, qty }] } }
}

/** An Rng that replays the given rolls in a loop, for deterministic fight tests. */
export function seqRng(...rolls: number[]): Rng {
  let i = 0
  const next = () => rolls[i++ % rolls.length]
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    chance: (p) => next() < p,
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    getState: () => i,
  }
}

export function weakEnemy(): Combatant {
  return {
    name: 'Test Rat', stats: { strength: 3, agility: 3, endurance: 1, spirit: 1 },
    hp: 30, maxHp: 30, behavior: 'aggressive', weaponPower: 0, armorPower: 0,
  }
}

export function brutalEnemy(): Combatant {
  return {
    name: 'Test Titan', stats: { strength: 40, agility: 1, endurance: 30, spirit: 1 },
    hp: 999, maxHp: 999, behavior: 'aggressive', weaponPower: 20, armorPower: 20,
  }
}

export function inFight(s: GameState, enemy: Combatant, ids: { enemyId?: string; survivorId?: string } = {}): GameState {
  return { ...s, fight: { enemy, ...ids, round: 1, cooldowns: {}, origin: 'hunt' } }
}

export function sealZone(s: GameState, zoneId: string): GameState {
  return { ...s, zones: { ...s.zones, [zoneId]: { ...(s.zones[zoneId] ?? { dangerBonus: 0 }), sealed: true } } }
}

// --- Scenario fixtures -------------------------------------------------------
// Scenario tests pass `fixtureContent`: the shipped content plus the fixture
// scenario defs below, registered when a builder is called, so the engine can
// look a def up by the phase's scenarioId like it does in the real game.

export const fixtureContent: Content = {
  ...content,
  scenarios: [...content.scenarios],
  attributes: [...content.attributes],
  hiddenScenarios: [...content.hiddenScenarios],
  items: [...content.items],
}

function register(def: ScenarioDef): ScenarioDef {
  const i = fixtureContent.scenarios.findIndex((d) => d.id === def.id)
  if (i >= 0) fixtureContent.scenarios[i] = def
  else fixtureContent.scenarios.push(def)
  return def
}

const fixtureDef = (id: string, number: number, hours: number, goal: ScenarioDef['goal']): ScenarioDef => ({
  id, number, title: `Fixture ${id}`, announcement: `${id} begins`, rules: [], twist: `${id} twist`,
  hours, goal, rewards: { coins: 20 }, survivorDeathRate: 0,
})

export const surviveDef = ({ hours }: { hours: number }) => register(fixtureDef('fx-survive', 901, hours, { kind: 'survive' }))
export const killDef = ({ hours, count }: { hours: number; count: number }) =>
  register(fixtureDef('fx-kill', 902, hours, { kind: 'kill', count }))
export const reachDef = ({ hours, zoneId }: { hours: number; zoneId: string }) =>
  register(fixtureDef('fx-reach', 903, hours, { kind: 'reach', zoneId }))
export const protectDef = ({ hours }: { hours: number }) => register(fixtureDef('fx-protect', 904, hours, { kind: 'protect' }))
export const choiceDef = () =>
  register(fixtureDef('fx-choice', 905, 6, {
    kind: 'choice',
    prompt: 'Only one of you walks out.',
    fallbackOptionId: 'walk-away',
    options: [
      { id: 'kill-one', label: 'Push someone into the dark', tags: ['cruelty'], target: 'met-survivor', outcome: { kill: true } },
      { id: 'fight-it', label: 'Fight the gatekeeper', tags: ['style'], outcome: { fight: 'feral-hound' } },
      { id: 'walk-away', label: 'Walk away and pay the toll (fallback-marker)', tags: ['mercy'], outcome: { coins: -5 } },
    ],
  }))

export const spareDef = (spareCount = 2) =>
  register(fixtureDef('fx-spare', 906, 6, {
    kind: 'choice',
    prompt: 'The bridge holds two. Choose who crosses.',
    fallbackOptionId: 'refuse',
    options: [
      { id: 'choose', label: 'Choose who crosses', tags: ['cunning'], outcome: { spareCount } },
      { id: 'refuse', label: 'Refuse and pay the toll', tags: ['mercy'], outcome: { coins: -5 } },
      { id: 'crates', label: 'Send the crates across instead', tags: ['greed', 'cruelty'], outcome: { spareCount: 0, coins: 150, cityAttitude: -25, announce: 'FX-ANNOUNCE the whole city heard.' } },
    ],
  }))

export function inScenario(s: GameState, def: ScenarioDef): GameState {
  return {
    ...s,
    phase: { kind: 'scenario', scenarioId: def.id, hoursLeft: def.hours, progress: 0, killsAtStart: s.player.kills },
    pendingChoice: def.goal.kind === 'choice' ? { source: 'scenario', scenarioId: def.id } : null,
  }
}

export function inRest(s: GameState, hoursLeft: number, nextScenarioId: string | null = null): GameState {
  return { ...s, phase: { kind: 'rest', nextScenarioId, hoursLeft } }
}

export function clearedAll(s: GameState, c: Content): GameState {
  return { ...s, clearedScenarioIds: c.scenarios.map((d) => d.id) }
}

export function makeSurvivor(id: string, over: Partial<Survivor> = {}): Survivor {
  return {
    id, name: `Survivor ${id}`, personality: 'kind', stats: { strength: 5, agility: 5, endurance: 5, spirit: 5 },
    hp: 100, alive: true, zoneId: 'old-market', partyId: null, met: false, attitude: 0, memories: [], points: 0, attributeId: null, timesMet: 0, ...over,
  }
}

export function withNoMetSurvivors(s: GameState): GameState {
  return { ...s, survivors: [makeSurvivor('s-0'), makeSurvivor('s-1', { met: true, alive: false })] }
}

// --- Survivor fixtures -------------------------------------------------------

export function baseStateWithSurvivors(): GameState {
  return baseState()
}

export function protecting(s: GameState, survivorId: string): GameState {
  const phase = s.phase.kind === 'scenario' ? s.phase : { kind: 'scenario' as const, scenarioId: 's01', hoursLeft: 12, progress: 0 }
  return { ...s, phase: { ...phase, protectedSurvivorId: survivorId } }
}

export function metOnly(s: GameState, ids: string[]): GameState {
  return { ...s, survivors: s.survivors.map((v) => ({ ...v, met: ids.includes(v.id) })) }
}

export function killSurvivor(s: GameState, id: string): GameState {
  return { ...s, survivors: s.survivors.map((v) => (v.id === id ? { ...v, alive: false } : v)) }
}

export function twoInZone(s: GameState, zoneId: string, ids: string[]): GameState {
  return { ...s, survivors: s.survivors.map((v) => (ids.includes(v.id) ? { ...v, zoneId } : v)) }
}

/** Only the given survivors live, all standing in a zone made absurdly deadly. */
export function deadlyZoneWith(s: GameState, ids: string[]): GameState {
  return {
    ...s,
    zones: { ...s.zones, 'subway-tunnels': { sealed: false, dangerBonus: 95 } },
    survivors: s.survivors.map((v) => ({ ...v, alive: ids.includes(v.id), zoneId: 'subway-tunnels' })),
  }
}

// --- Constellation fixtures --------------------------------------------------

export function braveryLover(c: Content): string {
  return c.constellations.find((k) => (k.likes.bravery ?? 0) > 0)!.id
}

export function withInterest(s: GameState, id: string, interest: number): GameState {
  const prev = s.constellations[id] ?? { interest: 0, contract: 'none', demandMetThisScenario: false }
  return { ...s, constellations: { ...s.constellations, [id]: { ...prev, interest } } }
}

export function withContract(s: GameState, id: string, over: Partial<ConstellationState> = {}): GameState {
  const prev = s.constellations[id] ?? { interest: 0, contract: 'none', demandMetThisScenario: false }
  return { ...s, constellations: { ...s.constellations, [id]: { ...prev, contract: 'active', ...over } } }
}

/** The player is sponsored by this constellation and holds its stigma. */
export function withStigma(s: GameState, constellationId: string, over: Partial<StigmaState> = {}): GameState {
  const def = fixtureContent.constellations.find((c) => c.id === constellationId)!
  const withContractState = withContract(s, constellationId)
  return {
    ...withContractState,
    player: { ...withContractState.player, stigma: { stigmaId: def.contract.stigmaId, constellationId, level: 1, uses: 0, sealed: false, ...over } },
  }
}

/** Content whose constellations are exactly the given ids, each cloned from the first shipped one. */
export function contentWith(ids: string[]): Content {
  const model = content.constellations[0]
  return { ...content, constellations: ids.map((id) => ({ ...model, id, title: `Title ${id}` })) }
}

// --- UI fixtures -------------------------------------------------------------

/** A run that just ended: the death and two farewell lines are the newest log entries. */
export function deadState(cause: string): GameState {
  const s = playingState()
  const dead: GameState = {
    ...s,
    phase: { kind: 'dead', cause },
    inGameHour: 50,
    clearedScenarioIds: ['s01'],
    player: { ...s.player, hp: 0, kills: 7, coins: 42 },
  }
  return appendEvents(dead, [
    { kind: 'system', text: `You died. ${cause}` },
    { kind: 'constellation', text: 'The constellation «A Lamp» watches you fall: "Burn bright, small one."' },
  ])
}

/** A fresh game whose clocks read "just now", so loading it does not catch up or refill. */
export function playingState(): GameState {
  const now = Date.now()
  return { ...baseState(), createdAt: now, lastSeenAt: now, energyUpdatedAt: now, worldTickAt: now }
}

// --- Attribute fixtures --------------------------------------------------------

export function attributeDef(effect: AttributeEffect, over: Partial<AttributeDef> = {}): AttributeDef {
  return { id: 'fx-attr-' + effect.kind, name: 'Fixture ' + effect.kind, blurb: 'A fixture.', rarity: 'common', effects: [effect], tags: [], backgroundWeights: {}, ...over }
}

/** Gives the player a fixture attribute, registered in fixtureContent. */
export function withAttribute(s: GameState, effect: AttributeEffect, tags: Tag[] = []): GameState {
  const def = attributeDef(effect, { tags })
  const i = fixtureContent.attributes.findIndex((a) => a.id === def.id)
  if (i >= 0) fixtureContent.attributes[i] = def
  else fixtureContent.attributes.push(def)
  return { ...s, player: { ...s.player, attributeId: def.id } }
}

/** Shipped content whose only attribute is the given one, so every roll lands on it. */
export function onlyAttribute(def: AttributeDef): Content {
  return { ...content, attributes: [def] }
}

// --- Hidden scenario fixtures ------------------------------------------------

/** A fixture hidden scenario, registered in fixtureContent under the given id. */
export function hiddenDef(id: string, trigger: HiddenScenarioDef['trigger'], over: Partial<HiddenScenarioDef> = {}): HiddenScenarioDef {
  const def: HiddenScenarioDef = {
    id, title: 'Hidden ' + id, announcement: id + ' was here all along.', trigger, goal: { kind: 'survive' }, hours: 6,
    rewards: { coins: 100 }, rumor: 'They say ' + id + ' is real.', ...over,
  }
  const i = fixtureContent.hiddenScenarios.findIndex((d) => d.id === id)
  if (i >= 0) fixtureContent.hiddenScenarios[i] = def
  else fixtureContent.hiddenScenarios.push(def)
  return def
}

/** Removes every fixture hidden scenario, so a test controls exactly which exist. */
export function clearHiddenDefs(): void {
  fixtureContent.hiddenScenarios.length = 0
}

/** Places the player in a zone (as if they had travelled there). */
export function at(s: GameState, zoneId: string): GameState {
  return { ...s, zoneId }
}
