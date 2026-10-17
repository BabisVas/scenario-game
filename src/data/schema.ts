// Content shapes. Everything in src/data is checked against these and by validate.ts.
// All ids are kebab-case strings.

import type { StatKey, Tag } from '../engine/types'

export type Background = {
  id: string
  name: string
  blurb: string
  statBonus: StatKey
  startingItemId: string
}

export type ActionId = 'scavenge' | 'explore' | 'train' | 'trade' | 'rest' | 'talk' | 'hunt'

export type ZoneDef = {
  id: string
  name: string
  blurb: string
  danger: 1 | 2 | 3 | 4 | 5
  actions: ActionId[]
  enemyIds: string[]
  /** Zones one move away. Connections always go both ways. */
  connections: string[]
  startsSealed?: boolean
  /** Things only this zone turns up when scavenged, each rolled on its own. */
  finds?: { itemId: string; chance: number }[]
}

export type EnemyDef = {
  id: string
  name: string
  tags: string[]
  stats: Record<StatKey, number>
  hp: number
  behavior: 'aggressive' | 'defensive' | 'erratic'
  coins: [number, number]
  drops: { itemId: string; chance: number }[]
}

export type ItemDef = {
  id: string
  name: string
  kind: 'weapon' | 'armor' | 'consumable' | 'rare'
  power: number
  price: number
  inShop: boolean
  /** One or two lines of lore. */
  blurb?: string
  /** What using it once does. */
  effect?: {
    heal?: number
    fullHeal?: boolean
    damage?: number
    /** With damage: the enemy loses its next turn. */
    stun?: boolean
    /** A sure escape, except from a Final Wave or a scenario's own fight. */
    escape?: boolean
    /** Outside fights: this much more of a stat the player picks, for good. */
    statPoint?: number
  }
  /** Works while carried and is never used up. */
  passive?: { coinPercent: number }
}

export type SkillDef = {
  id: string
  name: string
  blurb: string
  kind: 'attack' | 'heal' | 'buff' | 'escape'
  power: number
  cooldown: number
  /** Sold in the system shop at this price. */
  price?: number
  /** Training can teach it. */
  trainable?: boolean
}

/** A constellation's lent power: a skill that is stronger and levels up to maxLevel. */
export type StigmaDef = {
  id: string
  name: string
  blurb: string
  kind: SkillDef['kind']
  power: number
  cooldown: number
  maxLevel: number
}

export type ChoiceOption = {
  id: string
  label: string
  tags: Tag[]
  /** The player picks a living survivor they have met. */
  target?: 'met-survivor'
  /**
   * `kill`: the picked target dies (needs `target`). `spareCount`: the player spares up to
   * this many of the scenario's group; the rest of the group die (0 = nobody is spared).
   * `fight`: an enemy the player must beat. `cityAttitude`: news spreads; every living
   * survivor's attitude toward the player changes by this much. `announce`: a line «ANNOUNCER»
   * says to the whole city.
   */
  outcome: { kill?: boolean; spareCount?: number; coins?: number; fight?: string; cityAttitude?: number; announce?: string }
}

export type ScenarioGoal =
  | { kind: 'survive' }
  | { kind: 'kill'; count: number; enemyTag?: string }
  | { kind: 'reach'; zoneId: string }
  | { kind: 'protect' }
  | { kind: 'choice'; prompt: string; options: ChoiceOption[]; fallbackOptionId: string }

export type ScenarioDef = {
  id: string
  number: number
  title: string
  /** The system notice, in brackets, one line per rule. */
  announcement: string
  /** What «ANNOUNCER» says after the notice. */
  announcer?: string
  /** A line of narration after that: what you see. */
  narration?: string
  rules: string[]
  twist: string
  hours: number
  goal: ScenarioGoal
  rewards: { coins: number; itemIds?: string[]; skillId?: string }
  zoneChanges?: { seal?: string[]; open?: string[]; danger?: Record<string, number> }
  survivorDeathRate: number
  /** Survive scenarios: the enemy of the Final Wave. Default: the toughest enemy where the player stands. */
  finalWave?: string
}

export type ConstellationDef = {
  id: string
  title: string
  blurb: string
  likes: Partial<Record<Tag, number>>
  lines: { like: string[]; dislike: string[]; sponsor: string[]; contract: string[]; death: string[] }
  contract: { demandTag: Tag; stigmaId: string; coinsPerScenario: number }
}

export type SurvivorTemplate = {
  name: string
  personality: 'brave' | 'cautious' | 'ruthless' | 'kind' | 'schemer'
}

/** How a survivor feels about the player, as a greeting sees it. */
export type AttitudeBand = 'hostile' | 'wary' | 'neutral' | 'friendly'

/** Greeting lines by personality and attitude band. Each line names the survivor as {name}. */
export type Greetings = Record<SurvivorTemplate['personality'], Record<AttitudeBand, string[]>>

export type SubScenarioDef = {
  id: string
  zoneIds: string[]
  title: string
  goal: { kind: 'kill'; count: number } | { kind: 'reach'; zoneId: string }
  hours: number
  rewards: { coins: number; itemIds?: string[] }
  /** A line of narration after its notice. */
  narration?: string
}

/** What an attribute does, always on. */
export type AttributeEffect =
  | { kind: 'stat'; stat: StatKey; amount: number }
  | { kind: 'coins'; percent: number }
  | { kind: 'run'; bonus: number }
  | { kind: 'damage-vs'; enemyTag: string; percent: number }
  | { kind: 'healing'; percent: number }

export type AttributeDef = {
  id: string
  name: string
  blurb: string
  rarity: 'common' | 'rare' | 'legendary'
  /** One effect for common and rare attributes; two different ones for legendary. */
  effects: AttributeEffect[]
  /** Constellations that like any of these notice the holder sooner. */
  tags: Tag[]
  /** Likelihood multiplier per background id; missing means 1. */
  backgroundWeights: Record<string, number>
}

/** The unusual condition that uncovers a hidden scenario. */
export type HiddenTrigger =
  | { kind: 'repeat-action'; zoneId: string; action: ActionId; count: number }
  | { kind: 'carry-item'; itemId: string; zoneId: string }
  | { kind: 'meet-survivor'; count: number }
  | { kind: 'zone-during-scenario'; zoneId: string; scenarioNumber: number }
  | { kind: 'choose-option'; scenarioId: string; optionId: string }

/** Never listed before it is found; hinted only by survivor rumors. Failing costs rewards, not life. */
export type HiddenScenarioDef = {
  id: string
  title: string
  announcement: string
  trigger: HiddenTrigger
  /** A survive goal with a zone pays only if the player stands there when the clock ends. */
  goal: { kind: 'kill'; count: number; enemyTag?: string } | { kind: 'reach'; zoneId: string } | { kind: 'survive'; zoneId?: string }
  hours: number
  rewards: { coins: number; itemIds?: string[]; skillId?: string }
  /** What survivors whisper about it while it is undiscovered. */
  rumor: string
}

export type Content = {
  backgrounds: Background[]
  zones: ZoneDef[]
  enemies: EnemyDef[]
  items: ItemDef[]
  skills: SkillDef[]
  /** Sorted by `number`. */
  scenarios: ScenarioDef[]
  constellations: ConstellationDef[]
  survivorTemplates: SurvivorTemplate[]
  subScenarios: SubScenarioDef[]
  attributes: AttributeDef[]
  stigmas: StigmaDef[]
  hiddenScenarios: HiddenScenarioDef[]
  greetings: Greetings
}
