import { content } from '.'
import type { ScenarioDef } from './schema'

/** Which zones are sealed when each scenario starts, applying every scenario's zone changes in order. */
function sealedAtStart(): Map<string, Set<string>> {
  const sealed = new Set(content.zones.filter((z) => z.startsSealed).map((z) => z.id))
  const out = new Map<string, Set<string>>()
  for (const s of content.scenarios) {
    for (const id of s.zoneChanges?.seal ?? []) sealed.add(id)
    for (const id of s.zoneChanges?.open ?? []) sealed.delete(id)
    out.set(s.id, new Set(sealed))
  }
  return out
}

/** Moves from one zone to another through open zones (the start zone counts as open). */
function moves(from: string, to: string, sealed: Set<string>): number {
  const dist = new Map([[from, 0]])
  const queue = [from]
  while (queue.length > 0) {
    const here = queue.shift()!
    for (const n of content.zones.find((z) => z.id === here)!.connections) {
      if (dist.has(n) || sealed.has(n)) continue
      dist.set(n, dist.get(here)! + 1)
      queue.push(n)
    }
  }
  return dist.get(to) ?? Infinity
}

describe('reach scenarios can be made in time from anywhere', () => {
  const sealed = sealedAtStart()
  const reach = content.scenarios.filter((s): s is ScenarioDef & { goal: { kind: 'reach'; zoneId: string } } => s.goal.kind === 'reach')
  test.each(reach.map((s) => [s.id, s] as const))('%s', (_, s) => {
    const closed = sealed.get(s.id)!
    for (const z of content.zones.filter((x) => !closed.has(x.id))) {
      // Standing in the target means leaving and coming back: two moves.
      const need = z.id === s.goal.zoneId ? 2 : moves(z.id, s.goal.zoneId, closed)
      // Two hours spare for ambush fights on the way.
      expect({ from: z.id, need }).toEqual({ from: z.id, need: Math.min(need, s.hours - 2) })
    }
  })
})

test('every skill can be earned: a reward, the shop or training', () => {
  const rewarded = new Set([...content.scenarios, ...content.hiddenScenarios].map((s) => s.rewards.skillId).filter(Boolean))
  for (const k of content.skills) expect({ skill: k.id, earned: rewarded.has(k.id) || k.price !== undefined || !!k.trainable }).toEqual({ skill: k.id, earned: true })
})

test('every rare item can be found, and none is ever sold', () => {
  const sources = new Set([
    ...[...content.scenarios, ...content.hiddenScenarios, ...content.subScenarios].flatMap((s) => s.rewards.itemIds ?? []),
    ...content.enemies.flatMap((e) => e.drops.map((d) => d.itemId)),
    ...content.zones.flatMap((z) => (z.finds ?? []).map((f) => f.itemId)),
  ])
  for (const i of content.items.filter((x) => x.kind === 'rare')) {
    expect({ item: i.id, found: sources.has(i.id), sold: i.inShop }).toEqual({ item: i.id, found: true, sold: false })
  }
})

test("an item a hidden scenario wants carried in cannot turn up where it must be carried", () => {
  for (const h of content.hiddenScenarios) {
    if (h.trigger.kind !== 'carry-item') continue
    const { itemId, zoneId } = h.trigger
    const zone = content.zones.find((z) => z.id === zoneId)!
    expect(zone.finds?.some((f) => f.itemId === itemId) ?? false).toBe(false)
    const local = content.enemies.filter((e) => zone.enemyIds.includes(e.id))
    expect(local.some((e) => e.drops.some((d) => d.itemId === itemId))).toBe(false)
  }
})

test('the first version ships the planned amount of content', () => {
  expect({
    zones: content.zones.length,
    enemies: content.enemies.length,
    items: content.items.length,
    skills: content.skills.length,
    stigmas: content.stigmas.length,
    attributes: content.attributes.length,
    hidden: content.hiddenScenarios.length,
    subs: content.subScenarios.length,
    constellations: content.constellations.length,
    survivors: content.survivorTemplates.length,
    scenarios: content.scenarios.length,
  }).toEqual({ zones: 8, enemies: 15, items: 25, skills: 12, stigmas: 8, attributes: 16, hidden: 6, subs: 8, constellations: 8, survivors: 40, scenarios: 10 })
})

test('the ten scenarios cover every goal kind, and the survivors every personality', () => {
  expect(new Set(content.scenarios.map((s) => s.goal.kind))).toEqual(new Set(['survive', 'kill', 'reach', 'protect', 'choice']))
  expect(new Set(content.survivorTemplates.map((t) => t.personality)).size).toBe(5)
})

test('each constellation loves a different tag and has at least 3 lines of every kind', () => {
  const favorite = content.constellations.map((c) => Object.entries(c.likes).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0][0])
  expect(new Set(favorite).size).toBe(content.constellations.length)
  for (const c of content.constellations) for (const lines of Object.values(c.lines)) expect(lines.length).toBeGreaterThanOrEqual(3)
})

test('every main survive scenario names a Final Wave and difficulty rises', () => {
  for (const s of content.scenarios.filter((x) => x.goal.kind === 'survive')) expect(s.finalWave).toBeTruthy()
  const rates = content.scenarios.map((s) => s.survivorDeathRate)
  expect([...rates].sort((a, b) => a - b)).toEqual(rates)
})
