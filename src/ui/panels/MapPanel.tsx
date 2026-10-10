import { zoneDanger, zoneState } from '../../engine/actions'
import type { GameState } from '../../engine/types'
import { useContent } from '../useGame'

export function DangerPips({ danger }: { danger: number }) {
  const shown = Math.max(1, Math.min(5, danger))
  return (
    <span className="pips" aria-label={`danger ${danger}`}>
      {'●'.repeat(shown)}
      <span className="off">{'○'.repeat(5 - shown)}</span>
      {danger > 5 ? '+' : ''}
    </span>
  )
}

export function MapPanel({ state, selected, onSelect }: { state: GameState; selected: string; onSelect: (zoneId: string) => void }) {
  const content = useContent()
  return (
    <section className="panel" data-tab-panel="map" aria-labelledby="map-title">
      <h2 id="map-title">City map</h2>
      <ul className="zones">
        {content.zones.map((z) => {
          const sealed = zoneState(state, z).sealed
          return (
            <li key={z.id}>
              <button
                className={`zone-btn${sealed ? ' sealed' : ''}`}
                aria-pressed={selected === z.id}
                onClick={() => onSelect(z.id)}
              >
                <span>
                  {z.name}
                  {sealed && <span className="sealed-tag">Sealed</span>}
                </span>
                <DangerPips danger={zoneDanger(state, z)} />
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
