import { sellPrice } from '../../engine/inventory'
import type { GameState } from '../../engine/types'
import { useContent, type PlayerAction } from '../useGame'

export function ShopPanel({ state, act }: { state: GameState; act: (a: PlayerAction) => void }) {
  const content = useContent()
  const wares = content.items.filter((i) => i.inShop)
  const busy = !!state.fight
  return (
    <section className="panel" data-tab-panel="status" aria-labelledby="shop-title">
      <h2 id="shop-title">System shop</h2>
      <div className="panel-body">
        <ul className="rows">
          {wares.map((i) => (
            <li key={i.id}>
              <span>
                {i.name} <span className="muted small">{i.kind}</span>
              </span>
              <button
                className="btn small"
                aria-label={`Buy ${i.name} for ${i.price}`}
                disabled={busy || state.player.coins < i.price}
                onClick={() => act({ kind: 'shop', mode: 'buy', itemId: i.id })}
              >
                ◈ {i.price}
              </button>
            </li>
          ))}
        </ul>
        {state.player.inventory.length > 0 && (
          <>
            <p className="mono small muted">Sell</p>
            <ul className="rows">
              {state.player.inventory.map((stack) => {
                const def = content.items.find((i) => i.id === stack.itemId)
                if (!def) return null
                return (
                  <li key={stack.itemId}>
                    <span>
                      {def.name} ×{stack.qty}
                    </span>
                    <button
                      className="btn small"
                      aria-label={`Sell ${def.name} for ${sellPrice(def)}`}
                      disabled={busy}
                      onClick={() => act({ kind: 'shop', mode: 'sell', itemId: def.id })}
                    >
                      +{sellPrice(def)}
                    </button>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>
    </section>
  )
}
