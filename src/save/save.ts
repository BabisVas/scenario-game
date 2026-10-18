import { SAVE_KEY } from '../engine/config'
import type { GameState } from '../engine/types'
import { migrateSave, type Migration } from './migrate'

export type LoadResult = { ok: true; state: GameState } | { ok: false; reason: 'none' | 'corrupt' | 'version' }

const REQUIRED_FIELDS = ['player', 'phase', 'log'] as const

export function saveGame(state: GameState, storage: Storage): void {
  storage.setItem(SAVE_KEY, JSON.stringify(state))
}

/** Loads the save, migrating an older format up to the current one. Never writes to storage. */
export function loadGame(storage: Storage, opts?: { migrations?: Record<number, Migration>; current?: number; first?: number }): LoadResult {
  let raw: string | null
  try {
    raw = storage.getItem(SAVE_KEY)
  } catch {
    return { ok: false, reason: 'corrupt' }
  }
  if (raw === null) return { ok: false, reason: 'none' }

  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return { ok: false, reason: 'corrupt' }
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return { ok: false, reason: 'corrupt' }

  const migrated = migrateSave(data as Record<string, unknown>, opts)
  if (!migrated.ok) return { ok: false, reason: 'version' }
  const record = migrated.data
  if (REQUIRED_FIELDS.some((f) => typeof record[f] !== 'object' || record[f] === null)) {
    return { ok: false, reason: 'corrupt' }
  }
  return { ok: true, state: record as GameState }
}

export function deleteSave(storage: Storage): void {
  storage.removeItem(SAVE_KEY)
}
