// The ranking board: opened by the system after the first cleared scenario.

import type { GameState } from './types'

export type RankingRow = { name: string; points: number; alive: boolean; isPlayer: boolean }

export function rankingRows(state: GameState): RankingRow[] {
  if (!state.rankingOpen) return []
  const rows: RankingRow[] = [
    { name: state.player.name, points: state.player.points, alive: state.phase.kind !== 'dead', isPlayer: true },
    ...state.survivors.map((v) => ({ name: v.name, points: v.points, alive: v.alive, isPlayer: false })),
  ]
  const byPoints = (a: RankingRow, b: RankingRow) => b.points - a.points
  return [...rows.filter((r) => r.alive).sort(byPoints), ...rows.filter((r) => !r.alive).sort(byPoints)]
}
