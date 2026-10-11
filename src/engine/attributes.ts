// Attributes: one per person, rolled on the first morning, with an always-on effect.

import type { AttributeDef, AttributeEffect, Content } from '../data/schema'
import type { Rng } from './rng'
import type { GameState } from './types'

const RARITY_ROLL: { rarity: AttributeDef['rarity']; upTo: number }[] = [
  { rarity: 'common', upTo: 0.7 },
  { rarity: 'rare', upTo: 0.95 },
  { rarity: 'legendary', upTo: 1 },
]

/**
 * Rolls a rarity (70/25/5), then picks within it, weighted by the background.
 * Returns null only when the content has no attributes at all.
 */
export function rollAttribute(content: Content, rng: Rng, backgroundId?: string): string | null {
  if (content.attributes.length === 0) return null
  const r = rng.next()
  const rarity = RARITY_ROLL.find((x) => r < x.upTo)!.rarity
  const inRarity = content.attributes.filter((a) => a.rarity === rarity)
  const pool = inRarity.length > 0 ? inRarity : content.attributes
  const weight = (a: AttributeDef) => (backgroundId ? (a.backgroundWeights[backgroundId] ?? 1) : 1)
  const total = pool.reduce((sum, a) => sum + weight(a), 0)
  if (total <= 0) return rng.pick(pool).id
  let x = rng.next() * total
  for (const a of pool) {
    x -= weight(a)
    if (x < 0) return a.id
  }
  return pool[pool.length - 1].id
}

export function attributeDef(content: Content, id: string | null | undefined): AttributeDef | undefined {
  return id ? content.attributes.find((a) => a.id === id) : undefined
}

function effect<K extends AttributeEffect['kind']>(state: GameState, content: Content, kind: K) {
  const e = attributeDef(content, state.player.attributeId)?.effect
  return e?.kind === kind ? (e as Extract<AttributeEffect, { kind: K }>) : undefined
}

/** Coins the player actually receives when they find or earn `base`. */
export function withCoinBonus(state: GameState, content: Content, base: number): number {
  const e = effect(state, content, 'coins')
  return e ? Math.floor(base * (1 + e.percent / 100)) : base
}

/** HP the player actually recovers from a heal of `base`. */
export function withHealingBonus(state: GameState, content: Content, base: number): number {
  const e = effect(state, content, 'healing')
  return e ? Math.round(base * (1 + e.percent / 100)) : base
}

export function attributeRunBonus(state: GameState, content: Content): number {
  return effect(state, content, 'run')?.bonus ?? 0
}

/** Damage multiplier against an enemy with these tags. */
export function damageMultiplier(state: GameState, content: Content, enemyTags: string[]): number {
  const e = effect(state, content, 'damage-vs')
  return e && enemyTags.includes(e.enemyTag) ? 1 + e.percent / 100 : 1
}
