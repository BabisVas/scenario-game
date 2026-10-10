import { rankingRows } from '../../engine/ranking'
import type { GameState } from '../../engine/types'

export function RankingPanel({ state }: { state: GameState }) {
  const rows = rankingRows(state)
  if (rows.length === 0) return null
  const living = rows.filter((r) => r.alive).length
  return (
    <section className="panel" data-tab-panel="ranking" aria-labelledby="ranking-title">
      <h2 id="ranking-title">
        Ranking <span className="muted">{living} alive</span>
      </h2>
      <table className="ranking">
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.name}-${i}`} className={r.isPlayer ? 'you' : undefined}>
              <td className="mono muted">{i + 1}</td>
              <td>{r.alive ? <span>{r.name}</span> : <s>{r.name}</s>}</td>
              <td className="mono">{r.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
