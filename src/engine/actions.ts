// Zone actions: everything the player does on the map costs energy and in-game hours.

import type { ActionId, Content, EnemyDef, ZoneDef } from '../data/schema'
import { startFight } from './combat'
import { withReactions } from './constellations'
import { recordSkillUse } from './growth'
import { addItem } from './inventory'
import { maxHp } from './newGame'
import type { Rng } from './rng'
import { findTrader, meetSurvivor } from './survivors'
import { checkScenarioClock, recordProgress, spendHours } from './scenario'
import type { Combatant, GameEvent, GameState, StatKey, Step, ZoneState } from './types'

export const ACTION_COST: Record<ActionId, { energy: number; hours: number }> = {
  scavenge: { energy: 10, hours: 2 },
  explore: { energy: 15, hours: 3 },
  train: { energy: 20, hours: 4 },
  trade: { energy: 5, hours: 1 },
  rest: { energy: 0, hours: 4 },
  talk: { energy: 5, hours: 1 },
  hunt: { energy: 15, hours: 1 },
}

export type CanAct = { ok: true } | { ok: false; reason: 'energy' | 'sealed' | 'not-here' | 'busy' | 'dead' }

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
  if (state.energy < ACTION_COST[action].energy) return { ok: false, reason: 'energy' }
  return { ok: true }
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
}

export function doAction(state: GameState, zoneId: string, action: ActionId, rng: Rng, content: Content): Step {
  const check = canAct(state, zoneId, action, content)
  if (!check.ok) return { state, events: [{ kind: 'system', text: REFUSAL[check.reason] }] }
  const zone = content.zones.find((z) => z.id === zoneId)!
  const cost = ACTION_COST[action]

  let s: GameState = { ...state, energy: state.energy - cost.energy }
  // A hunt's hour is the hour its fight takes.
  if (action !== 'hunt') s = spendHours(s, cost.hours)
  s = recordProgress(s, 'reach', { zoneId }, content)
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
      run(train(s, rng))
      break
    case 'rest': {
      const cap = maxHp(s.player.stats)
      const hp = Math.min(cap, s.player.hp + Math.round(cap * 0.3))
      events.push({ kind: 'player', text: `You rest in the ${zone.name}. +${hp - s.player.hp} HP.` })
      s = { ...s, player: { ...s.player, hp } }
      break
    }
    case 'hunt':
      run(randomFight(s, zone, rng, content, 'hunt'))
      break
    case 'talk':
      run(meetSurvivor(s, zoneId, rng))
      break
    case 'trade':
      run(findTrader(s, zoneId, rng))
      break
  }

  const clock = checkScenarioClock(s, rng, content)
  return withReactions({ state: clock.state, events: [...events, ...clock.events] }, rng, content)
}

function scavenge(s: GameState, zone: ZoneDef, rng: Rng, content: Content): Step {
  const danger = zoneDanger(s, zone)
  const coins = rng.int(danger * 3, danger * 8)
  let next: GameState = { ...s, player: { ...s.player, coins: s.player.coins + coins } }
  let found = ''
  if (rng.chance(0.2)) {
    const pool = content.enemies.filter((e) => zone.enemyIds.includes(e.id)).flatMap((e) => e.drops.map((d) => d.itemId))
    if (pool.length > 0) {
      const itemId = rng.pick(pool)
      next = addItem(next, itemId)
      found = ` and a ${content.items.find((i) => i.id === itemId)?.name ?? itemId}`
    }
  }
  return { state: next, events: [{ kind: 'player', text: `You scavenge the ${zone.name}: ${coins} coins${found}.` }] }
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

function train(s: GameState, rng: Rng): Step {
  if (rng.chance(0.1)) {
    const stat = rng.pick(STATS)
    const next = { ...s, player: { ...s.player, stats: { ...s.player.stats, [stat]: s.player.stats[stat] + 1 } } }
    return { state: next, events: [{ kind: 'player', text: `A breakthrough! Your ${stat} rises to ${next.player.stats[stat]}.` }] }
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
