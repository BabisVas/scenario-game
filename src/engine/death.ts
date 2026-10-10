// One life per game. Deleting the save is the store's job; this only ends the run.

import type { Content } from '../data/schema'
import { deathReactions } from './constellations'
import type { Rng } from './rng'
import type { GameState, Step } from './types'

export function killPlayer(state: GameState, cause: string, content: Content, rng: Rng): Step {
  if (state.phase.kind === 'dead') return { state, events: [] }
  const dead: GameState = {
    ...state,
    phase: { kind: 'dead', cause },
    player: { ...state.player, hp: 0 },
    fight: null,
    pendingChoice: null,
    subScenario: null,
  }
  return {
    state: dead,
    events: [{ kind: 'system', text: `You died. ${cause}` }, ...deathReactions(state, rng, content)],
  }
}
