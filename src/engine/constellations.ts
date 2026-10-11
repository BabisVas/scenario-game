// Constellations: powerful watchers who react to how the player acts.

import type { ConstellationDef, Content } from '../data/schema'
import { CONTRACT_INTEREST, HOSTILE_INTEREST } from './config'
import type { Rng } from './rng'
import type { ConstellationState, GameEvent, GameState, Step, Tag } from './types'

const FRESH: ConstellationState = { interest: 0, contract: 'none', demandMetThisScenario: false }

const clamp = (n: number) => Math.max(-100, Math.min(100, n))

const say = (def: ConstellationDef, verb: string, line: string): GameEvent => ({
  kind: 'constellation',
  text: `The constellation «${def.title}» ${verb}: "${line}"`,
})

export function initConstellations(content: Content): Record<string, ConstellationState> {
  return Object.fromEntries(content.constellations.map((c) => [c.id, { ...FRESH }]))
}

const stateOf = (s: GameState, id: string) => s.constellations[id] ?? FRESH

export function reactTo(state: GameState, tags: Tag[], rng: Rng, content: Content): Step {
  if (tags.length === 0) return { state, events: [] }
  let s = state
  const events: GameEvent[] = []

  for (const def of content.constellations) {
    const cur = stateOf(s, def.id)
    const delta = tags.reduce((sum, tag) => sum + (def.likes[tag] ?? 0), 0)
    const next: ConstellationState = {
      ...cur,
      interest: clamp(cur.interest + delta),
      demandMetThisScenario:
        cur.demandMetThisScenario || (cur.contract === 'active' && tags.includes(def.contract.demandTag)),
    }

    if (Math.abs(delta) >= 3 && rng.chance(0.4)) {
      events.push(delta > 0 ? say(def, 'is delighted', rng.pick(def.lines.like)) : say(def, 'frowns', rng.pick(def.lines.dislike)))
    }
    if (delta > 0 && next.interest >= 20 && rng.chance(0.3)) {
      const coins = rng.int(5, 15) + Math.floor(next.interest / 10)
      s = { ...s, player: { ...s.player, coins: s.player.coins + coins } }
      events.push(say(def, `sponsors you ${coins} coins`, rng.pick(def.lines.sponsor)))
    }
    if (next.interest >= CONTRACT_INTEREST && next.contract === 'none' && !s.pendingChoice) {
      next.contract = 'offered'
      s = { ...s, pendingChoice: { source: 'contract', constellationId: def.id } }
      events.push(say(def, 'offers you a contract', rng.pick(def.lines.contract)))
    }
    if (cur.interest > HOSTILE_INTEREST && next.interest <= HOSTILE_INTEREST) {
      events.push(say(def, 'turns against you', rng.pick(def.lines.dislike)))
    }
    s = { ...s, constellations: { ...s.constellations, [def.id]: next } }
  }
  return { state: s, events }
}

/** Passes a step's event tags to every constellation. */
export function withReactions(step: Step, rng: Rng, content: Content): Step {
  const tags = step.events.flatMap((e) => e.tags ?? [])
  if (tags.length === 0) return step
  const r = reactTo(step.state, tags, rng, content)
  return { state: r.state, events: [...step.events, ...r.events] }
}

export function resolveContract(state: GameState, accept: boolean, content: Content): Step {
  const pending = state.pendingChoice
  if (pending?.source !== 'contract') return { state, events: [] }
  const def = content.constellations.find((c) => c.id === pending.constellationId)
  if (!def) return { state: { ...state, pendingChoice: null }, events: [] }
  const cur = stateOf(state, def.id)
  let s: GameState = { ...state, pendingChoice: null }

  if (!accept) {
    s = { ...s, constellations: { ...s.constellations, [def.id]: { ...cur, contract: 'declined', interest: clamp(cur.interest - 10) } } }
    return { state: s, events: [say(def, 'shrugs', 'Your loss.')] }
  }

  // One sponsor at a time: a new contract ends any other, and takes its stigma back.
  const events: GameEvent[] = []
  for (const old of content.constellations) {
    const o = stateOf(s, old.id)
    if (old.id === def.id || o.contract !== 'active') continue
    s = { ...s, constellations: { ...s.constellations, [old.id]: { ...o, contract: 'ended', demandMetThisScenario: false, interest: clamp(o.interest - 30) } } }
    events.push(say(old, 'takes back its stigma', old.lines.dislike[0]))
  }

  s = { ...s, constellations: { ...s.constellations, [def.id]: { ...cur, contract: 'active', demandMetThisScenario: false } } }
  const stigma = content.stigmas.find((x) => x.id === def.contract.stigmaId)
  s = { ...s, player: { ...s.player, stigma: { stigmaId: def.contract.stigmaId, constellationId: def.id, level: 1, uses: 0, sealed: false } } }
  const name = stigma?.name ?? def.contract.stigmaId
  events.push(
    say(def, 'seals the contract', `Show me ${def.contract.demandTag} every scenario. Take ${name}.`),
    { kind: 'system', text: `Contract signed. Stigma granted: ${name}.` },
  )
  return { state: s, events }
}

/**
 * At each cleared scenario the sponsor judges the demand: kept, it pays and
 * lifts any seal; broken, it seals the stigma until a kept-demand clear.
 */
export function onScenarioCleared(state: GameState, content: Content): Step {
  let s = state
  const events: GameEvent[] = []
  for (const def of content.constellations) {
    const cur = stateOf(s, def.id)
    if (cur.contract !== 'active') continue
    const stigma = s.player.stigma?.constellationId === def.id ? s.player.stigma : null
    if (cur.demandMetThisScenario) {
      s = { ...s, player: { ...s.player, coins: s.player.coins + def.contract.coinsPerScenario } }
      s = { ...s, constellations: { ...s.constellations, [def.id]: { ...cur, demandMetThisScenario: false } } }
      events.push({ ...say(def, `pays ${def.contract.coinsPerScenario} coins as promised`, rng0(def.lines.sponsor)), tags: ['loyalty'] })
      if (stigma?.sealed) {
        s = { ...s, player: { ...s.player, stigma: { ...stigma, sealed: false } } }
        events.push({ kind: 'system', text: 'The seal on your stigma breaks. It answers you again.' })
      }
    } else {
      s = { ...s, constellations: { ...s.constellations, [def.id]: { ...cur, demandMetThisScenario: false, interest: clamp(cur.interest - 10) } } }
      events.push(say(def, 'seals your stigma', rng0(def.lines.dislike)))
      if (stigma && !stigma.sealed) s = { ...s, player: { ...s.player, stigma: { ...stigma, sealed: true } } }
    }
  }
  return { state: s, events }
}

/** The first line of a list: used where no rng is passed in. */
const rng0 = (lines: string[]) => lines[0]

export function deathReactions(state: GameState, rng: Rng, content: Content): GameEvent[] {
  return content.constellations
    .map((def) => ({ def, interest: stateOf(state, def.id).interest }))
    .filter((c) => Math.abs(c.interest) >= 20)
    .sort((a, b) => Math.abs(b.interest) - Math.abs(a.interest))
    .slice(0, 3)
    .map(({ def }) => say(def, 'watches you fall', rng.pick(def.lines.death)))
}
