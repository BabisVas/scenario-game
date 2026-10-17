// Small display helpers shared by screens and panels.

import type { Content, HiddenScenarioDef, ItemDef, ScenarioDef, SubScenarioDef } from '../data/schema'
import type { GameState, LogKind } from '../engine/types'

/** "Day 2, 06:00" for an in-game hour count that started at day 1, 00:00. */
export function clockText(inGameHour: number): string {
  const day = Math.floor(inGameHour / 24) + 1
  const hour = ((inGameHour % 24) + 24) % 24
  return `Day ${day}, ${String(hour).padStart(2, '0')}:00`
}

/** "4:05" from milliseconds. */
export function mmss(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

/** What an item does, in a few words: " heals 25", " deals 40, stuns". Empty for plain gear. */
export function itemEffectText(def: ItemDef): string {
  const e = def.effect
  const parts: string[] = []
  if (e?.heal) parts.push(`heals ${e.heal}`)
  if (e?.fullHeal) parts.push('heals to full')
  if (e?.damage) parts.push(`deals ${e.damage}`)
  if (e?.stun) parts.push('stuns')
  if (e?.escape) parts.push('sure escape')
  if (e?.statPoint) parts.push(`+${e.statPoint} to a stat`)
  if (def.passive) parts.push(`+${def.passive.coinPercent}% coins while carried`)
  return parts.length ? ' ' + parts.join(', ') : ''
}

export function hoursText(n: number): string {
  return `${n} ${n === 1 ? 'hour' : 'hours'}`
}

/** "3 spirits", "1 beast", "2 enemies". */
function foes(count: number, tag?: string): string {
  if (!tag) return `${count} ${count === 1 ? 'enemy' : 'enemies'}`
  return `${count} ${tag}${count === 1 ? '' : 's'}`
}

export function goalText(def: ScenarioDef, state: GameState, content: Content): string {
  const phase = state.phase.kind === 'scenario' ? state.phase : null
  const progress = phase?.progress ?? 0
  const g = def.goal
  switch (g.kind) {
    case 'survive':
      return 'Survive until the clock runs out.'
    case 'kill':
      return `Kill ${foes(g.count, g.enemyTag)} (${Math.min(progress, g.count)}/${g.count}).`
    case 'reach':
      return `Reach the ${content.zones.find((z) => z.id === g.zoneId)?.name ?? g.zoneId}.`
    case 'protect': {
      const who = state.survivors.find((v) => v.id === phase?.protectedSurvivorId)
      return who ? `Keep ${who.name} alive until the clock runs out.` : 'Survive until the clock runs out.'
    }
    case 'choice':
      return progress >= 1 ? 'The choice is made.' : g.prompt
  }
}

export function subGoalText(def: SubScenarioDef, progress: number, content: Content): string {
  const g = def.goal
  if (g.kind === 'kill') return `Kill ${g.count} (${Math.min(progress, g.count)}/${g.count})`
  return `Reach the ${content.zones.find((z) => z.id === g.zoneId)?.name ?? g.zoneId}`
}

export function hiddenGoalText(def: HiddenScenarioDef, progress: number, content: Content): string {
  const g = def.goal
  if (g.kind === 'kill') return `Kill ${foes(g.count, g.enemyTag)} (${Math.min(progress, g.count)}/${g.count})`
  if (g.kind === 'reach') return `Reach the ${content.zones.find((z) => z.id === g.zoneId)?.name ?? g.zoneId}`
  if (g.zoneId) return `Be in the ${content.zones.find((z) => z.id === g.zoneId)?.name ?? g.zoneId} when its clock runs out`
  return 'Stay alive until its clock runs out'
}

export const LOG_LABEL: Record<LogKind, string> = {
  system: 'SYSTEM',
  constellation: 'STAR',
  survivor: 'CITY',
  fight: 'FIGHT',
  player: 'YOU',
  digest: 'AWAY',
}

export function attitudeWord(attitude: number): string {
  if (attitude <= -50) return 'hostile'
  if (attitude < -10) return 'wary'
  if (attitude >= 50) return 'friend'
  if (attitude > 10) return 'friendly'
  return 'neutral'
}
