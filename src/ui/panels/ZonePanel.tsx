import { useState } from 'react'
import type { ActionId } from '../../data/schema'
import { ACTION_COST, canAct, type CanAct } from '../../engine/actions'
import { attributeDef } from '../../engine/attributes'
import { sellPrice } from '../../engine/inventory'
import { survivorsInZone, tradePrice } from '../../engine/survivors'
import type { GameState, Survivor } from '../../engine/types'
import { attitudeWord } from '../format'
import { useContent, type PlayerAction } from '../useGame'

const ACTION_LABEL: Record<ActionId, string> = {
  scavenge: 'Scavenge',
  explore: 'Explore',
  train: 'Train',
  trade: 'Trade',
  rest: 'Rest',
  talk: 'Talk',
  hunt: 'Hunt',
}

const WHY: Record<Exclude<CanAct, { ok: true }>['reason'], string> = {
  energy: 'Not enough energy',
  sealed: 'Zone sealed',
  'not-here': 'Not here',
  away: 'You are not here',
  busy: 'Busy',
  dead: 'Dead',
}

export function ZonePanel({ state, zoneId, act }: { state: GameState; zoneId: string; act: (a: PlayerAction) => void }) {
  const content = useContent()
  const zone = content.zones.find((z) => z.id === zoneId)
  if (!zone) return null
  const people = survivorsInZone(state, zone.id)
  const met = people.filter((v) => v.met)
  const strangers = people.length - met.length
  const busy = !!state.fight || !!state.pendingChoice

  return (
    <section className="panel" data-tab-panel="map" aria-label={`Zone: ${zone.name}`}>
      <h2>{zone.name}</h2>
      <div className="panel-body">
        <p className="muted small">{zone.blurb}</p>
        <div className="actions">
          {zone.actions.map((a) => {
            const check = canAct(state, zone.id, a, content)
            const cost = ACTION_COST[a]
            return (
              <button
                key={a}
                className="btn action"
                disabled={!check.ok}
                onClick={() => act({ kind: 'zone', zoneId: zone.id, action: a })}
              >
                <span>{ACTION_LABEL[a]}</span>
                <span className="cost">
                  {cost.energy} energy · {cost.hours}h
                </span>
                {!check.ok && <span className="why">{WHY[check.reason]}</span>}
              </button>
            )
          })}
        </div>
        {people.length > 0 && (
          <ul className="people" aria-label="People here">
            {met.map((v) => (
              <Person key={v.id} survivor={v} state={state} busy={busy} act={act} />
            ))}
            {strangers > 0 && (
              <li className="muted">{strangers === 1 ? 'Someone you have not met.' : `Someone… ${strangers} people you have not met.`}</li>
            )}
          </ul>
        )}
      </div>
    </section>
  )
}

function Person({ survivor: v, state, busy, act }: { survivor: Survivor; state: GameState; busy: boolean; act: (a: PlayerAction) => void }) {
  const content = useContent()
  const [trading, setTrading] = useState(false)
  const attribute = attributeDef(content, v.attributeId)
  const canTrade = v.attitude > -50
  const wares = content.items.filter((i) => i.kind !== 'rare')

  return (
    <li>
      <div className="person-row">
        <span>
          {v.name} <span className="attitude">{attitudeWord(v.attitude)}</span>
          {attribute && <span className={'rarity rarity-' + attribute.rarity} title={attribute.blurb}>{attribute.name}</span>}
        </span>
        <span className="buttons">
          {canTrade && (
            <button className="btn small" aria-label={`Trade with ${v.name}`} aria-expanded={trading} disabled={busy} onClick={() => setTrading(!trading)}>
              Trade
            </button>
          )}
          <button className="btn small danger" aria-label={`Attack ${v.name}`} disabled={busy} onClick={() => act({ kind: 'attack', survivorId: v.id })}>
            Attack
          </button>
        </span>
      </div>
      {trading && canTrade && (
        <div className="trade-list">
          {wares.map((i) => {
            const price = tradePrice(i.price, v.attitude)
            return (
              <div className="row" key={`buy-${i.id}`}>
                <span>{i.name}</span>
                <button
                  className="btn small"
                  aria-label={`Buy ${i.name} from ${v.name} for ${price}`}
                  disabled={busy || state.player.coins < price}
                  onClick={() => act({ kind: 'trade', survivorId: v.id, itemId: i.id, mode: 'buy' })}
                >
                  Buy {price}
                </button>
                <button
                  className="btn small danger"
                  aria-label={`Rob ${v.name} of ${i.name}`}
                  disabled={busy}
                  onClick={() => act({ kind: 'trade', survivorId: v.id, itemId: i.id, mode: 'rob' })}
                >
                  Rob
                </button>
              </div>
            )
          })}
          {state.player.inventory.map((stack) => {
            const def = content.items.find((i) => i.id === stack.itemId)
            if (!def) return null
            return (
              <div className="row" key={`sell-${def.id}`}>
                <span>
                  {def.name} ×{stack.qty}
                </span>
                <button
                  className="btn small"
                  aria-label={`Sell ${def.name} to ${v.name} for ${sellPrice(def)}`}
                  disabled={busy}
                  onClick={() => act({ kind: 'trade', survivorId: v.id, itemId: def.id, mode: 'sell' })}
                >
                  Sell {sellPrice(def)}
                </button>
                <button
                  className="btn small danger"
                  aria-label={`Overcharge ${v.name} for ${def.name} at ${def.price}`}
                  disabled={busy}
                  onClick={() => act({ kind: 'trade', survivorId: v.id, itemId: def.id, mode: 'overcharge' })}
                >
                  Overcharge {def.price}
                </button>
                <button
                  className="btn small"
                  aria-label={`Give ${def.name} to ${v.name}`}
                  disabled={busy}
                  onClick={() => act({ kind: 'give', survivorId: v.id, itemId: def.id })}
                >
                  Give
                </button>
              </div>
            )
          })}
        </div>
      )}
    </li>
  )
}
