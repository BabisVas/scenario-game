// Main scenarios, sub-scenarios and hard choices. Scenario clocks only move
// when the player spends in-game hours.

import type { Content, ScenarioDef } from '../data/schema'
import { ANNOUNCER, SYSTEM } from '../data/names'
import { combatantFromEnemy, zoneDanger } from './actions'
import { withCarriedBonus, withCoinBonus } from './attributes'
import { startFight } from './combat'
import { REST_PERIOD_HOURS, WARD_WOUNDS } from './config'
import { onScenarioCleared, withReactions } from './constellations'
import { killPlayer } from './death'
import { checkHiddenTriggers, judgeHidden, windowRumors } from './hidden'
import { addItem } from './inventory'
import { capitalize, zoneRef } from './places'
import type { Rng } from './rng'
import { resolveScenarioForSurvivors } from './survivors'
import type { GameEvent, GameState, Step, Survivor, Tag } from './types'

const scenarioDef = (content: Content, id: string) => content.scenarios.find((d) => d.id === id)

export function spendHours(state: GameState, hours: number): GameState {
  const phase = state.phase.kind === 'dead' ? state.phase : { ...state.phase, hoursLeft: state.phase.hoursLeft - hours }
  const subScenario = state.subScenario && { ...state.subScenario, hoursLeft: state.subScenario.hoursLeft - hours }
  const hiddenScenario = state.hiddenScenario && { ...state.hiddenScenario, hoursLeft: state.hiddenScenario.hoursLeft - hours }
  return { ...state, phase, subScenario, hiddenScenario, inGameHour: state.inGameHour + hours }
}

export function recordProgress(
  state: GameState,
  kind: 'kill' | 'reach',
  detail: { enemyTags?: string[]; zoneId?: string },
  content: Content,
): GameState {
  let s = state
  const counts = (goal: { kind: string; enemyTag?: string; zoneId?: string }) =>
    goal.kind === kind &&
    (kind === 'kill' ? !goal.enemyTag || (detail.enemyTags ?? []).includes(goal.enemyTag) : goal.zoneId === detail.zoneId)

  if (s.phase.kind === 'scenario') {
    const def = scenarioDef(content, s.phase.scenarioId)
    if (def && counts(def.goal)) {
      s = { ...s, phase: { ...s.phase, progress: kind === 'kill' ? s.phase.progress + 1 : 1 } }
    }
  }
  if (s.subScenario) {
    const def = content.subScenarios.find((d) => d.id === s.subScenario!.defId)
    if (def && counts(def.goal)) {
      s = { ...s, subScenario: { ...s.subScenario, progress: kind === 'kill' ? s.subScenario.progress + 1 : 1 } }
    }
  }
  if (s.hiddenScenario) {
    const def = content.hiddenScenarios.find((d) => d.id === s.hiddenScenario!.defId)
    if (def && def.goal.kind !== 'survive' && counts(def.goal)) {
      s = { ...s, hiddenScenario: { ...s.hiddenScenario, progress: kind === 'kill' ? s.hiddenScenario.progress + 1 : 1 } }
    }
  }
  return s
}

const living = (s: GameState) => s.survivors.filter((v) => v.alive)
const livingMet = (s: GameState) => living(s).filter((v) => v.met)

export function startScenario(state: GameState, def: ScenarioDef, rng: Rng, content: Content): Step {
  const zones = { ...state.zones }
  const zone = (id: string) => zones[id] ?? { sealed: !!content.zones.find((z) => z.id === id)?.startsSealed, dangerBonus: 0 }
  for (const id of def.zoneChanges?.seal ?? []) zones[id] = { ...zone(id), sealed: true }
  for (const id of def.zoneChanges?.open ?? []) zones[id] = { ...zone(id), sealed: false }
  for (const [id, n] of Object.entries(def.zoneChanges?.danger ?? {})) zones[id] = { ...zone(id), dangerBonus: zone(id).dangerBonus + n }

  let protectedSurvivorId: string | undefined
  if (def.goal.kind === 'protect') {
    const pool = livingMet(state).length > 0 ? livingMet(state) : living(state)
    protectedSurvivorId = pool.length > 0 ? rng.pick(pool).id : undefined
  }

  // Standing in a zone as it seals: you are pushed out to the nearest open zone.
  let zoneId = state.zoneId
  const sealedEvents: GameEvent[] = []
  if (zones[zoneId]?.sealed) {
    const open = nearestOpenZone(zoneId, zones, content)
    if (open) {
      sealedEvents.push({ kind: 'system', text: `${capitalize(zoneRef(content, zoneId))} seals. You are pushed out into ${zoneRef(content, open.id)}.` })
      zoneId = open.id
    }
  }
  state = { ...state, zoneId }

  const needsGroup = def.goal.kind === 'choice' && def.goal.options.some((o) => o.outcome.spareCount !== undefined)
  const gathered = needsGroup ? gatherGroup(state, rng) : null
  const s: GameState = {
    ...(gathered?.state ?? state),
    zones,
    phase: {
      kind: 'scenario',
      scenarioId: def.id,
      hoursLeft: def.hours,
      progress: 0,
      killsAtStart: state.player.kills,
      ...(protectedSurvivorId ? { protectedSurvivorId, wardWounds: WARD_WOUNDS } : {}),
      ...(gathered ? { groupIds: gathered.ids } : {}),
    },
    pendingChoice: def.goal.kind === 'choice' ? { source: 'scenario', scenarioId: def.id } : state.pendingChoice,
  }

  const events: GameEvent[] = [...sealedEvents, { kind: 'system', text: def.announcement }]
  if (def.announcer) events.push({ kind: 'system', text: `${ANNOUNCER}: "${def.announcer}"` })
  if (def.narration) events.push({ kind: 'player', text: def.narration })
  if (gathered && gathered.ids.length > 0) {
    const names = gathered.ids.map((id) => s.survivors.find((v) => v.id === id)!.name)
    events.push({ kind: 'system', text: `The scenario gathers you with ${names.join(', ')}. Not all of you will leave.` })
  }
  if (protectedSurvivorId) {
    const who = state.survivors.find((v) => v.id === protectedSurvivorId)!
    events.push({ kind: 'system', text: `Keep ${who.name} alive until the clock runs out.` })
  }
  events.push(...windowRumors(s, def, content))
  return { state: s, events }
}

const nextScenario = (state: GameState, content: Content) =>
  content.scenarios.find((d) => !state.clearedScenarioIds.includes(d.id))

export function clearScenario(state: GameState, rng: Rng, content: Content): Step {
  if (state.phase.kind !== 'scenario') return { state, events: [] }
  const def = scenarioDef(content, state.phase.scenarioId)!
  const killsThisScenario = state.player.kills - (state.phase.killsAtStart ?? state.player.kills)

  let s: GameState = {
    ...state,
    player: {
      ...state.player,
      coins: state.player.coins + withCoinBonus(state, content, def.rewards.coins),
      points: state.player.points + 10 + killsThisScenario,
    },
    clearedScenarioIds: [...state.clearedScenarioIds, def.id],
  }
  const loot: string[] = [`${withCoinBonus(state, content, def.rewards.coins)} coins`]
  for (const itemId of def.rewards.itemIds ?? []) {
    s = addItem(s, itemId)
    loot.push(content.items.find((i) => i.id === itemId)?.name ?? itemId)
  }
  const skillId = def.rewards.skillId
  if (skillId && !s.player.skills.some((k) => k.skillId === skillId)) {
    s = { ...s, player: { ...s.player, skills: [...s.player.skills, { skillId, level: 1, uses: 0 }] } }
    loot.push(`skill ${content.skills.find((k) => k.id === skillId)?.name ?? skillId}`)
  }

  const events: GameEvent[] = [{ kind: 'system', text: `Scenario cleared: ${def.title}! Rewards: ${loot.join(', ')}.` }]
  const paid = onScenarioCleared(s, content)
  s = paid.state
  events.push(...paid.events)
  const survivors = resolveScenarioForSurvivors(s, def, rng)
  s = survivors.state
  events.push(...survivors.events)

  if (!s.rankingOpen) {
    s = { ...s, rankingOpen: true }
    events.push({ kind: 'system', text: `${SYSTEM} opens the ranking board. Every survivor now has a number.` })
  }

  const next = nextScenario(s, content)
  s = { ...s, phase: { kind: 'rest', nextScenarioId: next?.id ?? null, hoursLeft: REST_PERIOD_HOURS } }
  events.push(
    next
      ? { kind: 'system', text: `Rest for ${REST_PERIOD_HOURS} hours. Next: ${next.title}. ${next.twist}` }
      : { kind: 'system', text: `${SYSTEM} is preparing the next scenario.` },
  )
  return { state: s, events }
}

function goalMet(state: GameState, def: ScenarioDef): boolean {
  if (state.phase.kind !== 'scenario') return false
  const { progress, hoursLeft, protectedSurvivorId } = state.phase
  switch (def.goal.kind) {
    case 'survive':
      return hoursLeft <= 0 && !!state.phase.finalWaveBeaten
    case 'kill':
      return progress >= def.goal.count
    case 'reach':
    case 'choice':
      return progress >= 1
    case 'protect':
      return hoursLeft <= 0 && (!protectedSurvivorId || !!state.survivors.find((v) => v.id === protectedSurvivorId)?.alive)
  }
}

export function checkScenarioClock(state: GameState, rng: Rng, content: Content): Step {
  if (state.fight || state.pendingChoice || state.phase.kind === 'dead') return { state, events: [] }
  let s = state
  const events: GameEvent[] = []

  if (s.subScenario) {
    const sub = s.subScenario
    const def = content.subScenarios.find((d) => d.id === sub.defId)
    const met = !!def && (def.goal.kind === 'kill' ? sub.progress >= def.goal.count : sub.progress >= 1)
    if (def && met) {
      const coins = withCoinBonus(s, content, def.rewards.coins)
      s = { ...s, subScenario: null, player: { ...s.player, coins: s.player.coins + coins } }
      for (const itemId of def.rewards.itemIds ?? []) s = addItem(s, itemId)
      events.push({ kind: 'system', text: `Sub-scenario complete: ${def.title}. +${coins} coins.` })
    } else if (!def || sub.hoursLeft <= 0) {
      s = { ...s, subScenario: null }
      events.push({ kind: 'system', text: `Sub-scenario over: ${def?.title ?? 'unknown'}. Time ran out. No reward, no harm done.` })
    }
  }

  const hidden = judgeHidden(s, content)
  s = hidden.state
  events.push(...hidden.events)

  const phase = s.phase
  if (phase.kind === 'scenario') {
    const def = scenarioDef(content, phase.scenarioId)
    if (!def) return { state: s, events }
    const protectedDead =
      def.goal.kind === 'protect' &&
      !!phase.protectedSurvivorId &&
      s.survivors.find((v) => v.id === phase.protectedSurvivorId)?.alive === false
    let step: Step | null = null
    if (protectedDead) step = killPlayer(s, `${s.survivors.find((v) => v.id === phase.protectedSurvivorId)?.name ?? 'Your ward'} did not survive. Neither did you.`, content, rng)
    else if (def.goal.kind === 'survive' && phase.hoursLeft <= 0 && !phase.finalWaveBeaten) step = startFinalWave(s, def, content)
    else if (goalMet(s, def)) step = clearScenario(s, rng, content)
    else if (phase.hoursLeft <= 0) step = killPlayer(s, `Main Scenario #${def.number}, "${def.title}". The time limit expired.`, content, rng)
    if (step) {
      s = step.state
      events.push(...step.events)
    }
  } else if (phase.kind === 'rest' && phase.hoursLeft <= 0) {
    const next = (phase.nextScenarioId && scenarioDef(content, phase.nextScenarioId)) || nextScenario(s, content)
    if (next) {
      const step = startScenario(s, next, rng, content)
      s = step.state
      events.push(...step.events)
    } else {
      s = { ...s, phase: { kind: 'rest', nextScenarioId: null, hoursLeft: REST_PERIOD_HOURS } }
      events.push({ kind: 'system', text: `${SYSTEM} is preparing the next scenario.` })
    }
  }
  return { state: s, events }
}

const remember = (v: Survivor, memory: string, delta: number): Survivor => ({
  ...v,
  attitude: Math.max(-100, Math.min(100, v.attitude + delta)),
  memories: [memory, ...v.memories].slice(0, 5),
})

export function resolveChoice(
  state: GameState,
  optionId: string,
  targetSurvivorId: string | null,
  rng: Rng,
  content: Content,
  spareIds: string[] = [],
): Step {
  const pending = state.pendingChoice
  if (state.phase.kind !== 'scenario' || pending?.source !== 'scenario') return { state, events: [] }
  const def = scenarioDef(content, pending.scenarioId)
  if (!def || def.goal.kind !== 'choice') return { state, events: [] }
  const goal = def.goal

  let option = goal.options.find((o) => o.id === optionId) ?? goal.options.find((o) => o.id === goal.fallbackOptionId)!
  let target: Survivor | undefined
  if (option.target === 'met-survivor') {
    const candidates = livingMet(state)
    if (candidates.length === 0) {
      option = goal.options.find((o) => o.id === goal.fallbackOptionId)!
    } else {
      target = candidates.find((v) => v.id === targetSurvivorId)
      if (!target) return { state, events: [] }
    }
  }

  let s: GameState = { ...state, pendingChoice: null }
  // Choosing to fight is brave, whatever else the option is.
  const choiceTags: Tag[] = option.outcome.fight && !option.tags.includes('bravery') ? [...option.tags, 'bravery'] : option.tags
  const events: GameEvent[] = [{ kind: 'player', text: `You chose: ${option.label}.`, tags: choiceTags }]
  const found = checkHiddenTriggers(s, { choice: { scenarioId: def.id, optionId: option.id } }, content)
  s = found.state
  events.push(...found.events)
  const out = option.outcome

  if (out.coins) {
    const gain = out.coins > 0 ? withCarriedBonus(s, content, out.coins) : out.coins
    s = { ...s, player: { ...s.player, coins: Math.max(0, s.player.coins + gain) } }
  }
  if (out.kill && target) {
    const victim = target
    s = {
      ...s,
      survivors: s.survivors.map((v) => {
        if (v.id === victim.id) return { ...v, alive: false, hp: 0, deathNote: `Killed by ${state.player.name} in "${def.title}".` }
        if (v.alive && v.zoneId === victim.zoneId) return remember(v, 'betrayed', -30)
        return v
      }),
    }
    events.push({ kind: 'survivor', text: `${victim.name} is gone. The ones who saw it will not forget.` })
  }
  if (out.spareCount !== undefined) {
    const step = cullGroup(s, out.spareCount, spareIds)
    s = step.state
    events.push(...step.events)
  }
  if (out.cityAttitude) {
    const delta = out.cityAttitude
    s = { ...s, survivors: s.survivors.map((v) => (v.alive ? { ...v, attitude: Math.max(-100, Math.min(100, v.attitude + delta)) } : v)) }
  }
  if (out.announce) events.push({ kind: 'system', text: `${ANNOUNCER}: "${out.announce}"` })
  if (out.fight) {
    const enemy = content.enemies.find((e) => e.id === out.fight)!
    const fight = startFight(s, combatantFromEnemy(enemy, 1 + Math.floor(def.number / 3)), 'scenario', { enemyId: enemy.id })
    return withReactions({ state: fight.state, events: [...events, ...fight.events] }, rng, content)
  }

  s = { ...s, phase: { ...s.phase, progress: 1 } as GameState['phase'] }
  const clock = checkScenarioClock(s, rng, content)
  return withReactions({ state: clock.state, events: [...events, ...clock.events] }, rng, content)
}

const GROUP_MIN = 4
const GROUP_MAX = 6

/**
 * "Only some of you walk out": 4–6 living survivors where the player stands,
 * people they know first. If the zone is short, others are drawn in. Everyone
 * gathered is now someone the player has met.
 */
function gatherGroup(state: GameState, rng: Rng): { state: GameState; ids: string[] } {
  const size = rng.int(GROUP_MIN, GROUP_MAX)
  const shuffle = <T,>(list: T[]) => {
    const out = [...list]
    for (let i = out.length - 1; i > 0; i--) {
      const j = rng.int(0, i)
      ;[out[i], out[j]] = [out[j], out[i]]
    }
    return out
  }
  const here = living(state).filter((v) => v.zoneId === state.zoneId)
  const elsewhere = living(state).filter((v) => v.zoneId !== state.zoneId)
  const order = [
    ...shuffle(here.filter((v) => v.met)),
    ...shuffle(here.filter((v) => !v.met)),
    ...shuffle(elsewhere.filter((v) => v.met)),
    ...shuffle(elsewhere.filter((v) => !v.met)),
  ]
  const ids = order.slice(0, size).map((v) => v.id)
  const chosen = new Set(ids)
  return {
    state: {
      ...state,
      survivors: state.survivors.map((v) => (chosen.has(v.id) ? { ...v, met: true, zoneId: state.zoneId } : v)),
    },
    ids,
  }
}

/** The player picks up to spareCount of the group to spare; the rest of the group die. */
function cullGroup(state: GameState, spareCount: number, spareIds: string[]): Step {
  const groupIds = state.phase.kind === 'scenario' ? (state.phase.groupIds ?? []) : []
  const group = state.survivors.filter((v) => v.alive && groupIds.includes(v.id))
  // The first picks count; picks of anyone outside the group are ignored.
  const spared = [...new Set(spareIds)]
    .map((id) => group.find((v) => v.id === id))
    .filter((v): v is Survivor => !!v)
    .slice(0, spareCount)
  const lost = group.filter((v) => !spared.includes(v))
  const lostIds = new Set(lost.map((v) => v.id))
  const sparedIds = new Set(spared.map((v) => v.id))
  return {
    state: {
      ...state,
      survivors: state.survivors.map((v) => {
        if (lostIds.has(v.id)) return { ...v, alive: false, hp: 0, partyId: null, deathNote: 'Left behind by the scenario.' }
        if (sparedIds.has(v.id)) return remember(v, 'spared', 20)
        return v
      }),
    },
    events: lost.length > 0 ? [{ kind: 'survivor', text: `Left behind: ${lost.map((v) => v.name).join(', ')}.` }] : [],
  }
}

/** After a scenario fight ends: a win resolves the choice, running away puts it back. */
export function afterScenarioFight(state: GameState, result: 'won' | 'fled'): GameState {
  if (state.phase.kind !== 'scenario') return state
  if (result === 'won') return { ...state, phase: { ...state.phase, progress: 1 } }
  return { ...state, pendingChoice: { source: 'scenario', scenarioId: state.phase.scenarioId } }
}

/** Marks the Final Wave beaten, so the next clock check clears the survive scenario. */
export function afterFinalWave(state: GameState): GameState {
  if (state.phase.kind !== 'scenario') return state
  return { ...state, phase: { ...state.phase, finalWaveBeaten: true } }
}

/**
 * When a survive scenario's clock hits zero, one last enemy always comes: the
 * scenario's named Final Wave at normal strength, or the toughest enemy where
 * the player stands, one danger level stronger. Main survive scenarios only:
 * hidden scenarios never bring one (see judgeHidden).
 */
function startFinalWave(state: GameState, def: ScenarioDef, content: Content): Step {
  const zone = content.zones.find((z) => z.id === state.zoneId) ?? content.zones[0]
  const local = content.enemies.filter((e) => zone.enemyIds.includes(e.id))
  const pool = local.length > 0 ? local : content.enemies
  const named = def.finalWave ? content.enemies.find((e) => e.id === def.finalWave) : undefined
  const enemy = named ?? [...pool].sort((a, b) => b.hp - a.hp)[0]
  // A named wave is chosen by the scenario at normal strength; the default is the local toughest, a step stronger.
  const danger = zoneDanger(state, zone) + (named ? 0 : 1)
  const fight = startFight(state, combatantFromEnemy(enemy, danger), 'final-wave', { enemyId: enemy.id })
  return {
    state: fight.state,
    events: [{ kind: 'system', text: `The clock hits zero. The Final Wave arrives: ${enemy.name}! Beat it to clear "${def.title}".` }, ...fight.events],
  }
}

/** Breadth-first: the closest zone (by moves) that is not sealed. */
function nearestOpenZone(fromId: string, zones: GameState['zones'], content: Content) {
  const isOpen = (id: string) => !(zones[id]?.sealed ?? content.zones.find((z) => z.id === id)?.startsSealed)
  const seen = new Set([fromId])
  const queue = [fromId]
  while (queue.length > 0) {
    const id = queue.shift()
    const here = content.zones.find((z) => z.id === id)
    for (const n of here?.connections ?? []) {
      if (seen.has(n)) continue
      seen.add(n)
      if (isOpen(n)) return content.zones.find((z) => z.id === n)
      queue.push(n)
    }
  }
  return content.zones.find((z) => isOpen(z.id))
}
