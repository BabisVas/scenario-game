// Items: carrying, equipping, the system shop and consumables.

import type { Content, ItemDef } from '../data/schema'
import { withCarriedBonus, withHealingBonus } from './attributes'
import { maxHp } from './newGame'
import type { GameState, StatKey, Step } from './types'

const refuse = (state: GameState, text: string): Step => ({ state, events: [{ kind: 'system', text }] })

const itemDef = (content: Content, itemId: string): ItemDef | undefined => content.items.find((i) => i.id === itemId)

export function ownedQty(state: GameState, itemId: string): number {
  return state.player.inventory.find((i) => i.itemId === itemId)?.qty ?? 0
}

export function addItem(state: GameState, itemId: string, qty = 1): GameState {
  const inv = state.player.inventory
  const inventory = inv.some((i) => i.itemId === itemId)
    ? inv.map((i) => (i.itemId === itemId ? { ...i, qty: i.qty + qty } : i))
    : [...inv, { itemId, qty }]
  return { ...state, player: { ...state.player, inventory } }
}

/** Null when the player does not have `qty` of the item. Unequips gear when the last one goes. */
export function removeItem(state: GameState, itemId: string, qty = 1): GameState | null {
  const have = ownedQty(state, itemId)
  if (have < qty) return null
  const inventory =
    have === qty
      ? state.player.inventory.filter((i) => i.itemId !== itemId)
      : state.player.inventory.map((i) => (i.itemId === itemId ? { ...i, qty: i.qty - qty } : i))
  const equipped = { ...state.player.equipped }
  if (have === qty) {
    if (equipped.weapon === itemId) delete equipped.weapon
    if (equipped.armor === itemId) delete equipped.armor
  }
  return { ...state, player: { ...state.player, inventory, equipped } }
}

/** Equips owned weapons and armor; anything else leaves the state unchanged. */
export function equip(state: GameState, itemId: string, content: Content): GameState {
  const def = itemDef(content, itemId)
  if (!def || ownedQty(state, itemId) === 0) return state
  if (def.kind !== 'weapon' && def.kind !== 'armor') return state
  return { ...state, player: { ...state.player, equipped: { ...state.player.equipped, [def.kind]: itemId } } }
}

export function buyFromShop(state: GameState, itemId: string, content: Content): Step {
  const def = itemDef(content, itemId)
  if (!def || !def.inShop) return refuse(state, 'The shop does not sell that.')
  if (state.player.coins < def.price) return refuse(state, `Not enough coins: ${def.name} costs ${def.price}.`)
  const paid = { ...state, player: { ...state.player, coins: state.player.coins - def.price } }
  return { state: addItem(paid, itemId), events: [{ kind: 'player', text: `Bought ${def.name} for ${def.price} coins.` }] }
}

export function sellPrice(def: ItemDef): number {
  return Math.floor(def.price / 2)
}

export function sellToShop(state: GameState, itemId: string, content: Content): Step {
  const def = itemDef(content, itemId)
  const removed = removeItem(state, itemId)
  if (!def || !removed) return refuse(state, 'You have nothing like that to sell.')
  const price = withCarriedBonus(state, content, sellPrice(def))
  return {
    state: { ...removed, player: { ...removed.player, coins: removed.player.coins + price } },
    events: [{ kind: 'player', text: `Sold ${def.name} for ${price} coins.` }],
  }
}

/** Consumables, and rare items that carry an effect, can be used (once). */
export function isUsable(def: ItemDef): boolean {
  return (def.kind === 'consumable' || def.kind === 'rare') && !!def.effect
}

/** Heals and full heals work anywhere. */
export function heals(def: ItemDef): boolean {
  return !!def.effect?.heal || !!def.effect?.fullHeal
}

/**
 * Uses an item outside a fight: a heal, or a stat relic (which needs the stat
 * the player picks). Damage and escape items only work in fights.
 */
export function useConsumable(state: GameState, itemId: string, content: Content, stat?: StatKey): Step {
  const def = itemDef(content, itemId)
  if (!def || !isUsable(def) || !def.effect) return refuse(state, 'That cannot be used here.')
  const removed = removeItem(state, itemId)
  if (!removed) return refuse(state, `You have no ${def.name} left.`)
  const points = def.effect.statPoint
  if (points) {
    if (!stat) return refuse(state, `Choose which stat the ${def.name} raises.`)
    const stats = { ...removed.player.stats, [stat]: removed.player.stats[stat] + points }
    const hp = removed.player.hp + (maxHp(stats) - maxHp(removed.player.stats))
    return {
      state: { ...removed, player: { ...removed.player, stats, hp } },
      events: [{ kind: 'player', text: `You use the ${def.name}. Your ${stat} rises to ${stats[stat]}.` }],
    }
  }
  if (!heals(def)) return refuse(state, 'That cannot be used here.')
  const cap = maxHp(removed.player.stats)
  const hp = def.effect.fullHeal ? cap : Math.min(cap, removed.player.hp + withHealingBonus(removed, content, def.effect.heal ?? 0))
  const healed = hp - removed.player.hp
  return {
    state: { ...removed, player: { ...removed.player, hp } },
    events: [{ kind: 'player', text: `You use the ${def.name}. +${healed} HP.` }],
  }
}
