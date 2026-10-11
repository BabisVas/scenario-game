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
  startsSealed?: boolean
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
  effect?: { heal?: number; damage?: number }
}

export type SkillDef = {
  id: string
  name: string
  blurb: string
  kind: 'attack' | 'heal' | 'buff' | 'escape'
  power: number
  cooldown: number
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
  /** `fight` names an enemy the player must beat. */
  outcome: { kill?: boolean; spareCount?: number; coins?: number; fight?: string }
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
  announcement: string
  rules: string[]
  twist: string
  hours: number
  goal: ScenarioGoal
  rewards: { coins: number; itemIds?: string[]; skillId?: string }
  zoneChanges?: { seal?: string[]; open?: string[]; danger?: Record<string, number> }
  survivorDeathRate: number
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

export type SubScenarioDef = {
  id: string
  zoneIds: string[]
  title: string
  goal: { kind: 'kill'; count: number } | { kind: 'reach'; zoneId: string }
  hours: number
  rewards: { coins: number; itemIds?: string[] }
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
  effect: AttributeEffect
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
  goal: { kind: 'kill'; count: number; enemyTag?: string } | { kind: 'reach'; zoneId: string } | { kind: 'survive' }
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
}
