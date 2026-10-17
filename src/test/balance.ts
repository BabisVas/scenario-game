// Seeded fights for balance checks. Test-only.

import { content } from '../data'
import { combatantFromEnemy } from '../engine/actions'
import { fightTurn } from '../engine/combat'
import { maxHp } from '../engine/newGame'
import { createRng } from '../engine/rng'
import type { GameState, StatKey } from '../engine/types'
import { baseState } from './fixtures'

type Profile = { stats: Record<StatKey, number>; weapon?: string; armor?: string }

/** Who a player typically is at each stage: fresh, after a few scenarios, late, at the finale. */
export const PROFILES: Record<string, Profile> = {
  fresh: { stats: { strength: 5, agility: 7, endurance: 5, spirit: 5 }, weapon: 'bike-chain' },
  early: { stats: { strength: 6, agility: 7, endurance: 6, spirit: 5 }, weapon: 'crowbar', armor: 'padded-jacket' },
  mid: { stats: { strength: 7, agility: 7, endurance: 7, spirit: 5 }, weapon: 'crowbar', armor: 'hi-vis-vest' },
  late: { stats: { strength: 9, agility: 8, endurance: 9, spirit: 6 }, weapon: 'fire-axe', armor: 'riot-vest' },
  finale: { stats: { strength: 11, agility: 9, endurance: 10, spirit: 7 }, weapon: 'arena-gauntlets', armor: 'riot-vest' },
}

function player(p: Profile): GameState {
  const s = baseState()
  return {
    ...s,
    phase: { kind: 'rest', nextScenarioId: null, hoursLeft: 999 },
    player: { ...s.player, stats: p.stats, hp: maxHp(p.stats), inventory: [], equipped: { weapon: p.weapon, armor: p.armor } },
  }
}

export function winRate(profile: string, enemyId: string, danger: number, fights = 200): number {
  const def = content.enemies.find((e) => e.id === enemyId)!
  let wins = 0
  for (let seed = 1; seed <= fights; seed++) {
    const rng = createRng(seed * 7919)
    let s: GameState = { ...player(PROFILES[profile]), fight: { enemy: combatantFromEnemy(def, danger), enemyId, round: 1, cooldowns: {}, origin: 'hunt' } }
    for (let round = 0; round < 60 && s.fight; round++) {
      const r = fightTurn(s, { kind: 'attack' }, rng, content)
      s = r.state
      if (r.result === 'won') wins++
      if (r.result !== 'ongoing') break
    }
  }
  return wins / fights
}

