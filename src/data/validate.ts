// Content checks, run at test time. An empty list means the content is valid.

import type { Content } from './schema'

/** Proper nouns from Omniscient Reader. The world is original: none of these may appear in content. */
export const BANNED_NAMES: string[] = [
  'Omniscient Reader',
  'Dokja',
  'Joonghyuk',
  'Jonghyuk',
  'Sooyoung',
  'Sangah',
  'Hyunsung',
  'Heewon',
  'Jihye',
  'Yoosung',
  'Gilyoung',
  'Namwoon',
  'Pildu',
  'Myungoh',
  'Bihyung',
  'Dokkaebi',
  'Star Stream',
  'Fourth Wall',
  'Ways of Survival',
  'Ways to Survive',
  'Tls123',
]

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/

export function validateContent(c: Content): string[] {
  const problems: string[] = []

  const collections = {
    backgrounds: c.backgrounds,
    zones: c.zones,
    enemies: c.enemies,
    items: c.items,
    skills: c.skills,
    scenarios: c.scenarios,
    constellations: c.constellations,
    subScenarios: c.subScenarios,
  }
  for (const [name, list] of Object.entries(collections)) {
    const seen = new Set<string>()
    for (const { id } of list) {
      if (seen.has(id)) problems.push(`${name}: duplicate id "${id}"`)
      seen.add(id)
      if (!KEBAB.test(id)) problems.push(`${name}: id "${id}" is not kebab-case`)
    }
  }
  const names = new Set<string>()
  for (const t of c.survivorTemplates) {
    if (names.has(t.name)) problems.push(`survivorTemplates: duplicate name "${t.name}"`)
    names.add(t.name)
  }

  const ids = (list: { id: string }[]) => new Set(list.map((x) => x.id))
  const zoneIds = ids(c.zones)
  const enemyIds = ids(c.enemies)
  const itemIds = ids(c.items)
  const skillIds = ids(c.skills)
  const ref = (kind: string, id: string, known: Set<string>, where: string) => {
    if (!known.has(id)) problems.push(`${where}: unknown ${kind} "${id}"`)
  }

  for (const b of c.backgrounds) ref('item', b.startingItemId, itemIds, `background ${b.id}`)
  for (const z of c.zones) {
    if (z.actions.length === 0) problems.push(`zone ${z.id}: has no actions`)
    for (const e of z.enemyIds) ref('enemy', e, enemyIds, `zone ${z.id}`)
  }
  for (const e of c.enemies) for (const d of e.drops) ref('item', d.itemId, itemIds, `enemy ${e.id} drop`)
  for (const k of c.constellations) ref('skill', k.contract.giftSkillId, skillIds, `constellation ${k.id} contract`)

  c.scenarios.forEach((s, i) => {
    const where = `scenario ${s.id}`
    if (s.number !== i + 1) problems.push(`${where}: number ${s.number} should be ${i + 1} (numbers run 1..n in order, no gaps)`)
    for (const it of s.rewards.itemIds ?? []) ref('item', it, itemIds, `${where} reward`)
    if (s.rewards.skillId) ref('skill', s.rewards.skillId, skillIds, `${where} reward`)
    const changed = [
      ...(s.zoneChanges?.seal ?? []),
      ...(s.zoneChanges?.open ?? []),
      ...Object.keys(s.zoneChanges?.danger ?? {}),
    ]
    for (const z of changed) ref('zone', z, zoneIds, `${where} zoneChanges`)
    const g = s.goal
    if (g.kind === 'reach') ref('zone', g.zoneId, zoneIds, `${where} goal`)
    if (g.kind === 'choice') {
      const fallback = g.options.find((o) => o.id === g.fallbackOptionId)
      if (!fallback) problems.push(`${where}: fallback option "${g.fallbackOptionId}" is not one of its options`)
      else if (fallback.target) problems.push(`${where}: fallback option "${fallback.id}" must not need a target`)
      for (const o of g.options) if (o.outcome.fight) ref('enemy', o.outcome.fight, enemyIds, `${where} option ${o.id}`)
    }
  })

  for (const s of c.subScenarios) {
    const where = `sub-scenario ${s.id}`
    for (const z of s.zoneIds) ref('zone', z, zoneIds, where)
    for (const it of s.rewards.itemIds ?? []) ref('item', it, itemIds, `${where} reward`)
    if (s.goal.kind === 'reach') ref('zone', s.goal.zoneId, zoneIds, `${where} goal`)
  }

  const texts: string[] = []
  const collect = (v: unknown) => {
    if (typeof v === 'string') texts.push(v)
    else if (Array.isArray(v)) v.forEach(collect)
    else if (v && typeof v === 'object') Object.values(v).forEach(collect)
  }
  collect(c)
  for (const banned of BANNED_NAMES) {
    const needle = banned.toLowerCase()
    const hit = texts.find((t) => t.toLowerCase().includes(needle))
    if (hit) problems.push(`borrowed name "${banned}" in: ${hit}`)
  }

  return problems
}
