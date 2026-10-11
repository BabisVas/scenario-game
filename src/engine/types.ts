// Game state shapes. Engine functions take a GameState and return a Step.

import type { EnemyDef, SurvivorTemplate } from '../data/schema'

export type StatKey = 'strength' | 'agility' | 'endurance' | 'spirit'

export type ItemStack = { itemId: string; qty: number }
export type SkillState = { skillId: string; level: number; uses: number }

/** The stigma lent by the player's one sponsor. Sealed after a broken demand. */
export type StigmaState = { stigmaId: string; constellationId: string; level: number; uses: number; sealed: boolean }

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
  attributeId: string | null
  stigma: StigmaState | null
}

export type Phase =
  | {
      kind: 'scenario'
      scenarioId: string
      hoursLeft: number
      progress: number
      protectedSurvivorId?: string
      /** player.kills when the scenario began, for 'kills this scenario'. */
      killsAtStart?: number
      /** Survive scenarios only: the last enemy that comes when the clock hits zero has been beaten. */
      finalWaveBeaten?: boolean
    }
  | { kind: 'rest'; nextScenarioId: string | null; hoursLeft: number }
  | { kind: 'dead'; cause: string }

export type LogKind = 'system' | 'constellation' | 'survivor' | 'fight' | 'player' | 'digest'
export type LogEntry = { id: number; kind: LogKind; text: string; inGameHour: number }

export type Tag = 'bravery' | 'cruelty' | 'cunning' | 'mercy' | 'style' | 'cowardice' | 'greed' | 'loyalty'
export type GameEvent = { kind: LogKind; text: string; tags?: Tag[] }

export type Survivor = {
  id: string
  name: string
  personality: SurvivorTemplate['personality']
  stats: Record<StatKey, number>
  hp: number
  alive: boolean
  zoneId: string
  partyId: string | null
  met: boolean
  /** -100..100: how this survivor feels about the player. */
  attitude: number
  /** Newest 5. */
  memories: string[]
  points: number
  deathNote?: string
  attributeId: string | null
  /** How many times the player has talked with them. */
  timesMet: number
}
export type ZoneState = { sealed: boolean; dangerBonus: number }
export type ConstellationState = {
  /** -100..100 */
  interest: number
  /** 'ended': replaced by another sponsor's contract. */
  contract: 'none' | 'offered' | 'active' | 'declined' | 'ended'
  demandMetThisScenario: boolean
}
export type PendingChoice = { source: 'scenario'; scenarioId: string } | { source: 'contract'; constellationId: string }
export type ActiveSubScenario = { defId: string; hoursLeft: number; progress: number }
export type ActiveHiddenScenario = { defId: string; hoursLeft: number; progress: number }

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
  /** Damage the player has taken in this fight. */
  damageTaken?: number
  origin: 'hunt' | 'scenario' | 'survivor' | 'sub' | 'final-wave'
}

export type GameState = {
  schemaVersion: 3
  rngState: number
  createdAt: number
  lastSeenAt: number
  player: Player
  energy: number
  energyUpdatedAt: number
  worldTickAt: number
  inGameHour: number
  /** The zone of the player's last action: where they stand. */
  zoneId: string
  phase: Phase
  clearedScenarioIds: string[]
  subScenario: ActiveSubScenario | null
  hiddenScenario: ActiveHiddenScenario | null
  /** Hidden scenarios found this game: each can be found once. */
  foundHiddenIds: string[]
  /** Times each action was taken in each zone, keyed "zoneId/action". */
  actionCounts: Record<string, number>
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
