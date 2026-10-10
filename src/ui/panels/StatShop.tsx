import { statCost } from '../../engine/growth'
import type { GameState, StatKey } from '../../engine/types'
import type { PlayerAction } from '../useGame'

const STATS: { key: StatKey; label: string }[] = [
  { key: 'strength', label: 'Strength' },
  { key: 'agility', label: 'Agility' },
  { key: 'endurance', label: 'Endurance' },
  { key: 'spirit', label: 'Spirit' },
]

export function StatShop({ state, act }: { state: GameState; act: (a: PlayerAction) => void }) {
  return (
    <section className="panel" data-tab-panel="status" aria-labelledby="stat-shop-title">
      <h2 id="stat-shop-title">Grow</h2>
      <div className="panel-body">
        <ul className="rows">
          {STATS.map((s) => {
            const value = state.player.stats[s.key]
            const cost = statCost(value)
            return (
              <li key={s.key}>
                <span>
                  {s.label} <span className="muted small">{value} → {value + 1}</span>
                </span>
                <button
                  className="btn small"
                  aria-label={`Raise ${s.label} for ${cost}`}
                  disabled={!!state.fight || state.player.coins < cost}
                  onClick={() => act({ kind: 'buyStat', stat: s.key })}
                >
                  ◈ {cost}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
