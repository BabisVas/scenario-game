import type { Content } from '../data/schema'
import { BACKGROUND_STAT_BONUS, ENERGY_MAX, SCHEMA_VERSION, STAT_START } from './config'
import { initConstellations } from './constellations'
import { appendEvents } from './log'
import { createRng } from './rng'
import { startScenario } from './scenario'
import { generateSurvivors } from './survivors'
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
  const startingItem = content.items.find((i) => i.id === background.startingItemId)
  const equipped = startingItem?.kind === 'weapon' || startingItem?.kind === 'armor' ? { [startingItem.kind]: startingItem.id } : {}

  const stats: Record<StatKey, number> = {
    strength: STAT_START,
    agility: STAT_START,
    endurance: STAT_START,
    spirit: STAT_START,
  }
  stats[background.statBonus] += BACKGROUND_STAT_BONUS

  const rng = createRng(input.seed >>> 0)
  const base: GameState = {
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
      equipped,
      skills: [],
      points: 0,
      kills: 0,
    },
    energy: ENERGY_MAX,
    energyUpdatedAt: input.now,
    worldTickAt: input.now,
    inGameHour: 0,
    phase: { kind: 'rest', nextScenarioId: first.id, hoursLeft: 0 },
    clearedScenarioIds: [],
    subScenario: null,
    fight: null,
    pendingChoice: null,
    zones: Object.fromEntries(content.zones.map((z) => [z.id, { sealed: !!z.startsSealed, dangerBonus: 0 }])),
    survivors: generateSurvivors(content, rng),
    constellations: initConstellations(content),
    rankingOpen: false,
    log: [],
    nextLogId: 1,
    digest: null,
  }

  const step = startScenario(base, first, rng, content)
  return { ...appendEvents(step.state, step.events), rngState: rng.getState() }
}
