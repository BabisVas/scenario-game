import { SAVE_KEY, SCHEMA_VERSION } from '../engine/config'
import type { GameState } from '../engine/types'

export type LoadResult = { ok: true; state: GameState } | { ok: false; reason: 'none' | 'corrupt' | 'version' }

const REQUIRED_FIELDS = ['player', 'phase', 'log'] as const

export function saveGame(state: GameState, storage: Storage): void {
  storage.setItem(SAVE_KEY, JSON.stringify(state))
}

export function loadGame(storage: Storage): LoadResult {
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

  const record = data as Record<string, unknown>
  if (record.schemaVersion !== SCHEMA_VERSION) return { ok: false, reason: 'version' }
  if (REQUIRED_FIELDS.some((f) => typeof record[f] !== 'object' || record[f] === null)) {
    return { ok: false, reason: 'corrupt' }
  }
  return { ok: true, state: data as GameState }
}

export function deleteSave(storage: Storage): void {
  storage.removeItem(SAVE_KEY)
}
