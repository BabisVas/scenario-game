// Real time. Energy refills and the world moves while the tab is closed;
// nothing here may hurt the player or spend scenario hours.

import {
  CATCHUP_CAP_MS,
  DIGEST_MAX_ENTRIES,
  ENERGY_MAX,
  ENERGY_REGEN_MS_PER_POINT,
  WORLD_TICK_MS,
  WORLD_TICKS_MAX_PER_CATCHUP,
} from './config'
import { DIGEST_LINE_LOSSES, DIGEST_LINE_QUIET } from '../data/screens'
import type { Rng } from './rng'
import type { GameEvent, GameState, LogEntry, Step } from './types'

export function refillEnergy(state: GameState, now: number): GameState {
  const elapsed = now - state.energyUpdatedAt
  if (elapsed < 0) return { ...state, energyUpdatedAt: now }
  const points = Math.floor(elapsed / ENERGY_REGEN_MS_PER_POINT)
  if (state.energy + points >= ENERGY_MAX) {
    // A full tank does not bank time: the next refill starts counting from now.
    return { ...state, energy: Math.max(state.energy, ENERGY_MAX), energyUpdatedAt: now }
  }
  return {
    ...state,
    energy: state.energy + points,
    energyUpdatedAt: state.energyUpdatedAt + points * ENERGY_REGEN_MS_PER_POINT,
  }
}

export function msUntilNextEnergy(state: GameState, now: number): number {
  if (state.energy >= ENERGY_MAX) return 0
  const elapsed = Math.max(0, now - state.energyUpdatedAt)
  return ENERGY_REGEN_MS_PER_POINT - (elapsed % ENERGY_REGEN_MS_PER_POINT)
}

export function catchUp(
  state: GameState,
  now: number,
  rng: Rng,
  tick: (s: GameState, rng: Rng) => Step,
): Step {
  const elapsed = Math.max(0, now - state.worldTickAt)
  const ticks = Math.min(Math.floor(Math.min(elapsed, CATCHUP_CAP_MS) / WORLD_TICK_MS), WORLD_TICKS_MAX_PER_CATCHUP)

  let s = refillEnergy(state, now)
  const events: GameEvent[] = []
  for (let i = 0; i < ticks; i++) {
    const step = tick(s, rng)
    s = step.state
    events.push(...step.events)
  }

  // Whatever a tick did, time away never touches the player or the scenario clock.
  s = { ...s, player: state.player, phase: state.phase, inGameHour: state.inGameHour, worldTickAt: now, lastSeenAt: now }
  if (events.length > 0) {
    // The opening line is a system message, so it must be true: losses only if someone died.
    const living = (x: GameState) => x.survivors.filter((v) => v.alive).length
    const opening = living(s) < living(state) ? DIGEST_LINE_LOSSES : DIGEST_LINE_QUIET
    const news: LogEntry[] = events
      .slice(-DIGEST_MAX_ENTRIES)
      .map((e, i) => ({ id: i + 2, kind: 'digest', text: e.text, inGameHour: state.inGameHour }))
    s = { ...s, digest: [{ id: 1, kind: 'system', text: opening, inGameHour: state.inGameHour }, ...news] }
  }
  return { state: s, events }
}

