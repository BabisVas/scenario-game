/// <reference types="node" />
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { content } from '../data'
import { SAVE_KEY, SCHEMA_VERSION } from '../engine/config'
import { catchUp } from '../engine/time'
import { worldTick } from '../engine/survivors'
import { createRng } from '../engine/rng'
import { runAction } from '../ui/useGame'
import { memoryStorage } from '../test/fixtures'
import { FIRST_SUPPORTED_VERSION, MIGRATIONS, migrateSave } from './migrate'
import { loadGame } from './save'
import { missingReferences, saveShape } from './saveShape'
import { richState } from '../test/saveFixtures'

const fixturePath = (name: string) => join(process.cwd(), 'src/save/fixtures', name)
const versions = Array.from({ length: SCHEMA_VERSION - FIRST_SUPPORTED_VERSION + 1 }, (_, i) => FIRST_SUPPORTED_VERSION + i)

describe('the migration chain', () => {
  const toy = {
    1: (s: Record<string, unknown>) => ({ ...s, schemaVersion: 2, b: 'added in 2' }),
    2: (s: Record<string, unknown>) => ({ ...s, schemaVersion: 3, c: 'added in 3' }),
  }
  test('an old save runs every step, in order, up to the current version', () => {
    const r = migrateSave({ schemaVersion: 1, a: 1 }, { migrations: toy, current: 3, first: 1 })
    expect(r).toEqual({ ok: true, data: { schemaVersion: 3, a: 1, b: 'added in 2', c: 'added in 3' } })
  })
  test('a save at the current version is left alone', () => {
    const save = { schemaVersion: 3, a: 1 }
    expect(migrateSave(save, { migrations: toy, current: 3, first: 1 })).toEqual({ ok: true, data: save })
  })
  test('a save from a newer game, or older than the first supported version, is refused', () => {
    expect(migrateSave({ schemaVersion: 4 }, { migrations: toy, current: 3, first: 1 }).ok).toBe(false)
    // Even with a step for it, a version before the first supported one is refused.
    const fromZero = { ...toy, 0: (s: Record<string, unknown>) => ({ ...s, schemaVersion: 1 }) }
    expect(migrateSave({ schemaVersion: 0 }, { migrations: fromZero, current: 3, first: 1 }).ok).toBe(false)
  })
  test('a missing step or a step that throws is refused, never half-applied', () => {
    expect(migrateSave({ schemaVersion: 1 }, { migrations: { 2: toy[2] }, current: 3, first: 1 }).ok).toBe(false)
    const boom = { ...toy, 2: () => { throw new Error('bad') } }
    expect(migrateSave({ schemaVersion: 1 }, { migrations: boom, current: 3, first: 1 }).ok).toBe(false)
  })
  test('a step must land on the next version', () => {
    const skips = { ...toy, 1: (s: Record<string, unknown>) => ({ ...s, schemaVersion: 3 }) }
    expect(migrateSave({ schemaVersion: 1 }, { migrations: skips, current: 3, first: 1 }).ok).toBe(false)
  })
})

describe('every save format the game has shipped still loads', () => {
  test('every version from the first supported one has a migration to the next', () => {
    for (const v of versions.slice(0, -1)) expect({ version: v, migration: typeof MIGRATIONS[v] }).toEqual({ version: v, migration: 'function' })
  })
  test.each(versions)('a saved game from version %i loads, catches up and plays on', (v) => {
    const path = fixturePath(`save-v${v}.json`)
    expect({ fixture: `src/save/fixtures/save-v${v}.json`, exists: existsSync(path) }).toEqual({ fixture: `src/save/fixtures/save-v${v}.json`, exists: true })
    const storage = memoryStorage()
    storage.setItem(SAVE_KEY, readFileSync(path, 'utf8'))
    const loaded = loadGame(storage)
    expect(loaded.ok).toBe(true)
    if (!loaded.ok) return
    expect(loaded.state.schemaVersion).toBe(SCHEMA_VERSION)
    // Content updates may add, never remove or rename, anything a save refers to.
    expect(missingReferences(loaded.state, content)).toEqual([])
    const rng = createRng(loaded.state.rngState)
    const later = catchUp(loaded.state, loaded.state.worldTickAt + 3 * 3600_000, rng, (s, r) => worldTick(s, r, content)).state
    expect(() => runAction(later, { kind: 'zone', zoneId: later.zoneId, action: 'rest' }, rng, content)).not.toThrow()
  })
})

test('the save format has not changed without a new save version', () => {
  const path = fixturePath(`shape-v${SCHEMA_VERSION}.json`)
  const recorded = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null
  // If this fails: the shape of GameState changed. Bump SCHEMA_VERSION, add a migration from the
  // previous version in src/save/migrate.ts, then run `npm run save:fixtures` to record the new
  // version's saved game and shape. See CLAUDE.md, "Saves".
  expect(saveShape(richState())).toEqual(recorded)
})
