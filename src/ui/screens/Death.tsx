import { DEATH_CLOSING } from '../../data/screens'
import type { GameState } from '../../engine/types'

export function Death({ state, onNewLife }: { state: GameState; onNewLife: () => void }) {
  const cause = state.phase.kind === 'dead' ? state.phase.cause : ''
  // The farewells are the constellation lines logged after the death notice.
  const deathAt = state.log.findLastIndex((e) => e.kind === 'system' && e.text.startsWith('You died'))
  const farewells = deathAt >= 0 ? state.log.slice(deathAt + 1).filter((e) => e.kind === 'constellation') : []
  const facts = [
    { label: 'Scenarios cleared', value: state.clearedScenarioIds.length },
    { label: 'Days survived', value: Math.floor(state.inGameHour / 24) },
    { label: 'Kills', value: state.player.kills },
    { label: 'Coins', value: state.player.coins },
  ]

  return (
    <main className="page">
      <section className="panel death" aria-labelledby="death-title">
        <h2 id="death-title">You died</h2>
        <div className="panel-body">
          <p className="mono muted small">{`[Survivor record closed: ${state.player.name}.]`}</p>
          <p className="cause mono">{`[Cause: ${cause}]`}</p>
          <div className="facts">
            {facts.map((f) => (
              <div key={f.label}>
                <span className="muted small">{f.label}</span>
                <strong>{f.value}</strong>
              </div>
            ))}
          </div>
          {farewells.length > 0 && (
            <ul className="farewells">
              {farewells.map((e) => (
                <li key={e.id}>{e.text}</li>
              ))}
            </ul>
          )}
          <p className="muted small">{DEATH_CLOSING}</p>
          <button className="btn primary" onClick={onNewLife}>
            Start a new life
          </button>
        </div>
      </section>
    </main>
  )
}
