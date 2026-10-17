import { canTravel, TRAVEL_COST, zoneDanger, zoneState } from '../../engine/actions'
import type { GameState } from '../../engine/types'
import { useContent, type PlayerAction } from '../useGame'

export function DangerPips({ danger }: { danger: number }) {
  const shown = Math.max(1, Math.min(5, danger))
  return (
    <span className="pips" aria-label={`danger ${danger}`}>
      {'●'.repeat(shown)}
      <span className="off">{'○'.repeat(5 - shown)}</span>
      {danger > 5 ? `+${danger - 5}` : ''}
    </span>
  )
}

export function MapPanel({
  state,
  selected,
  onSelect,
  act,
}: {
  state: GameState
  selected: string
  onSelect: (zoneId: string) => void
  act: (a: PlayerAction) => void
}) {
  const content = useContent()
  const name = (id: string) => content.zones.find((z) => z.id === id)?.name ?? id
  return (
    <section className="panel" data-tab-panel="map" aria-labelledby="map-title">
      <h2 id="map-title">City map</h2>
      <ul className="zones">
        {content.zones.map((z) => {
          const sealed = zoneState(state, z).sealed
          const here = state.zoneId === z.id
          const move = canTravel(state, z.id, content)
          const nextDoor = !here && content.zones.find((x) => x.id === state.zoneId)?.connections.includes(z.id)
          return (
            <li key={z.id} className={here ? 'zone-here' : undefined}>
              <button
                className={`zone-btn${sealed ? ' sealed' : ''}`}
                aria-pressed={selected === z.id}
                onClick={() => onSelect(z.id)}
              >
                <span>
                  {z.name}
                  {here && <span className="here-tag">You are here</span>}
                  {sealed && <span className="sealed-tag">Sealed</span>}
                </span>
                <DangerPips danger={zoneDanger(state, z)} />
              </button>
              <div className="zone-links small muted">
                <span>Leads to {z.connections.map(name).join(', ')}</span>
                {nextDoor && (
                  <button
                    className="btn small"
                    aria-label={`Travel to ${z.name}`}
                    disabled={!move.ok}
                    onClick={() => act({ kind: 'travel', zoneId: z.id })}
                  >
                    Go · {TRAVEL_COST.energy} energy · {TRAVEL_COST.hours}h
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
