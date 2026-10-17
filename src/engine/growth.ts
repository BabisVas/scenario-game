// Getting stronger: coins buy stats, and skills level up with use.

import type { Content } from '../data/schema'
import { SPIRIT_PER_POINT, STAT_START } from './config'
import type { GameState, StatKey, Step } from './types'

/** Spirit's reach: skill and stigma damage, and every heal. Below the starting value it costs nothing. */
export function spiritMultiplier(spirit: number): number {
  return 1 + SPIRIT_PER_POINT * Math.max(0, spirit - STAT_START)
}

const STAT_LABEL: Record<StatKey, string> = {
  strength: 'Strength',
  agility: 'Agility',
  endurance: 'Endurance',
  spirit: 'Spirit',
}

const titleCase = (id: string) => id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')

/** Coins to raise a stat from `current` to `current + 1`. */
export function statCost(current: number): number {
  return 10 * (current - 4)
}

export function buyStat(state: GameState, stat: StatKey): Step {
  const current = state.player.stats[stat]
  const cost = statCost(current)
  if (state.player.coins < cost) {
    return { state, events: [{ kind: 'system', text: `Not enough coins: ${STAT_LABEL[stat]} ${current + 1} costs ${cost}.` }] }
  }
  const player = {
    ...state.player,
    coins: state.player.coins - cost,
    stats: { ...state.player.stats, [stat]: current + 1 },
    hp: stat === 'endurance' ? state.player.hp + 10 : state.player.hp,
  }
  return {
    state: { ...state, player },
    events: [{ kind: 'player', text: `${STAT_LABEL[stat]} rises to ${current + 1}. (−${cost} coins)` }],
  }
}

/** Learning a skill from the system shop. */
export function buySkill(state: GameState, skillId: string, content: Content): Step {
  const def = content.skills.find((k) => k.id === skillId)
  const refuse = (text: string): Step => ({ state, events: [{ kind: 'system', text }] })
  if (!def || def.price === undefined) return refuse('The shop does not teach that.')
  if (state.player.skills.some((k) => k.skillId === skillId)) return refuse(`You already know ${def.name}.`)
  if (state.player.coins < def.price) return refuse(`Not enough coins: ${def.name} costs ${def.price}.`)
  const player = { ...state.player, coins: state.player.coins - def.price, skills: [...state.player.skills, { skillId, level: 1, uses: 0 }] }
  return { state: { ...state, player }, events: [{ kind: 'player', text: `You learn ${def.name} for ${def.price} coins.` }] }
}

export function recordSkillUse(state: GameState, skillId: string): Step {
  const skill = state.player.skills.find((s) => s.skillId === skillId)
  if (!skill) return { state, events: [] }

  const uses = skill.uses + 1
  const levelUp = uses >= 5 * skill.level
  const updated = levelUp ? { ...skill, level: skill.level + 1, uses: 0 } : { ...skill, uses }
  const skills = state.player.skills.map((s) => (s === skill ? updated : s))
  return {
    state: { ...state, player: { ...state.player, skills } },
    events: levelUp ? [{ kind: 'system', text: `Skill level up! ${titleCase(skillId)} is now level ${updated.level}.` }] : [],
  }
}

/** Stigmas level up like skills, but stop at their maxLevel. */
export function recordStigmaUse(state: GameState, content: Content): Step {
  const held = state.player.stigma
  const def = held ? content.stigmas.find((x) => x.id === held.stigmaId) : undefined
  if (!held || !def) return { state, events: [] }
  const uses = held.uses + 1
  const levelUp = held.level < def.maxLevel && uses >= 5 * held.level
  const stigma = levelUp ? { ...held, level: held.level + 1, uses: 0 } : { ...held, uses }
  return {
    state: { ...state, player: { ...state.player, stigma } },
    events: levelUp ? [{ kind: 'system', text: `Stigma level up! ${def.name} is now level ${stigma.level}.` }] : [],
  }
}
