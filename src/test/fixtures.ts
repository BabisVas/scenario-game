// Shared test helpers. Test-only: nothing in src/engine, src/data or src/ui imports this.

import { newGame } from '../engine/newGame'
import { testContent } from '../engine/testContent'
import type { GameState } from '../engine/types'

export function baseState(): GameState {
  return newGame({ name: 'Ari', backgroundId: 'courier', seed: 1, now: 0 }, testContent)
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
