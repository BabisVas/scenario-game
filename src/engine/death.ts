// One life per game. Deleting the save is the store's job; this only ends the run.

import type { Content } from '../data/schema'
import type { Rng } from './rng'
import type { GameEvent, GameState, Step } from './types'

/** Constellation farewells. Task 10 fills this in. */
function deathReactions(_state: GameState, _rng: Rng, _content: Content): GameEvent[] {
  return []
}

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
