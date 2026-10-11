import { isUsable } from '../../engine/inventory'
import type { GameState } from '../../engine/types'
import { useContent, type PlayerAction } from '../useGame'

export function InventoryPanel({ state, act }: { state: GameState; act: (a: PlayerAction) => void }) {
  const content = useContent()
  const { inventory, equipped } = state.player
  return (
    <section className="panel" data-tab-panel="status" aria-labelledby="inventory-title">
      <h2 id="inventory-title">Inventory</h2>
      <div className="panel-body">
        {inventory.length === 0 ? (
          <p className="muted small">Empty pockets.</p>
        ) : (
          <ul className="rows">
            {inventory.map((stack) => {
              const def = content.items.find((i) => i.id === stack.itemId)
              if (!def) return null
              const gear = def.kind === 'weapon' || def.kind === 'armor'
              const worn = equipped.weapon === def.id || equipped.armor === def.id
              return (
                <li key={def.id}>
                  <span>
                    {def.name} ×{stack.qty}{' '}
                    <span className="muted small">
                      {def.kind}
                      {def.power ? ` +${def.power}` : ''}
                      {def.effect?.heal ? ` heals ${def.effect.heal}` : ''}
                      {def.effect?.damage ? ` deals ${def.effect.damage}` : ''}
                    </span>
                  </span>
                  {gear &&
                    (worn ? (
                      <span className="mono small equipped">equipped</span>
                    ) : (
                      <button className="btn small" aria-label={`Equip ${def.name}`} onClick={() => act({ kind: 'equip', itemId: def.id })}>
                        Equip
                      </button>
                    ))}
                  {isUsable(def) && def.effect?.heal ? (
                    <button className="btn small" aria-label={`Use ${def.name}`} onClick={() => act({ kind: 'useItem', itemId: def.id })}>
                      Use
                    </button>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
