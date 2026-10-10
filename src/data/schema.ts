// Content shapes. Everything in src/data is checked against these and by validate.ts.

import type { StatKey } from '../engine/types'

export type Background = {
  id: string
  name: string
  blurb: string
  statBonus: StatKey
  startingItemId: string
}

export type ScenarioDef = {
  id: string
  number: number
  title: string
  announcement: string
  rules: string[]
  twist: string
  hours: number
  rewards: { coins: number; itemIds?: string[]; skillId?: string }
  survivorDeathRate: number
}

export type Content = {
  backgrounds: Background[]
  /** Sorted by `number`. */
  scenarios: ScenarioDef[]
}
