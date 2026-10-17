import { useState } from 'react'
import { heals, isUsable } from '../../engine/inventory'
import type { GameState, StatKey } from '../../engine/types'
import { itemEffectText } from '../format'
import { useContent, type PlayerAction } from '../useGame'

const STATS: { key: StatKey; label: string }[] = [
  { key: 'strength', label: 'Strength' },
  { key: 'agility', label: 'Agility' },
  { key: 'endurance', label: 'Endurance' },
  { key: 'spirit', label: 'Spirit' },
]

export function InventoryPanel({ state, act }: { state: GameState; act: (a: PlayerAction) => void }) {
  const content = useContent()
  const [choosingFor, setChoosingFor] = useState<string | null>(null)
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
              const statRelic = isUsable(def) && !!def.effect?.statPoint
              return (
                <li key={def.id} className={choosingFor === def.id ? 'wrap' : undefined}>
                  <span>
                    {def.name} ×{stack.qty}{' '}
                    <span className="muted small">
                      {def.kind}
                      {def.power ? ` +${def.power}` : ''}
                      {itemEffectText(def)}
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
                  {isUsable(def) && heals(def) ? (
                    <button className="btn small" aria-label={`Use ${def.name}`} onClick={() => act({ kind: 'useItem', itemId: def.id })}>
                      Use
                    </button>
                  ) : null}
                  {statRelic && choosingFor !== def.id ? (
                    <button className="btn small" aria-label={`Use ${def.name}`} onClick={() => setChoosingFor(def.id)}>
                      Use
                    </button>
                  ) : null}
                  {statRelic && choosingFor === def.id ? (
                    <span className="stat-pick" role="group" aria-label={`Which stat the ${def.name} raises`}>
                      {STATS.map((x) => (
                        <button
                          key={x.key}
                          className="btn small"
                          aria-label={`Raise ${x.label}`}
                          onClick={() => {
                            setChoosingFor(null)
                            act({ kind: 'useItem', itemId: def.id, stat: x.key })
                          }}
                        >
                          {x.label}
                        </button>
                      ))}
                      <button className="btn small" onClick={() => setChoosingFor(null)}>
                        Cancel
                      </button>
                    </span>
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
