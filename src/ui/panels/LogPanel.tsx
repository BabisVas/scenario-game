import type { GameState } from '../../engine/types'
import { clockText, LOG_LABEL } from '../format'

export function LogPanel({ state }: { state: GameState }) {
  const entries = [...state.log].reverse()
  return (
    <section className="panel" data-tab-panel="log" aria-labelledby="log-title">
      <h2 id="log-title">Log</h2>
      <ol className="log">
        {entries.map((e) => (
          <li key={e.id} className={`kind-${e.kind}`}>
            <span className="tag">{LOG_LABEL[e.kind]}</span>
            <span>
              <span className="text">{e.text}</span>
              <span className="when">{clockText(e.inGameHour)}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}
