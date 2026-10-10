// Game state shapes. Engine functions take a GameState and return a Step.

import type { EnemyDef } from '../data/schema'

export type StatKey = 'strength' | 'agility' | 'endurance' | 'spirit'

export type ItemStack = { itemId: string; qty: number }
export type SkillState = { skillId: string; level: number; uses: number }

export type Player = {
  name: string
  backgroundId: string
  stats: Record<StatKey, number>
  hp: number
  coins: number
  inventory: ItemStack[]
  equipped: { weapon?: string; armor?: string }
  skills: SkillState[]
  points: number
  kills: number
}

export type Phase =
  | { kind: 'scenario'; scenarioId: string; hoursLeft: number; progress: number; protectedSurvivorId?: string }
  | { kind: 'rest'; nextScenarioId: string | null; hoursLeft: number }
  | { kind: 'dead'; cause: string }

export type LogKind = 'system' | 'constellation' | 'survivor' | 'fight' | 'player' | 'digest'
export type LogEntry = { id: number; kind: LogKind; text: string; inGameHour: number }

export type Tag = 'bravery' | 'cruelty' | 'cunning' | 'mercy' | 'style' | 'cowardice' | 'greed' | 'loyalty'
export type GameEvent = { kind: LogKind; text: string; tags?: Tag[] }

// Filled in by the tasks that own them.
export type Survivor = never
export type ZoneState = never
export type ConstellationState = never
export type PendingChoice = never
export type ActiveSubScenario = never

export type Combatant = {
  name: string
  stats: Record<StatKey, number>
  hp: number
  maxHp: number
  behavior: EnemyDef['behavior'] | 'survivor'
  weaponPower: number
  armorPower: number
}

export type FightState = {
  enemy: Combatant
  enemyId?: string
  survivorId?: string
  round: number
  cooldowns: Record<string, number>
  origin: 'hunt' | 'scenario' | 'survivor' | 'sub'
}

export type GameState = {
  schemaVersion: 1
  rngState: number
  createdAt: number
  lastSeenAt: number
  player: Player
  energy: number
  energyUpdatedAt: number
  worldTickAt: number
  inGameHour: number
  phase: Phase
  clearedScenarioIds: string[]
  subScenario: ActiveSubScenario | null
  fight: FightState | null
  pendingChoice: PendingChoice | null
  zones: Record<string, ZoneState>
  survivors: Survivor[]
  constellations: Record<string, ConstellationState>
  rankingOpen: boolean
  log: LogEntry[]
  nextLogId: number
  digest: LogEntry[] | null
}

export type Step = { state: GameState; events: GameEvent[] }
