// Attributes: one per person, rolled on the first morning, with an always-on effect.

import type { AttributeDef, AttributeEffect, Content } from '../data/schema'
import { spiritMultiplier } from './growth'
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

/** Every effect of the given kind on the player's attribute (legendary attributes have two). */
function effectsOf<K extends AttributeEffect['kind']>(state: GameState, content: Content, kind: K) {
  const all = attributeDef(content, state.player.attributeId)?.effects ?? []
  return all.filter((e): e is Extract<AttributeEffect, { kind: K }> => e.kind === kind)
}

const sum = (ns: number[]) => ns.reduce((a, b) => a + b, 0)

/** Percent more coins from items carried (never used up), from every source. */
function carriedPercent(state: GameState, content: Content): number {
  return sum(state.player.inventory.map((i) => content.items.find((d) => d.id === i.itemId)?.passive?.coinPercent ?? 0))
}

/** Coins the player actually receives when they find or earn `base`: attribute and carried charms. */
export function withCoinBonus(state: GameState, content: Content, base: number): number {
  const pct = sum(effectsOf(state, content, 'coins').map((e) => e.percent)) + carriedPercent(state, content)
  return pct ? Math.floor(base * (1 + pct / 100)) : base
}

/** Coins from sales and sponsors: only carried charms add to these. */
export function withCarriedBonus(state: GameState, content: Content, base: number): number {
  const pct = carriedPercent(state, content)
  return pct ? Math.floor(base * (1 + pct / 100)) : base
}

/** HP the player actually recovers from a heal of `base`: attribute and spirit included. */
export function withHealingBonus(state: GameState, content: Content, base: number): number {
  const pct = sum(effectsOf(state, content, 'healing').map((e) => e.percent))
  return Math.round(base * (1 + pct / 100) * spiritMultiplier(state.player.stats.spirit))
}

export function attributeRunBonus(state: GameState, content: Content): number {
  return sum(effectsOf(state, content, 'run').map((e) => e.bonus))
}

/** Damage multiplier against an enemy with these tags. */
export function damageMultiplier(state: GameState, content: Content, enemyTags: string[]): number {
  const pct = sum(effectsOf(state, content, 'damage-vs').filter((e) => enemyTags.includes(e.enemyTag)).map((e) => e.percent))
  return 1 + pct / 100
}
