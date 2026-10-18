// Save migration. Every change to the save format bumps SCHEMA_VERSION and adds
// one step here, from the previous version to the new one, so an update never
// makes a running game unreadable. Each step is tested against a real saved game
// from its version (src/save/fixtures/save-v<N>.json). See CLAUDE.md, "Saves".

import { SCHEMA_VERSION } from '../engine/config'

type SaveData = Record<string, unknown>
export type Migration = (save: SaveData) => SaveData

/** The oldest save format that can still be loaded. Earlier ones predate any released game. */
export const FIRST_SUPPORTED_VERSION = 3

/** MIGRATIONS[n] turns a version-n save into a version-(n + 1) save. */
export const MIGRATIONS: Record<number, Migration> = {}

type Options = { migrations?: Record<number, Migration>; current?: number; first?: number }

/**
 * Brings a parsed save up to the current version, one step at a time. Refuses
 * (without changing anything) a save from a newer game, one older than the
 * first supported version, a missing step, a step that throws, or a step that
 * does not land on the next version.
 */
export function migrateSave(save: SaveData, opts: Options = {}): { ok: true; data: SaveData } | { ok: false } {
  const migrations = opts.migrations ?? MIGRATIONS
  const current = opts.current ?? SCHEMA_VERSION
  const first = opts.first ?? FIRST_SUPPORTED_VERSION
  const start = save.schemaVersion
  if (typeof start !== 'number' || !Number.isInteger(start) || start < first || start > current) return { ok: false }
  let data = save
  for (let v = start; v < current; v++) {
    const step = migrations[v]
    if (!step) return { ok: false }
    try {
      data = step(structuredClone(data))
    } catch {
      return { ok: false }
    }
    if (data.schemaVersion !== v + 1) return { ok: false }
  }
  return { ok: true, data }
}
