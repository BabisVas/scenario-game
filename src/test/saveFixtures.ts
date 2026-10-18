// Saved games for the save-migration tests. Test-only.

import { content } from '../data'
import { combatantFromEnemy } from '../engine/actions'
import { newGame } from '../engine/newGame'
import { createRng } from '../engine/rng'
import type { GameState } from '../engine/types'
import { runAction, type PlayerAction } from '../ui/useGame'
import { appendEvents } from '../engine/log'

/**
 * A state with every optional part of the save filled in (a fight, a stigma, a
 * ward and a group, hidden and sub-scenarios, a pending choice, a digest), so its
 * shape covers the whole save format.
 */
export function richState(): GameState {
  const s = newGame({ name: 'Ari', backgroundId: 'courier', seed: 3, now: 0 }, content)
  const c = content.constellations[0]
  const enemy = content.enemies[0]
  const survivors = s.survivors.map((v, i) => (i === 0 ? { ...v, alive: false, deathNote: 'Fell.', partyId: 'p-1' } : v))
  return {
    ...s,
    player: {
      ...s.player,
      skills: [{ skillId: content.skills[0].id, level: 1, uses: 0 }],
      stigma: { stigmaId: c.contract.stigmaId, constellationId: c.id, level: 1, uses: 0, sealed: false },
    },
    phase: {
      kind: 'scenario', scenarioId: content.scenarios[0].id, hoursLeft: 5, progress: 0, killsAtStart: 0,
      protectedSurvivorId: survivors[1].id, wardWounds: 3, finalWaveBeaten: false, groupIds: [survivors[2].id],
    },
    fight: {
      enemy: combatantFromEnemy(enemy, 1), enemyId: enemy.id, survivorId: survivors[3].id, round: 2,
      cooldowns: { [content.skills[0].id]: 1 }, damageTaken: 3, loot: content.items[0].id, origin: 'hunt',
    },
    survivors,
    clearedScenarioIds: [content.scenarios[0].id],
    subScenario: { defId: content.subScenarios[0].id, hoursLeft: 3, progress: 1 },
    hiddenScenario: { defId: content.hiddenScenarios[0].id, hoursLeft: 3, progress: 1 },
    foundHiddenIds: [content.hiddenScenarios[0].id],
    actionCounts: { [`${s.zoneId}/rest`]: 2 },
    pendingChoice: { source: 'scenario', scenarioId: content.scenarios[0].id },
    digest: [{ id: 1, kind: 'system', text: 'x', inGameHour: 0 }],
  }
}

/** A real game played by the current engine: the saved game a release leaves behind. */
export function playedGame(): GameState {
  let s = newGame({ name: 'Ari', backgroundId: 'line-cook', seed: 2026, now: Date.UTC(2026, 9, 18) }, content)
  const rng = createRng(s.rngState)
  const act = (a: PlayerAction) => {
    const step = runAction(s, a, rng, content)
    s = { ...appendEvents(step.state, step.events), rngState: rng.getState() }
  }
  const fightOut = () => {
    for (let i = 0; i < 40 && s.fight; i++) act({ kind: 'fight', turn: { kind: 'attack' } })
  }
  const plan: PlayerAction[] = [
    { kind: 'zone', zoneId: 'old-market', action: 'talk' },
    { kind: 'zone', zoneId: 'old-market', action: 'hunt' },
    { kind: 'zone', zoneId: 'old-market', action: 'scavenge' },
    { kind: 'buySkill', skillId: 'quick-strike' },
    { kind: 'zone', zoneId: 'old-market', action: 'rest' },
    { kind: 'travel', zoneId: 'riverside-park' },
    { kind: 'zone', zoneId: 'riverside-park', action: 'hunt' },
    { kind: 'zone', zoneId: 'riverside-park', action: 'rest' },
  ]
  for (const a of plan) {
    if (s.phase.kind === 'dead') break
    act(a)
    fightOut()
  }
  return s
}
