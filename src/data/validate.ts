// Content checks, run at test time. An empty list means the content is valid.

import type { ChoiceOption, Content } from './schema'

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
  'Hayoung',
  'Seolhwa',
  'Jaehwa',
  'Kirgios',
  'Biyoo',
  'Chungmuro',
  'Geumho',
  'Gwanghwamun',
  'Demon-like Judge',
  'Secretive Plotter',
  'Golden Headband',
  'Maritime War God',
  'Abyssal Black Flame',
  'Breaking the Sky',
  'Peace Land',
  'Dark Castle',
  'Uriel',
  'Metatron',
  'Agares',
  'Wukong',
  'Olympus',
  'Asgard',
  'Vedas',
  'Papyrus',
  'Industrial Complex',
  'Kim Dokja',
  'Yoo Joonghyuk',
]

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/

const OUTCOME_FIELDS = ['kill', 'spareCount', 'coins', 'fight', 'cityAttitude', 'announce']

/** Choice outcomes the engine cannot run, explained. */
function outcomeProblems(o: ChoiceOption, where: string): string[] {
  const p: string[] = []
  const out = o.outcome as Record<string, unknown>
  for (const key of Object.keys(out)) if (!OUTCOME_FIELDS.includes(key)) p.push(`${where}: unknown outcome field "${key}"`)
  if (o.target !== undefined && o.target !== 'met-survivor') p.push(`${where}: unknown target "${String(o.target)}"`)
  if (o.outcome.kill && o.target !== 'met-survivor') p.push(`${where}: kill needs target "met-survivor"`)
  const spare = o.outcome.spareCount
  if (spare !== undefined) {
    if (!Number.isInteger(spare) || spare < 0) p.push(`${where}: spareCount must be a whole number, 0 or more`)
    if (o.target) p.push(`${where}: spareCount works on the scenario's group and cannot take a target`)
  }
  const city = o.outcome.cityAttitude
  if (city !== undefined && (typeof city !== 'number' || city < -100 || city > 100)) p.push(`${where}: cityAttitude must be between -100 and 100`)
  if (o.outcome.announce !== undefined && !o.outcome.announce.trim()) p.push(`${where}: announce must not be empty`)
  return p
}

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
    attributes: c.attributes,
    stigmas: c.stigmas,
    hiddenScenarios: c.hiddenScenarios,
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

  const backgroundIds = ids(c.backgrounds)
  for (const a of c.attributes) {
    const want = a.rarity === 'legendary' ? 2 : 1
    if (a.effects.length !== want) problems.push(`attribute ${a.id}: a ${a.rarity} attribute has exactly ${want} effect${want > 1 ? 's' : ''}, not ${a.effects.length}`)
    if (new Set(a.effects.map((e) => e.kind)).size !== a.effects.length) problems.push(`attribute ${a.id}: its effects must be of different kinds`)
  }
  for (const a of c.attributes) for (const b of Object.keys(a.backgroundWeights)) ref('background', b, backgroundIds, 'attribute ' + a.id)
  for (const b of c.backgrounds) ref('item', b.startingItemId, itemIds, `background ${b.id}`)
  for (const z of c.zones) {
    if (z.actions.length === 0) problems.push(`zone ${z.id}: has no actions`)
    for (const n of z.connections) {
      if (n === z.id) problems.push(`zone ${z.id}: connects to itself`)
      else if (!zoneIds.has(n)) problems.push(`zone ${z.id}: unknown connection "${n}"`)
      else if (!c.zones.find((o) => o.id === n)!.connections.includes(z.id)) problems.push(`zone ${z.id}: connection to ${n} is one-way; connections must go both ways`)
    }
    for (const e of z.enemyIds) ref('enemy', e, enemyIds, `zone ${z.id}`)
    for (const f of z.finds ?? []) {
      ref('item', f.itemId, itemIds, `zone ${z.id} find`)
      if (!(f.chance > 0 && f.chance <= 1)) problems.push(`zone ${z.id} find ${f.itemId}: chance must be above 0 and at most 1`)
    }
  }
  if (c.zones.length > 0) {
    const reached = new Set([c.zones[0].id])
    const queue = [c.zones[0].id]
    while (queue.length > 0) {
      const id = queue.shift()
      const here = c.zones.find((z) => z.id === id)
      for (const n of here?.connections ?? []) if (zoneIds.has(n) && !reached.has(n)) { reached.add(n); queue.push(n) }
    }
    for (const z of c.zones) if (!reached.has(z.id)) problems.push(`zone ${z.id}: cannot be reached from ${c.zones[0].id}`)
  }
  for (const e of c.enemies) for (const d of e.drops) ref('item', d.itemId, itemIds, `enemy ${e.id} drop`)
  for (const e of c.enemies) for (const d of e.drops) {
    if (typeof d.chance !== 'number' || !(d.chance > 0 && d.chance <= 1)) problems.push(`enemy ${e.id} drop ${d.itemId}: chance must be above 0 and at most 1`)
  }
  for (const it of c.items) {
    const where = `item ${it.id}`
    const e = it.effect
    if (e?.stun && !e.damage) problems.push(`${where}: stun needs damage`)
    if (e?.statPoint !== undefined && (!Number.isInteger(e.statPoint) || e.statPoint < 1)) problems.push(`${where}: statPoint must be a whole number, 1 or more`)
    if (it.passive && e) problems.push(`${where}: a passive item is never used up, so it cannot also have an effect`)
    if (it.passive && !(it.passive.coinPercent > 0)) problems.push(`${where}: passive coinPercent must be above 0`)
  }
  const stigmaIds = ids(c.stigmas)
  for (const k of c.constellations) ref('stigma', k.contract.stigmaId, stigmaIds, `constellation ${k.id} contract`)

  c.scenarios.forEach((s, i) => {
    const where = `scenario ${s.id}`
    if (s.number !== i + 1) problems.push(`${where}: number ${s.number} should be ${i + 1} (numbers run 1..n in order, no gaps)`)
    for (const it of s.rewards.itemIds ?? []) ref('item', it, itemIds, `${where} reward`)
    if (s.rewards.skillId) ref('skill', s.rewards.skillId, skillIds, `${where} reward`)
    if (s.finalWave) ref('enemy', s.finalWave, enemyIds, `${where} final wave`)
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
      for (const o of g.options) {
        if (o.outcome.fight) ref('enemy', o.outcome.fight, enemyIds, `${where} option ${o.id}`)
        problems.push(...outcomeProblems(o, `${where} option ${o.id}`))
      }
    }
  })

  for (const s of c.subScenarios) {
    const where = `sub-scenario ${s.id}`
    for (const z of s.zoneIds) ref('zone', z, zoneIds, where)
    for (const it of s.rewards.itemIds ?? []) ref('item', it, itemIds, `${where} reward`)
    if (s.goal.kind === 'reach') ref('zone', s.goal.zoneId, zoneIds, `${where} goal`)
  }

  for (const h of c.hiddenScenarios) {
    const where = `hidden scenario ${h.id}`
    const t = h.trigger
    if (t.kind === 'repeat-action' || t.kind === 'carry-item' || t.kind === 'zone-during-scenario') ref('zone', t.zoneId, zoneIds, `${where} trigger`)
    if (t.kind === 'carry-item') ref('item', t.itemId, itemIds, `${where} trigger`)
    if (t.kind === 'zone-during-scenario' && !c.scenarios.some((s) => s.number === t.scenarioNumber)) {
      problems.push(`${where} trigger: unknown scenario number ${t.scenarioNumber}`)
    }
    if (t.kind === 'choose-option') {
      const s = c.scenarios.find((x) => x.id === t.scenarioId)
      if (!s) problems.push(`${where} trigger: unknown scenario "${t.scenarioId}"`)
      else if (s.goal.kind !== 'choice' || !s.goal.options.some((o) => o.id === t.optionId)) {
        problems.push(`${where} trigger: scenario ${s.id} has no option "${t.optionId}"`)
      }
    }
    if (h.goal.kind === 'reach' || (h.goal.kind === 'survive' && h.goal.zoneId)) ref('zone', h.goal.zoneId!, zoneIds, `${where} goal`)
    for (const it of h.rewards.itemIds ?? []) ref('item', it, itemIds, `${where} reward`)
    if (h.rewards.skillId) ref('skill', h.rewards.skillId, skillIds, `${where} reward`)
  }

  for (const [personality, bands] of Object.entries(c.greetings ?? {})) {
    for (const [band, lines] of Object.entries(bands)) {
      const where = `greetings ${personality}/${band}`
      if (lines.length < 3) problems.push(`${where}: needs at least 3 lines, has ${lines.length}`)
      for (const line of lines) if (!line.includes('{name}')) problems.push(`${where}: a line without {name}: ${line}`)
    }
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
