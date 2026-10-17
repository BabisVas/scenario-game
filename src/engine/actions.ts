// Zone actions: everything the player does on the map costs energy and in-game hours.

import type { ActionId, Content, EnemyDef, ZoneDef } from '../data/schema'
import { withCoinBonus, withHealingBonus } from './attributes'
import { startFight } from './combat'
import { withReactions } from './constellations'
import { recordSkillUse } from './growth'
import { checkHiddenTriggers, countAction } from './hidden'
import { addItem } from './inventory'
import { maxHp } from './newGame'
import type { Rng } from './rng'
import { findTrader, meetSurvivor } from './survivors'
import { AMBUSH_CHANCE_MAX, WARD_ATTACK_CHANCE, WARD_WOUNDS } from './config'
import { checkScenarioClock, recordProgress, spendHours } from './scenario'
import type { Combatant, GameEvent, GameState, StatKey, Step, Survivor, ZoneState } from './types'

export const ACTION_COST: Record<ActionId, { energy: number; hours: number }> = {
  scavenge: { energy: 10, hours: 2 },
  explore: { energy: 15, hours: 3 },
  train: { energy: 20, hours: 4 },
  trade: { energy: 5, hours: 1 },
  rest: { energy: 0, hours: 4 },
  talk: { energy: 5, hours: 1 },
  hunt: { energy: 15, hours: 1 },
}

export type CanAct = { ok: true } | { ok: false; reason: 'energy' | 'sealed' | 'not-here' | 'away' | 'busy' | 'dead' }

const STATS: StatKey[] = ['strength', 'agility', 'endurance', 'spirit']

export function zoneState(state: GameState, zone: ZoneDef): ZoneState {
  return state.zones[zone.id] ?? { sealed: !!zone.startsSealed, dangerBonus: 0 }
}

export function zoneDanger(state: GameState, zone: ZoneDef): number {
  return zone.danger + zoneState(state, zone).dangerBonus
}

export function canAct(state: GameState, zoneId: string, action: ActionId, content: Content): CanAct {
  if (state.phase.kind === 'dead') return { ok: false, reason: 'dead' }
  if (state.fight || state.pendingChoice) return { ok: false, reason: 'busy' }
  const zone = content.zones.find((z) => z.id === zoneId)
  if (!zone || !zone.actions.includes(action)) return { ok: false, reason: 'not-here' }
  if (zoneState(state, zone).sealed) return { ok: false, reason: 'sealed' }
  if (state.zoneId !== zone.id) return { ok: false, reason: 'away' }
  if (state.energy < ACTION_COST[action].energy) return { ok: false, reason: 'energy' }
  return { ok: true }
}

export const TRAVEL_COST = { energy: 5, hours: 1 }

export type CanTravel =
  | { ok: true }
  | { ok: false; reason: 'dead' | 'busy' | 'here' | 'unknown' | 'not-adjacent' | 'sealed' | 'energy' }

export function canTravel(state: GameState, toZoneId: string, content: Content): CanTravel {
  if (state.phase.kind === 'dead') return { ok: false, reason: 'dead' }
  if (state.fight || state.pendingChoice) return { ok: false, reason: 'busy' }
  if (toZoneId === state.zoneId) return { ok: false, reason: 'here' }
  const to = content.zones.find((z) => z.id === toZoneId)
  const from = content.zones.find((z) => z.id === state.zoneId)
  if (!to) return { ok: false, reason: 'unknown' }
  if (!from?.connections.includes(to.id)) return { ok: false, reason: 'not-adjacent' }
  if (zoneState(state, to).sealed) return { ok: false, reason: 'sealed' }
  if (state.energy < TRAVEL_COST.energy) return { ok: false, reason: 'energy' }
  return { ok: true }
}

const TRAVEL_REFUSAL: Record<Exclude<CanTravel, { ok: true }>['reason'], string> = {
  dead: 'You are dead.',
  busy: 'Finish what you are doing first.',
  here: 'You are already here.',
  unknown: 'There is no such place.',
  'not-adjacent': 'You cannot get there from here in one move.',
  sealed: 'That zone is sealed.',
  energy: 'Not enough energy.',
}

/** One move to an adjacent zone. Reach goals are met on arrival; the road can be dangerous. */
export function travel(state: GameState, toZoneId: string, rng: Rng, content: Content): Step {
  const check = canTravel(state, toZoneId, content)
  if (!check.ok) return { state, events: [{ kind: 'system', text: TRAVEL_REFUSAL[check.reason] }] }
  const from = content.zones.find((z) => z.id === state.zoneId)!
  const to = content.zones.find((z) => z.id === toZoneId)!

  let s = spendHours({ ...state, energy: state.energy - TRAVEL_COST.energy, zoneId: to.id }, TRAVEL_COST.hours)
  const events: GameEvent[] = [{ kind: 'player', text: `You leave the ${from.name} for the ${to.name}.` }]
  const run = (step: Step) => {
    s = step.state
    events.push(...step.events)
  }
  s = recordProgress(s, 'reach', { zoneId: to.id }, content)
  run(dangerAfter(s, to, rng, content, ['survive', 'protect', 'reach'], `Ambush on the way into the ${to.name}!`))
  const carried = state.player.inventory.map((i) => i.itemId)
  run(checkHiddenTriggers(s, { zoneId: to.id, carried, arrived: true }, content))
  const clock = checkScenarioClock(s, rng, content)
  return withReactions({ state: clock.state, events: [...events, ...clock.events] }, rng, content)
}

/** Survive, protect and reach scenarios are never safe: any action or arrival in one can be ambushed. */
export function ambushChance(danger: number): number {
  return Math.min(AMBUSH_CHANCE_MAX, 0.1 + 0.05 * danger)
}

function inScenarioOf(state: GameState, content: Content, kinds: string[]): boolean {
  if (state.phase.kind !== 'scenario') return false
  const id = state.phase.scenarioId
  const kind = content.scenarios.find((d) => d.id === id)?.goal.kind
  return !!kind && kinds.includes(kind)
}

/** The ward of a running protect scenario, if they are still alive. */
function wardOf(state: GameState): Survivor | undefined {
  if (state.phase.kind !== 'scenario' || !state.phase.protectedSurvivorId) return undefined
  const id = state.phase.protectedSurvivorId
  return state.survivors.find((v) => v.id === id && v.alive)
}

/**
 * The danger that follows an action or an arrival. While guarding a ward, being
 * away from them puts the ward at risk instead of you. Otherwise, in the listed
 * scenario kinds, the zone may ambush you.
 */
function dangerAfter(s: GameState, zone: ZoneDef, rng: Rng, content: Content, ambushKinds: string[], ambushLine: string): Step {
  const ward = wardOf(s)
  if (ward && s.phase.kind === 'scenario' && s.zoneId !== ward.zoneId) {
    if (!rng.chance(WARD_ATTACK_CHANCE)) return { state: s, events: [] }
    const left = Math.max(0, (s.phase.wardWounds ?? WARD_WOUNDS) - 1)
    const wardZone = content.zones.find((z) => z.id === ward.zoneId)?.name ?? ward.zoneId
    let next: GameState = { ...s, phase: { ...s.phase, wardWounds: left } }
    const events: GameEvent[] = [{ kind: 'survivor', text: `While you are away, ${ward.name} is attacked in the ${wardZone}. ${left} wounds left.` }]
    if (left === 0) {
      next = { ...next, survivors: next.survivors.map((v) => (v.id === ward.id ? { ...v, alive: false, hp: 0, deathNote: 'Fell while waiting for help.' } : v)) }
      events.push({ kind: 'survivor', text: `${ward.name} has fallen.` })
    }
    return { state: next, events }
  }
  if (inScenarioOf(s, content, ambushKinds) && zone.enemyIds.length > 0 && rng.chance(ambushChance(zoneDanger(s, zone)))) {
    const fight = randomFight(s, zone, rng, content, 'hunt')
    return { state: fight.state, events: [{ kind: 'fight', text: ambushLine }, ...fight.events] }
  }
  return { state: s, events: [] }
}

/** An enemy as a fighter, tougher the more dangerous the zone. */
export function combatantFromEnemy(def: EnemyDef, danger: number): Combatant {
  const f = 1 + 0.15 * Math.max(0, danger - 1)
  const hp = Math.round(def.hp * f)
  return {
    name: def.name,
    stats: {
      ...def.stats,
      strength: Math.round(def.stats.strength * f),
      endurance: Math.round(def.stats.endurance * f),
    },
    hp,
    maxHp: hp,
    behavior: def.behavior,
    weaponPower: 0,
    armorPower: 0,
  }
}

const REFUSAL: Record<Exclude<CanAct, { ok: true }>['reason'], string> = {
  energy: 'Not enough energy.',
  sealed: 'That zone is sealed.',
  'not-here': 'You cannot do that here.',
  busy: 'Finish what you are doing first.',
  dead: 'You are dead.',
  away: 'You are not there.',
}

export function doAction(state: GameState, zoneId: string, action: ActionId, rng: Rng, content: Content): Step {
  const check = canAct(state, zoneId, action, content)
  if (!check.ok) return { state, events: [{ kind: 'system', text: REFUSAL[check.reason] }] }
  const zone = content.zones.find((z) => z.id === zoneId)!
  const cost = ACTION_COST[action]

  let s: GameState = { ...state, energy: state.energy - cost.energy, zoneId }
  // A hunt's hour is the hour its fight takes.
  if (action !== 'hunt') s = spendHours(s, cost.hours)
  const events: GameEvent[] = []
  const run = (step: Step) => {
    s = step.state
    events.push(...step.events)
  }

  switch (action) {
    case 'scavenge':
      run(scavenge(s, zone, rng, content))
      break
    case 'explore':
      run(explore(s, zone, rng, content))
      break
    case 'train':
      run(train(s, rng, content))
      break
    case 'rest': {
      const cap = maxHp(s.player.stats)
      const hp = Math.min(cap, s.player.hp + withHealingBonus(s, content, Math.round(cap * 0.3)))
      events.push({ kind: 'player', text: `You rest in the ${zone.name}. +${hp - s.player.hp} HP.` })
      s = { ...s, player: { ...s.player, hp } }
      break
    }
    case 'hunt':
      run(randomFight(s, zone, rng, content, 'hunt'))
      break
    case 'talk':
      run(meetSurvivor(s, zoneId, rng, content))
      break
    case 'trade':
      run(findTrader(s, zoneId, rng))
      break
  }

  if (!s.fight) run(dangerAfter(s, zone, rng, content, ['survive', 'protect', 'reach'], 'Ambush! Something was waiting for you.'))

  s = countAction(s, zoneId, action)
  const carried = state.player.inventory.map((i) => i.itemId)
  run(checkHiddenTriggers(s, { zoneId, action, carried }, content))

  const clock = checkScenarioClock(s, rng, content)
  return withReactions({ state: clock.state, events: [...events, ...clock.events] }, rng, content)
}

function scavenge(s: GameState, zone: ZoneDef, rng: Rng, content: Content): Step {
  const danger = zoneDanger(s, zone)
  const coins = withCoinBonus(s, content, rng.int(danger * 3, danger * 8))
  let next: GameState = { ...s, player: { ...s.player, coins: s.player.coins + coins } }
  const found: string[] = []
  const take = (itemId: string) => {
    next = addItem(next, itemId)
    found.push(`a ${content.items.find((i) => i.id === itemId)?.name ?? itemId}`)
  }
  if (rng.chance(0.2)) {
    const pool = content.enemies.filter((e) => zone.enemyIds.includes(e.id)).flatMap((e) => e.drops.map((d) => d.itemId))
    if (pool.length > 0) take(rng.pick(pool))
  }
  for (const f of zone.finds ?? []) if (rng.chance(f.chance)) take(f.itemId)
  const extra = found.length ? ` and ${found.join(' and ')}` : ''
  return { state: next, events: [{ kind: 'player', text: `You scavenge the ${zone.name}: ${coins} coins${extra}.` }] }
}

const FLAVOR = [
  'You find a wall covered in handwritten warnings. Some are crossed out. Some are in blood.',
  'A radio in a parked car still plays music. Nobody comes to turn it off.',
  'Footprints in the dust lead somewhere you decide not to follow. For now.',
  'Someone has drawn a map on the pavement in chalk. Half of it is wrong.',
]

function explore(s: GameState, zone: ZoneDef, rng: Rng, content: Content): Step {
  const events: GameEvent[] = []
  let next = s
  const offered = content.subScenarios.filter((d) => d.zoneIds.includes(zone.id))
  if (rng.chance(0.3) && !s.subScenario && offered.length > 0) {
    const def = rng.pick(offered)
    next = { ...next, subScenario: { defId: def.id, hoursLeft: def.hours, progress: 0 } }
    events.push({ kind: 'system', text: `Sub-scenario: ${def.title}. ${def.hours} hours. Optional, but the rewards are real.` })
  } else {
    events.push({ kind: 'player', text: rng.pick(FLAVOR) })
  }
  if (rng.chance(0.25)) {
    const fight = randomFight(next, zone, rng, content, 'hunt')
    next = fight.state
    events.push(...fight.events)
  }
  return { state: next, events }
}

/** A training session that does not break through may teach a new trainable skill. */
const TEACH_CHANCE = 0.15

function train(s: GameState, rng: Rng, content: Content): Step {
  if (rng.chance(0.1)) {
    const stat = rng.pick(STATS)
    const next = { ...s, player: { ...s.player, stats: { ...s.player.stats, [stat]: s.player.stats[stat] + 1 } } }
    return { state: next, events: [{ kind: 'player', text: `A breakthrough! Your ${stat} rises to ${next.player.stats[stat]}.` }] }
  }
  const unknown = content.skills.filter((k) => k.trainable && !s.player.skills.some((x) => x.skillId === k.id))
  if (unknown.length > 0 && rng.chance(TEACH_CHANCE)) {
    const def = rng.pick(unknown)
    const next = { ...s, player: { ...s.player, skills: [...s.player.skills, { skillId: def.id, level: 1, uses: 0 }] } }
    return { state: next, events: [{ kind: 'system', text: `Skill learned: ${def.name}. Something in the drill finally clicks.` }] }
  }
  if (s.player.skills.length === 0) {
    return { state: s, events: [{ kind: 'player', text: 'You train until your arms shake. Nothing new clicks yet.' }] }
  }
  const skill = rng.pick(s.player.skills)
  const first = recordSkillUse(s, skill.skillId)
  const second = recordSkillUse(first.state, skill.skillId)
  return {
    state: second.state,
    events: [{ kind: 'player', text: 'You drill your skills until they feel like reflexes.' }, ...first.events, ...second.events],
  }
}

function randomFight(s: GameState, zone: ZoneDef, rng: Rng, content: Content, origin: 'hunt'): Step {
  if (zone.enemyIds.length === 0) return { state: s, events: [{ kind: 'player', text: 'Nothing here wants to fight.' }] }
  const enemyId = rng.pick(zone.enemyIds)
  const def = content.enemies.find((e) => e.id === enemyId)!
  return startFight(s, combatantFromEnemy(def, zoneDanger(s, zone)), origin, { enemyId })
}
