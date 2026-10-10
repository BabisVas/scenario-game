import type { Content } from '../data/schema'
import { BACKGROUND_STAT_BONUS, ENERGY_MAX, SCHEMA_VERSION, STAT_START } from './config'
import type { GameState, StatKey } from './types'

export function maxHp(stats: Record<StatKey, number>): number {
  return 50 + stats.endurance * 10
}

export function newGame(
  input: { name: string; backgroundId: string; seed: number; now: number },
  content: Content,
): GameState {
  const background = content.backgrounds.find((b) => b.id === input.backgroundId)
  if (!background) throw new Error(`Unknown background: ${input.backgroundId}`)
  const first = content.scenarios[0]

  const stats: Record<StatKey, number> = {
    strength: STAT_START,
    agility: STAT_START,
    endurance: STAT_START,
    spirit: STAT_START,
  }
  stats[background.statBonus] += BACKGROUND_STAT_BONUS

  return {
    schemaVersion: SCHEMA_VERSION,
    rngState: input.seed >>> 0,
    createdAt: input.now,
    lastSeenAt: input.now,
    player: {
      name: input.name,
      backgroundId: background.id,
      stats,
      hp: maxHp(stats),
      coins: 0,
      inventory: [{ itemId: background.startingItemId, qty: 1 }],
      equipped: {},
      skills: [],
      points: 0,
      kills: 0,
    },
    energy: ENERGY_MAX,
    energyUpdatedAt: input.now,
    worldTickAt: input.now,
    inGameHour: 0,
    phase: { kind: 'scenario', scenarioId: first.id, hoursLeft: first.hours, progress: 0 },
    clearedScenarioIds: [],
    subScenario: null,
    fight: null,
    pendingChoice: null,
    zones: {},
    survivors: [],
    constellations: {},
    rankingOpen: false,
    log: [{ id: 1, kind: 'system', text: first.announcement, inGameHour: 0 }],
    nextLogId: 2,
    digest: null,
  }
}
