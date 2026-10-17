// Hidden scenarios: found by unusual conditions, never listed before they are
// found, run beside the main scenario, and never cost the player their life.

import type { ActionId, Content, HiddenScenarioDef } from '../data/schema'
import { withCoinBonus } from './attributes'
import { addItem } from './inventory'
import type { Rng } from './rng'
import type { GameEvent, GameState, Step, Survivor } from './types'

const DISCOVERY_INTEREST = 15
const RUMOR_CHANCE = 0.1

export type HiddenContext = {
  zoneId?: string
  action?: ActionId
  /** Item ids held when the action began: what the player carried into the zone. */
  carried?: string[]
  choice?: { scenarioId: string; optionId: string }
}

export function countAction(state: GameState, zoneId: string, action: ActionId): GameState {
  const key = `${zoneId}/${action}`
  return { ...state, actionCounts: { ...state.actionCounts, [key]: (state.actionCounts[key] ?? 0) + 1 } }
}

function triggered(def: HiddenScenarioDef, state: GameState, ctx: HiddenContext, content: Content): boolean {
  const t = def.trigger
  switch (t.kind) {
    case 'repeat-action':
      return ctx.zoneId === t.zoneId && ctx.action === t.action && (state.actionCounts[`${t.zoneId}/${t.action}`] ?? 0) >= t.count
    case 'carry-item':
      return ctx.zoneId === t.zoneId && (ctx.carried ?? []).includes(t.itemId)
    case 'meet-survivor':
      return ctx.action === 'talk' && state.survivors.some((v) => v.timesMet >= t.count)
    case 'zone-during-scenario': {
      if (ctx.zoneId !== t.zoneId || state.phase.kind !== 'scenario') return false
      const id = state.phase.scenarioId
      return content.scenarios.find((d) => d.id === id)?.number === t.scenarioNumber
    }
    case 'choose-option':
      return ctx.choice?.scenarioId === t.scenarioId && ctx.choice.optionId === t.optionId
  }
}

/** A goal that needs a zone that is sealed right now cannot be played: its trigger waits. */
function goalZoneSealed(def: HiddenScenarioDef, state: GameState, content: Content): boolean {
  const g = def.goal
  const zoneId = g.kind === 'reach' || g.kind === 'survive' ? g.zoneId : undefined
  if (!zoneId) return false
  return state.zones[zoneId]?.sealed ?? !!content.zones.find((z) => z.id === zoneId)?.startsSealed
}

/**
 * Checks every undiscovered hidden scenario's trigger. At most one runs at a
 * time. One whose goal zone is sealed stays armed until the zone reopens.
 */
export function checkHiddenTriggers(state: GameState, ctx: HiddenContext, content: Content): Step {
  if (state.hiddenScenario || state.phase.kind === 'dead') return { state, events: [] }
  const def = content.hiddenScenarios.find(
    (d) => !state.foundHiddenIds.includes(d.id) && !goalZoneSealed(d, state, content) && triggered(d, state, ctx, content),
  )
  if (!def) return { state, events: [] }

  const constellations = { ...state.constellations }
  for (const c of content.constellations) {
    const cur = constellations[c.id] ?? { interest: 0, contract: 'none' as const, demandMetThisScenario: false }
    constellations[c.id] = { ...cur, interest: Math.min(100, cur.interest + DISCOVERY_INTEREST) }
  }
  return {
    state: {
      ...state,
      constellations,
      hiddenScenario: { defId: def.id, hoursLeft: def.hours, progress: 0 },
      foundHiddenIds: [...state.foundHiddenIds, def.id],
    },
    events: [
      { kind: 'system', text: `Hidden scenario discovered: ${def.title}! ${def.hours} hours. Every constellation is watching.`, tags: ['cunning'] },
      { kind: 'system', text: def.announcement },
    ],
  }
}

function goalMet(def: HiddenScenarioDef, progress: number, hoursLeft: number, zoneId: string): boolean {
  switch (def.goal.kind) {
    case 'kill':
      return progress >= def.goal.count
    case 'reach':
      return progress >= 1
    case 'survive':
      return hoursLeft <= 0 && (!def.goal.zoneId || def.goal.zoneId === zoneId)
  }
}

/**
 * Pays out a met goal, or ends a timed-out one with nothing lost but the reward.
 * A hidden survive goal never brings a Final Wave: failing a hidden scenario must
 * never put the player's life at risk, so its end is only ever a payout or nothing.
 */
export function judgeHidden(state: GameState, content: Content): Step {
  const active = state.hiddenScenario
  if (!active) return { state, events: [] }
  const def = content.hiddenScenarios.find((d) => d.id === active.defId)
  if (!def) return { state: { ...state, hiddenScenario: null }, events: [] }

  if (goalMet(def, active.progress, active.hoursLeft, state.zoneId)) {
    const coins = withCoinBonus(state, content, def.rewards.coins)
    let s: GameState = { ...state, hiddenScenario: null, player: { ...state.player, coins: state.player.coins + coins } }
    const loot = [`${coins} coins`]
    for (const itemId of def.rewards.itemIds ?? []) {
      s = addItem(s, itemId)
      loot.push(content.items.find((i) => i.id === itemId)?.name ?? itemId)
    }
    const skillId = def.rewards.skillId
    if (skillId && !s.player.skills.some((k) => k.skillId === skillId)) {
      s = { ...s, player: { ...s.player, skills: [...s.player.skills, { skillId, level: 1, uses: 0 }] } }
      loot.push(`skill ${content.skills.find((k) => k.id === skillId)?.name ?? skillId}`)
    }
    return { state: s, events: [{ kind: 'system', text: `Hidden scenario cleared: ${def.title}! Rewards: ${loot.join(', ')}.` }] }
  }
  if (active.hoursLeft <= 0) {
    return {
      state: { ...state, hiddenScenario: null },
      events: [{ kind: 'system', text: `Hidden scenario over: ${def.title}. The chance has passed. Nothing lost but the reward.` }],
    }
  }
  return { state, events: [] }
}

/** A survivor passing on a rumor about a hidden scenario nobody has found yet. */
export function hiddenRumor(state: GameState, rng: Rng, content: Content): GameEvent[] {
  if (!rng.chance(RUMOR_CHANCE)) return []
  const unfound = content.hiddenScenarios.filter((d) => !state.foundHiddenIds.includes(d.id) && state.hiddenScenario?.defId !== d.id)
  if (unfound.length === 0) return []
  const def = rng.pick(unfound)
  const living: Survivor[] = state.survivors.filter((v) => v.alive)
  const who = living.length > 0 ? rng.pick(living).name : 'Someone'
  return [{ kind: 'survivor', text: `${who} whispers a rumor: "${def.rumor}"` }]
}

/** The main scenario number whose time a hidden scenario's trigger is tied to, if any. */
function windowNumber(def: HiddenScenarioDef, content: Content): number | null {
  const t = def.trigger
  if (t.kind === 'zone-during-scenario') return t.scenarioNumber
  if (t.kind === 'choose-option') return content.scenarios.find((d) => d.id === t.scenarioId)?.number ?? null
  return null
}

/**
 * Rumors that must not be left to chance: when a scenario starts, survivors talk
 * about every undiscovered hidden scenario whose window is the next scenario
 * (or this one, when there is no scenario before it). A careful player always
 * hears about a window before it closes.
 */
export function windowRumors(state: GameState, started: { number: number }, content: Content): GameEvent[] {
  const numbers = content.scenarios.map((d) => d.number)
  const living = state.survivors.filter((v) => v.alive)
  const who = (living.find((v) => v.met) ?? living[0])?.name ?? 'Someone'
  return content.hiddenScenarios
    .filter((d) => !state.foundHiddenIds.includes(d.id) && state.hiddenScenario?.defId !== d.id)
    .filter((d) => {
      const n = windowNumber(d, content)
      if (n === null) return false
      const earlier = numbers.filter((x) => x < n)
      const opener = earlier.length > 0 ? Math.max(...earlier) : n
      return opener === started.number
    })
    .map((d) => ({ kind: 'survivor' as const, text: `${who} whispers a rumor: "${d.rumor}"` }))
}
