// Turn-based fights. Each round: the player acts, then the enemy acts by its behavior.

import type { Content, SkillDef } from '../data/schema'
import { attributeRunBonus, damageMultiplier, withCoinBonus, withHealingBonus } from './attributes'
import { recordSkillUse, recordStigmaUse, spiritMultiplier } from './growth'
import { addItem, heals, isUsable, removeItem, useConsumable } from './inventory'
import { maxHp } from './newGame'
import type { Rng } from './rng'
import { withReactions } from './constellations'
import { killPlayer } from './death'
import { afterFinalWave, afterScenarioFight, checkScenarioClock, recordProgress, spendHours } from './scenario'
import type { Combatant, FightState, GameEvent, GameState, Step, Tag } from './types'

export type FightAction =
  | { kind: 'attack' }
  | { kind: 'skill'; skillId: string }
  | { kind: 'stigma' }
  | { kind: 'item'; itemId: string }
  | { kind: 'run' }
export type FightResult = 'ongoing' | 'won' | 'lost' | 'fled'
export type FightStep = Step & { result: FightResult }

const GUARD_EVERY = 3
/** Winning at or below this share of max HP is brave. */
const BRAVE_HP_SHARE = 0.25

/** How dangerous a fighter is, all in: health, body and gear. Beating an equal or better is brave. */
export function combatRating(c: Combatant): number {
  return c.maxHp + 5 * (c.stats.strength + c.stats.agility + c.stats.endurance) + 5 * (c.weaponPower + c.armorPower)
}
/** Stigmas are lent by constellations: stronger than a skill of the same power. */
const STIGMA_POWER = 1.5
export const STIGMA_COOLDOWN_PREFIX = 'stigma:'

export function runChance(playerAgility: number, enemyAgility: number): number {
  return Math.min(0.9, Math.max(0.1, 0.4 + 0.05 * (playerAgility - enemyAgility)))
}

/** The player's real chance to get away, attribute included (before any escape skill). */
export function playerRunChance(state: GameState, enemy: Combatant, content: Content): number {
  return Math.min(0.95, runChance(state.player.stats.agility, enemy.stats.agility) + attributeRunBonus(state, content))
}

const enemyTags = (fight: FightState, content: Content): string[] =>
  fight.survivorId ? ['survivor'] : (content.enemies.find((e) => e.id === fight.enemyId)?.tags ?? [])

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
  ids: { enemyId?: string; survivorId?: string; loot?: string },
): Step {
  const fight: FightState = { enemy, ...ids, round: 1, cooldowns: {}, origin }
  return {
    state: spendHours({ ...state, fight }, 1),
    events: [{ kind: 'fight', text: `${enemy.name} blocks your way. Fight!` }],
  }
}

/** Running, or any skill or stigma that is an escape. */
function isEscape(action: FightAction, s: GameState, content: Content): boolean {
  if (action.kind === 'run') return true
  if (action.kind === 'skill') return content.skills.find((k) => k.id === action.skillId)?.kind === 'escape'
  if (action.kind === 'stigma') return content.stigmas.find((x) => x.id === s.player.stigma?.stigmaId)?.kind === 'escape'
  if (action.kind === 'item') return !!content.items.find((i) => i.id === action.itemId)?.effect?.escape
  return false
}

const notNow = (state: GameState, text: string): FightStep => ({ state, events: [{ kind: 'system', text }], result: 'ongoing' })

export function fightTurn(state: GameState, action: FightAction, rng: Rng, content: Content): FightStep {
  const fight = state.fight
  const step = fightRound(state, action, rng, content)
  if (!fight || step.result === 'ongoing') return step

  const events = [...step.events]
  if (step.result === 'lost') {
    const death = killPlayer(step.state, `${fight.enemy.name}, round ${fight.round}.`, content, rng)
    return { state: death.state, events: [...events, ...death.events], result: 'lost' }
  }
  let s = step.state
  if (step.result === 'won') {
    const enemyTags = content.enemies.find((e) => e.id === fight.enemyId)?.tags ?? []
    s = recordProgress(s, 'kill', { enemyTags }, content)
    if (fight.survivorId) {
      const note = 'Killed by ' + s.player.name + '.'
      s = { ...s, survivors: s.survivors.map((v) => (v.id === fight.survivorId ? { ...v, alive: false, hp: 0, partyId: null, deathNote: note } : v)) }
    }
  }
  if (fight.origin === 'scenario') s = afterScenarioFight(s, step.result)
  if (fight.origin === 'final-wave' && step.result === 'won') s = afterFinalWave(s)
  const clock = checkScenarioClock(s, rng, content)
  const reacted = withReactions({ state: clock.state, events: [...events, ...clock.events] }, rng, content)
  return { ...reacted, result: step.result }
}

function fightRound(state: GameState, action: FightAction, rng: Rng, content: Content): FightStep {
  const fight = state.fight
  if (!fight) return notNow(state, 'There is no fight.')

  let s = state
  let enemy = { ...fight.enemy }
  const events: GameEvent[] = []
  const guarding = enemy.behavior === 'defensive' && fight.round % GUARD_EVERY === 0
  // Fights the scenario itself sets (Final Waves, choice fights) must be finished: no escape of any kind.
  if (fight.origin === 'final-wave' && isEscape(action, s, content)) return notNow(state, 'There is nowhere left to run. Beat it.')
  if (fight.origin === 'scenario' && isEscape(action, s, content)) return notNow(state, 'The scenario holds you here. This fight has to be finished.')
  let usedSkill: { id: string; cooldown: number } | null = null
  let braced = 0
  let stunned = false
  let finishedWithCrit = false

  const hitEnemy = (bonusPower: number, verb: string, ability = false) => {
    let { damage, crit } = rollDamage(playerCombatant(s, content), enemy, rng, bonusPower)
    // Spirit drives skills and stigmas, not plain blows.
    const mult = damageMultiplier(s, content, enemyTags(fight, content)) * (ability ? spiritMultiplier(s.player.stats.spirit) : 1)
    if (mult !== 1) damage = Math.max(1, Math.round(damage * mult))
    if (guarding) damage = Math.max(1, Math.round(damage / 2))
    enemy = { ...enemy, hp: enemy.hp - damage }
    finishedWithCrit = crit
    const extra = crit ? ' Critical!' : guarding ? ' It guards.' : ''
    events.push({ kind: 'fight', text: `You ${verb} ${enemy.name} for ${damage}.${extra}` })
  }

  /** A skill or stigma taking effect. Escapes are resolved by the caller as a run. */
  const applyAbility = (kind: SkillDef['kind'], power: number, name: string, cooldownKey: string, cooldown: number) => {
    usedSkill = { id: cooldownKey, cooldown }
    if (kind === 'attack') hitEnemy(Math.round(power), `use ${name} on`, true)
    else if (kind === 'heal') {
      const hp = Math.min(maxHp(s.player.stats), s.player.hp + withHealingBonus(s, content, Math.round(power)))
      events.push({ kind: 'fight', text: `${name}. +${hp - s.player.hp} HP.` })
      s = { ...s, player: { ...s.player, hp } }
    } else if (kind === 'buff') {
      braced = Math.round(power)
      events.push({ kind: 'fight', text: `${name}. You brace for the next blow.` })
    }
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
      applyAbility(def.kind, power, def.name, def.id, def.cooldown)
      const used = recordSkillUse(s, def.id)
      s = used.state
      events.push(...used.events)
      // An escape skill is a run with better odds.
      if (def.kind === 'escape') return runAway(s, enemy, fight, rng, content, events, power, usedSkill)
      break
    }
    case 'stigma': {
      const held = s.player.stigma
      const def = held ? content.stigmas.find((x) => x.id === held.stigmaId) : undefined
      if (!held || !def) return notNow(state, 'No constellation has lent you a stigma.')
      if (held.sealed) return notNow(state, `${def.name} is sealed. Keep your sponsor's demand to break the seal.`)
      const key = STIGMA_COOLDOWN_PREFIX + def.id
      if ((fight.cooldowns[key] ?? 0) > 0) return notNow(state, `${def.name} is not ready yet.`)
      const power = def.power * STIGMA_POWER * (1 + 0.35 * (held.level - 1))
      applyAbility(def.kind, power, def.name, key, def.cooldown)
      const used = recordStigmaUse(s, content)
      s = used.state
      events.push(...used.events)
      if (def.kind === 'escape') return runAway(s, enemy, fight, rng, content, events, power, usedSkill)
      break
    }
    case 'item': {
      const def = content.items.find((i) => i.id === action.itemId)
      if (!def || !isUsable(def) || !def.effect || def.effect.statPoint) return notNow(state, 'That cannot be used in a fight.')
      if (def.effect.escape) {
        const removed = removeItem(s, def.id)
        if (!removed) return notNow(state, `You have no ${def.name} left.`)
        events.push({ kind: 'fight', text: `You use the ${def.name}. ${enemy.name} loses you completely.`, tags: ['cowardice'] })
        return { state: spendHours({ ...removed, fight: null }, 1), events, result: 'fled' }
      }
      if (def.effect.damage) {
        const removed = removeItem(s, def.id)
        if (!removed) return notNow(state, `You have no ${def.name} left.`)
        s = removed
        enemy = { ...enemy, hp: enemy.hp - def.effect.damage }
        stunned = !!def.effect.stun
        events.push({ kind: 'fight', text: `You use the ${def.name}. ${enemy.name} takes ${def.effect.damage}.` })
      } else if (heals(def)) {
        const used = useConsumable(s, def.id, content)
        if (used.state === s) return notNow(state, used.events[0]?.text ?? 'That cannot be used.')
        s = used.state
        events.push(...used.events.map((e) => ({ ...e, kind: 'fight' as const })))
      } else return notNow(state, 'That cannot be used in a fight.')
      break
    }
    case 'run':
      return runAway(s, enemy, fight, rng, content, events, 0, null)
  }

  if (enemy.hp <= 0) {
    const flair: Tag[] = []
    const me = playerCombatant(s, content)
    if (combatRating(fight.enemy) >= combatRating(me) || s.player.hp <= me.maxHp * BRAVE_HP_SHARE) flair.push('bravery')
    if ((fight.damageTaken ?? 0) === 0 || finishedWithCrit) flair.push('style')
    if (action.kind !== 'attack') flair.push('cunning')
    return win(s, enemy, fight, rng, content, events, flair)
  }
  return enemyActs(s, enemy, fight, rng, content, events, braced, usedSkill, stunned)
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
  if (rng.chance(Math.min(0.95, playerRunChance(s, enemy, content) + bonus))) {
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
  stunned = false,
): FightStep {
  const guarding = enemy.behavior === 'defensive' && fight.round % GUARD_EVERY === 0
  let attacks = 1
  if (stunned) {
    attacks = 0
    events.push({ kind: 'fight', text: `${enemy.name} reels and loses its turn.` })
  } else if (enemy.behavior === 'erratic') {
    const roll = rng.next()
    attacks = roll < 0.25 ? 2 : roll < 0.5 ? 0 : 1
  }

  let hp = s.player.hp
  if (attacks === 0) {
    if (!stunned) events.push({ kind: 'fight', text: `${enemy.name} twitches and hesitates.` })
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
  const next: FightState = { ...fight, enemy, round: fight.round + 1, cooldowns, damageTaken: (fight.damageTaken ?? 0) + (s.player.hp - hp) }
  return { state: { ...s, fight: next, player: { ...s.player, hp } }, events, result: 'ongoing' }
}

function win(s: GameState, enemy: Combatant, fight: FightState, rng: Rng, content: Content, events: GameEvent[], flair: Tag[]): FightStep {
  const def = fight.enemyId ? content.enemies.find((e) => e.id === fight.enemyId) : undefined
  let next: GameState = { ...s, fight: null, player: { ...s.player, kills: s.player.kills + 1 } }
  events.push({ kind: 'fight', text: `${enemy.name} goes down.`, tags: flair })
  if (fight.loot) {
    next = addItem(next, fight.loot)
    events.push({ kind: 'player', text: `You take the ${content.items.find((i) => i.id === fight.loot)?.name ?? fight.loot}.` })
  }
  if (def) {
    const coins = withCoinBonus(s, content, rng.int(def.coins[0], def.coins[1]))
    const drops = def.drops.filter((d) => rng.chance(d.chance)).map((d) => d.itemId)
    next = { ...next, player: { ...next.player, coins: next.player.coins + coins } }
    for (const itemId of drops) next = addItem(next, itemId)
    const names = drops.map((id) => content.items.find((i) => i.id === id)?.name ?? id)
    events.push({ kind: 'player', text: `+${coins} coins${names.length ? `, found ${names.join(', ')}` : ''}.` })
  }
  return { state: next, events, result: 'won' }
}
