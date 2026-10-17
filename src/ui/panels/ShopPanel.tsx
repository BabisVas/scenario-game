import { withCarriedBonus } from '../../engine/attributes'
import { sellPrice } from '../../engine/inventory'
import type { GameState } from '../../engine/types'
import { useContent, type PlayerAction } from '../useGame'

export function ShopPanel({ state, act }: { state: GameState; act: (a: PlayerAction) => void }) {
  const content = useContent()
  const wares = content.items.filter((i) => i.inShop)
  const lessons = content.skills.filter((k) => k.price !== undefined && !state.player.skills.some((x) => x.skillId === k.id))
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
        {lessons.length > 0 && (
          <>
            <p className="mono small muted">Skills</p>
            <ul className="rows">
              {lessons.map((k) => (
                <li key={k.id}>
                  <span>
                    {k.name} <span className="muted small">{k.kind}</span>
                  </span>
                  <button
                    className="btn small"
                    aria-label={`Learn ${k.name} for ${k.price}`}
                    disabled={busy || state.player.coins < k.price!}
                    onClick={() => act({ kind: 'buySkill', skillId: k.id })}
                  >
                    ◈ {k.price}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
        {state.player.inventory.length > 0 && (
          <>
            <p className="mono small muted">Sell</p>
            <ul className="rows">
              {state.player.inventory.map((stack) => {
                const def = content.items.find((i) => i.id === stack.itemId)
                if (!def) return null
                const price = withCarriedBonus(state, content, sellPrice(def))
                return (
                  <li key={stack.itemId}>
                    <span>
                      {def.name} ×{stack.qty}
                    </span>
                    <button
                      className="btn small"
                      aria-label={`Sell ${def.name} for ${price}`}
                      disabled={busy}
                      onClick={() => act({ kind: 'shop', mode: 'sell', itemId: def.id })}
                    >
                      +{price}
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
