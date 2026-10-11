// Main scenarios, sub-scenarios and hard choices. Scenario clocks only move
// when the player spends in-game hours.

import type { Content, ScenarioDef } from '../data/schema'
import { SYSTEM } from '../data/names'
import { combatantFromEnemy } from './actions'
import { withCoinBonus } from './attributes'
import { startFight } from './combat'
import { REST_PERIOD_HOURS } from './config'
import { onScenarioCleared, withReactions } from './constellations'
import { killPlayer } from './death'
import { checkHiddenTriggers, judgeHidden } from './hidden'
import { addItem } from './inventory'
import type { Rng } from './rng'
import { resolveScenarioForSurvivors } from './survivors'
import type { GameEvent, GameState, Step, Survivor } from './types'

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

  const s: GameState = {
    ...state,
    zones,
    phase: {
      kind: 'scenario',
      scenarioId: def.id,
      hoursLeft: def.hours,
      progress: 0,
      killsAtStart: state.player.kills,
      ...(protectedSurvivorId ? { protectedSurvivorId } : {}),
    },
    pendingChoice: def.goal.kind === 'choice' ? { source: 'scenario', scenarioId: def.id } : state.pendingChoice,
  }

  const events: GameEvent[] = [
    { kind: 'system', text: def.announcement },
    { kind: 'system', text: `Main Scenario ${def.number}: ${def.title}. ${def.hours} hours. ${def.rules.join(' ')}`.trim() },
  ]
  if (protectedSurvivorId) {
    const who = state.survivors.find((v) => v.id === protectedSurvivorId)!
    events.push({ kind: 'system', text: `Keep ${who.name} alive until the clock runs out.` })
  }
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
      return hoursLeft <= 0
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
    if (protectedDead) step = killPlayer(s, `The one you were sworn to protect died, and the scenario took you with them.`, content, rng)
    else if (goalMet(s, def)) step = clearScenario(s, rng, content)
    else if (phase.hoursLeft <= 0) step = killPlayer(s, `Failed main scenario ${def.number}, "${def.title}". The clock ran out.`, content, rng)
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
  const events: GameEvent[] = [{ kind: 'player', text: `You chose: ${option.label}.`, tags: option.tags }]
  const found = checkHiddenTriggers(s, { choice: { scenarioId: def.id, optionId: option.id } }, content)
  s = found.state
  events.push(...found.events)
  const out = option.outcome

  if (out.coins) s = { ...s, player: { ...s.player, coins: Math.max(0, s.player.coins + out.coins) } }
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
    const step = cullGroup(s, out.spareCount, spareIds, rng)
    s = step.state
    events.push(...step.events)
  }
  if (out.fight) {
    const enemy = content.enemies.find((e) => e.id === out.fight)!
    const fight = startFight(s, combatantFromEnemy(enemy, 1 + Math.floor(def.number / 3)), 'scenario', { enemyId: enemy.id })
    return withReactions({ state: fight.state, events: [...events, ...fight.events] }, rng, content)
  }

  s = { ...s, phase: { ...s.phase, progress: 1 } as GameState['phase'] }
  const clock = checkScenarioClock(s, rng, content)
  return withReactions({ state: clock.state, events: [...events, ...clock.events] }, rng, content)
}

/**
 * "Only some of you walk out". If the player knows at least spareCount living
 * survivors, they pick who is spared and every other survivor they know dies.
 * Otherwise everyone they know is spared, a group forms around them with
 * strangers, and the strangers who like the player most fill the remaining places.
 */
function cullGroup(state: GameState, spareCount: number, spareIds: string[], rng: Rng): Step {
  const known = livingMet(state)
  let group: Survivor[]
  let spared: Survivor[]
  if (known.length >= spareCount) {
    const picked = new Set(spareIds)
    group = known
    spared = known.filter((v) => picked.has(v.id)).slice(0, spareCount)
  } else {
    const strangers = living(state).filter((v) => !v.met)
    group = [...known]
    while (group.length < spareCount + 2 && strangers.length > 0) {
      group.push(strangers.splice(rng.int(0, strangers.length - 1), 1)[0])
    }
    const byAttitude = group.filter((v) => !v.met).sort((a, b) => b.attitude - a.attitude)
    spared = [...known, ...byAttitude.slice(0, spareCount - known.length)]
  }
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
