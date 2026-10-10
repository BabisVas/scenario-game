// Shared test helpers. Test-only: nothing in src/engine, src/data or src/ui imports this.

import { newGame } from '../engine/newGame'
import { content } from '../data'
import type { Rng } from '../engine/rng'
import type { Combatant, GameState } from '../engine/types'

export function baseState(): GameState {
  return newGame({ name: 'Ari', backgroundId: 'courier', seed: 1, now: 0 }, content)
}

/** An in-memory Storage, so tests never touch the real localStorage. */
export function memoryStorage(): Storage {
  const data = new Map<string, string>()
  return {
    get length() {
      return data.size
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, String(v)),
  }
}

type Listener = (e: StorageEvent) => void

/** A window stand-in whose `storage` events the test fires by hand. */
export function fakeWindow() {
  const listeners = new Set<Listener>()
  return {
    addEventListener: ((type: string, fn: Listener) => {
      if (type === 'storage') listeners.add(fn)
    }) as Window['addEventListener'],
    removeEventListener: ((type: string, fn: Listener) => {
      if (type === 'storage') listeners.delete(fn)
    }) as Window['removeEventListener'],
    fireStorage(key: string, newValue: string | null) {
      const e = { key, newValue } as StorageEvent
      for (const fn of [...listeners]) fn(e)
    },
  }
}

export function withCoins(s: GameState, coins: number): GameState {
  return { ...s, player: { ...s.player, coins } }
}

export function withSkill(s: GameState, skillId: string, level = 1): GameState {
  return { ...s, player: { ...s.player, skills: [...s.player.skills, { skillId, level, uses: 0 }] } }
}

export function withItem(s: GameState, itemId: string, qty = 1): GameState {
  return { ...s, player: { ...s.player, inventory: [...s.player.inventory, { itemId, qty }] } }
}

/** An Rng that replays the given rolls in a loop, for deterministic fight tests. */
export function seqRng(...rolls: number[]): Rng {
  let i = 0
  const next = () => rolls[i++ % rolls.length]
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    chance: (p) => next() < p,
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    getState: () => i,
  }
}

export function weakEnemy(): Combatant {
  return {
    name: 'Test Rat', stats: { strength: 3, agility: 3, endurance: 1, spirit: 1 },
    hp: 30, maxHp: 30, behavior: 'aggressive', weaponPower: 0, armorPower: 0,
  }
}

export function brutalEnemy(): Combatant {
  return {
    name: 'Test Titan', stats: { strength: 40, agility: 1, endurance: 30, spirit: 1 },
    hp: 999, maxHp: 999, behavior: 'aggressive', weaponPower: 20, armorPower: 20,
  }
}

export function inFight(s: GameState, enemy: Combatant, ids: { enemyId?: string; survivorId?: string } = {}): GameState {
  return { ...s, fight: { enemy, ...ids, round: 1, cooldowns: {}, origin: 'hunt' } }
}
