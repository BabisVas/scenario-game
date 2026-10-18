// What a save looks like (its shape) and what content it refers to. Used by the
// save tests to catch a format change without a new version, and a content
// update that would orphan something an existing save points at.

import type { Content } from '../data/schema'
import type { GameState } from '../engine/types'

export type Shape = string | { [key: string]: Shape }

/** Objects keyed by content ids rather than by field names: their keys are data, not format. */
const MAPS = new Set(['zones', 'constellations', 'actionCounts'])

function merge(a: Shape | undefined, b: Shape): Shape {
  if (a === undefined) return b
  if (typeof a === 'string' || typeof b === 'string') {
    const parts = new Set([...String(typeof a === 'string' ? a : 'object').split('|'), ...String(typeof b === 'string' ? b : 'object').split('|')])
    return [...parts].sort().join('|')
  }
  const out: { [key: string]: Shape } = { ...a }
  for (const [k, v] of Object.entries(b)) out[k] = merge(out[k], v)
  return out
}

/** Field names and value types, recursively; arrays and id-keyed maps by the union of their entries. */
export function saveShape(value: unknown, key = ''): Shape {
  if (value === null) return 'null'
  if (Array.isArray(value)) {
    let inner: Shape | undefined
    for (const v of value) inner = merge(inner, saveShape(v))
    return { '[]': inner ?? 'empty' }
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    if (MAPS.has(key)) {
      let inner: Shape | undefined
      for (const [, v] of entries) inner = merge(inner, saveShape(v))
      return { '*': inner ?? 'empty' }
    }
    const out: { [key: string]: Shape } = {}
    for (const [k, v] of entries.sort(([a], [b]) => a.localeCompare(b))) if (v !== undefined) out[k] = saveShape(v, k)
    return out
  }
  return typeof value
}

/** Every content id the save refers to that the content no longer has. */
export function missingReferences(s: GameState, c: Content): string[] {
  const missing: string[] = []
  const check = (kind: string, id: string | null | undefined, list: { id: string }[]) => {
    if (id && !list.some((x) => x.id === id)) missing.push(`${kind} ${id}`)
  }
  for (const i of s.player.inventory) check('item', i.itemId, c.items)
  check('item', s.player.equipped.weapon, c.items)
  check('item', s.player.equipped.armor, c.items)
  for (const k of s.player.skills) check('skill', k.skillId, c.skills)
  check('stigma', s.player.stigma?.stigmaId, c.stigmas)
  check('constellation', s.player.stigma?.constellationId, c.constellations)
  check('attribute', s.player.attributeId, c.attributes)
  check('background', s.player.backgroundId, c.backgrounds)
  check('zone', s.zoneId, c.zones)
  for (const id of Object.keys(s.zones)) check('zone', id, c.zones)
  for (const id of Object.keys(s.constellations)) check('constellation', id, c.constellations)
  for (const v of s.survivors) {
    check('zone', v.zoneId, c.zones)
    check('attribute', v.attributeId, c.attributes)
  }
  if (s.phase.kind === 'scenario') check('scenario', s.phase.scenarioId, c.scenarios)
  if (s.phase.kind === 'rest') check('scenario', s.phase.nextScenarioId, c.scenarios)
  for (const id of s.clearedScenarioIds) check('scenario', id, c.scenarios)
  for (const id of s.foundHiddenIds) check('hidden scenario', id, c.hiddenScenarios)
  check('hidden scenario', s.hiddenScenario?.defId, c.hiddenScenarios)
  check('sub-scenario', s.subScenario?.defId, c.subScenarios)
  check('enemy', s.fight?.enemyId, c.enemies)
  check('item', s.fight?.loot, c.items)
  if (s.pendingChoice?.source === 'scenario') check('scenario', s.pendingChoice.scenarioId, c.scenarios)
  if (s.pendingChoice?.source === 'contract') check('constellation', s.pendingChoice.constellationId, c.constellations)
  for (const key of Object.keys(s.actionCounts)) check('zone', key.split('/')[0], c.zones)
  return missing
}
