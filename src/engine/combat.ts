// Turn-based fights. Each round: the player acts, then the enemy acts by its behavior.

import type { Content } from '../data/schema'
import { recordSkillUse } from './growth'
import { addItem, removeItem, useConsumable } from './inventory'
import { maxHp } from './newGame'
import type { Rng } from './rng'
import { killPlayer } from './death'
import { afterScenarioFight, checkScenarioClock, recordProgress, spendHours } from './scenario'
import type { Combatant, FightState, GameEvent, GameState, Step } from './types'

export type FightAction = { kind: 'attack' } | { kind: 'skill'; skillId: string } | { kind: 'item'; itemId: string } | { kind: 'run' }
export type FightResult = 'ongoing' | 'won' | 'lost' | 'fled'
export type FightStep = Step & { result: FightResult }

const GUARD_EVERY = 3

export function runChance(playerAgility: number, enemyAgility: number): number {
  return Math.min(0.9, Math.max(0.1, 0.4 + 0.05 * (playerAgility - enemyAgility)))
}

/** Damage from one hit. Rolls variance, then crit. */
export function rollDamage(atk: Combatant, def: Combatant, rng: Rng, bonusPower = 0, bonusArmor = 0): { damage: number; crit: boolean } {
  const raw = atk.stats.strength * 2 + atk.weaponPower + bonusPower - def.stats.endurance - def.armorPower - bonusArmor
  const variance = 0.85 + rng.next() * 0.3
  const crit = rng.chance(Math.min(0.3, atk.stats.agility * 0.02))
  const damage = Math.max(1, Math.round(raw * variance * (crit ? 1.5 : 1)))
  return { damage, crit }
}

/** The player as a fighter, built from their stats and equipped gear. */
export function playerCombatant(state: GameState, content: Content): Combatant {
  const power = (id?: string) => content.items.find((i) => i.id === id)?.power ?? 0
  return {
    name: state.player.name,
    stats: state.player.stats,
    hp: state.player.hp,
    maxHp: maxHp(state.player.stats),
    behavior: 'survivor',
    weaponPower: power(state.player.equipped.weapon),
    armorPower: power(state.player.equipped.armor),
  }
}

export function startFight(
  state: GameState,
  enemy: Combatant,
  origin: FightState['origin'],
  ids: { enemyId?: string; survivorId?: string },
): Step {
  const fight: FightState = { enemy, ...ids, round: 1, cooldowns: {}, origin }
  return {
    state: spendHours({ ...state, fight }, 1),
    events: [{ kind: 'fight', text: `${enemy.name} blocks your way. Fight!` }],
  }
}

const notNow = (state: GameState, text: string): FightStep => ({ state, events: [{ kind: 'system', text }], result: 'ongoing' })

export function fightTurn(state: GameState, action: FightAction, rng: Rng, content: Content): FightStep {
  const fight = state.fight
  const step = fightRound(state, action, rng, content)
  if (!fight || step.result === 'ongoing') return step

  const events = [...step.events]
  if (step.result === 'lost') {
    const death = killPlayer(step.state, `Killed by ${fight.enemy.name} in round ${fight.round}.`, content, rng)
    return { state: death.state, events: [...events, ...death.events], result: 'lost' }
  }
  let s = step.state
  if (step.result === 'won') {
    const enemyTags = content.enemies.find((e) => e.id === fight.enemyId)?.tags ?? []
    s = recordProgress(s, 'kill', { enemyTags }, content)
  }
  if (fight.origin === 'scenario') s = afterScenarioFight(s, step.result)
  const clock = checkScenarioClock(s, rng, content)
  return { state: clock.state, events: [...events, ...clock.events], result: step.result }
}

function fightRound(state: GameState, action: FightAction, rng: Rng, content: Content): FightStep {
  const fight = state.fight
  if (!fight) return notNow(state, 'There is no fight.')

  let s = state
  let enemy = { ...fight.enemy }
  const events: GameEvent[] = []
  const guarding = enemy.behavior === 'defensive' && fight.round % GUARD_EVERY === 0
  let usedSkill: { id: string; cooldown: number } | null = null
  let braced = 0
  let runBonus = 0

  const hitEnemy = (bonusPower: number, verb: string) => {
    let { damage, crit } = rollDamage(playerCombatant(s, content), enemy, rng, bonusPower)
    if (guarding) damage = Math.max(1, Math.round(damage / 2))
    enemy = { ...enemy, hp: enemy.hp - damage }
    const extra = crit ? ' Critical!' : guarding ? ' It guards.' : ''
    events.push({ kind: 'fight', text: `You ${verb} ${enemy.name} for ${damage}.${extra}` })
  }

  switch (action.kind) {
    case 'attack':
      hitEnemy(0, 'hit')
      break
    case 'skill': {
      const owned = s.player.skills.find((k) => k.skillId === action.skillId)
      const def = content.skills.find((k) => k.id === action.skillId)
      if (!owned || !def) return notNow(state, 'You do not know that skill.')
      if ((fight.cooldowns[def.id] ?? 0) > 0) return notNow(state, `${def.name} is not ready yet.`)
      const power = def.power * (1 + 0.25 * (owned.level - 1))
      usedSkill = { id: def.id, cooldown: def.cooldown }
      if (def.kind === 'attack') hitEnemy(Math.round(power), `use ${def.name} on`)
      else if (def.kind === 'heal') {
        const hp = Math.min(maxHp(s.player.stats), s.player.hp + Math.round(power))
        events.push({ kind: 'fight', text: `${def.name}. +${hp - s.player.hp} HP.` })
        s = { ...s, player: { ...s.player, hp } }
      } else if (def.kind === 'buff') {
        braced = Math.round(power)
        events.push({ kind: 'fight', text: `${def.name}. You brace for the next blow.` })
      } else {
        runBonus = power
      }
      const used = recordSkillUse(s, def.id)
      s = used.state
      events.push(...used.events)
      if (def.kind !== 'escape') break
      // An escape skill is a run with better odds.
      return runAway(s, enemy, fight, rng, content, events, runBonus, usedSkill)
    }
    case 'item': {
      const def = content.items.find((i) => i.id === action.itemId)
      if (!def || def.kind !== 'consumable' || !def.effect) return notNow(state, 'That cannot be used in a fight.')
      if (def.effect.damage) {
        const removed = removeItem(s, def.id)
        if (!removed) return notNow(state, `You have no ${def.name} left.`)
        s = removed
        enemy = { ...enemy, hp: enemy.hp - def.effect.damage }
        events.push({ kind: 'fight', text: `You use the ${def.name}. ${enemy.name} takes ${def.effect.damage}.` })
      } else {
        const used = useConsumable(s, def.id, content)
        if (used.state === s) return notNow(state, used.events[0]?.text ?? 'That cannot be used.')
        s = used.state
        events.push(...used.events.map((e) => ({ ...e, kind: 'fight' as const })))
      }
      break
    }
    case 'run':
      return runAway(s, enemy, fight, rng, content, events, 0, null)
  }

  if (enemy.hp <= 0) return win(s, enemy, fight, rng, content, events)
  return enemyActs(s, enemy, fight, rng, content, events, braced, usedSkill)
}

function runAway(
  s: GameState,
  enemy: Combatant,
  fight: FightState,
  rng: Rng,
  content: Content,
  events: GameEvent[],
  bonus: number,
  usedSkill: { id: string; cooldown: number } | null,
): FightStep {
  if (rng.chance(Math.min(0.95, runChance(s.player.stats.agility, enemy.stats.agility) + bonus))) {
    events.push({ kind: 'fight', text: `You break away from ${enemy.name} and run.`, tags: ['cowardice'] })
    return { state: spendHours({ ...s, fight: null }, 1), events, result: 'fled' }
  }
  events.push({ kind: 'fight', text: `You try to run. ${enemy.name} cuts you off.` })
  return enemyActs(s, enemy, fight, rng, content, events, 0, usedSkill)
}

function enemyActs(
  s: GameState,
  enemy: Combatant,
  fight: FightState,
  rng: Rng,
  content: Content,
  events: GameEvent[],
  braced: number,
  usedSkill: { id: string; cooldown: number } | null,
): FightStep {
  const guarding = enemy.behavior === 'defensive' && fight.round % GUARD_EVERY === 0
  let attacks = 1
  if (enemy.behavior === 'erratic') {
    const roll = rng.next()
    attacks = roll < 0.25 ? 2 : roll < 0.5 ? 0 : 1
  }

  let hp = s.player.hp
  if (attacks === 0) {
    events.push({ kind: 'fight', text: `${enemy.name} twitches and hesitates.` })
  } else {
    const me = playerCombatant(s, content)
    let total = 0
    for (let i = 0; i < attacks; i++) total += rollDamage(enemy, me, rng, 0, braced).damage
    hp = Math.max(0, hp - total)
    const twice = attacks === 2 ? ' twice' : ''
    const verb = guarding ? 'guards, then strikes' : 'hits'
    events.push({ kind: 'fight', text: `${enemy.name} ${verb} you${twice} for ${total}.${hp === 0 ? ' You fall.' : ''}` })
  }

  if (hp <= 0) {
    return { state: { ...s, fight: null, player: { ...s.player, hp: 0 } }, events, result: 'lost' }
  }

  const cooldowns: Record<string, number> = {}
  for (const [id, n] of Object.entries(fight.cooldowns)) if (n > 1) cooldowns[id] = n - 1
  if (usedSkill) cooldowns[usedSkill.id] = usedSkill.cooldown
  const next: FightState = { ...fight, enemy, round: fight.round + 1, cooldowns }
  return { state: { ...s, fight: next, player: { ...s.player, hp } }, events, result: 'ongoing' }
}

function win(s: GameState, enemy: Combatant, fight: FightState, rng: Rng, content: Content, events: GameEvent[]): FightStep {
  const def = fight.enemyId ? content.enemies.find((e) => e.id === fight.enemyId) : undefined
  let next: GameState = { ...s, fight: null, player: { ...s.player, kills: s.player.kills + 1 } }
  events.push({ kind: 'fight', text: `${enemy.name} goes down.`, tags: ['bravery'] })
  if (def) {
    const coins = rng.int(def.coins[0], def.coins[1])
    const drops = def.drops.filter((d) => rng.chance(d.chance)).map((d) => d.itemId)
    next = { ...next, player: { ...next.player, coins: next.player.coins + coins } }
    for (const itemId of drops) next = addItem(next, itemId)
    const names = drops.map((id) => content.items.find((i) => i.id === id)?.name ?? id)
    events.push({ kind: 'player', text: `+${coins} coins${names.length ? `, found ${names.join(', ')}` : ''}.` })
  }
  return { state: next, events, result: 'won' }
}
