import { SYSTEM } from '../../data/names'
import { zoneRef } from '../../engine/places'
import type { GameState } from '../../engine/types'
import { goalText, hiddenGoalText, hoursText, subGoalText } from '../format'
import { useContent } from '../useGame'

export function ScenarioPanel({ state }: { state: GameState }) {
  const content = useContent()
  const phase = state.phase
  const sub = state.subScenario
  const subDef = sub ? content.subScenarios.find((d) => d.id === sub.defId) : undefined
  const hidden = state.hiddenScenario
  const hiddenDef = hidden ? content.hiddenScenarios.find((d) => d.id === hidden.defId) : undefined

  let body
  if (phase.kind === 'scenario') {
    const def = content.scenarios.find((d) => d.id === phase.scenarioId)
    body = def ? (
      <>
        <p className="mono small muted">Main Scenario {def.number}</p>
        <h3 className="scenario-title">{def.title}</h3>
        <p>{goalText(def, state, content)}</p>
        {phase.protectedSurvivorId && <WardLine state={state} />}
        <p className="clock">{`${hoursText(Math.max(0, phase.hoursLeft))} left`}</p>
        <p className="twist">{def.twist}</p>
        {def.rules.length > 0 && (
          <ul className="rules">
            {def.rules.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        )}
      </>
    ) : (
      <p className="muted">The scenario has gone quiet.</p>
    )
  } else if (phase.kind === 'rest') {
    const next = phase.nextScenarioId ? content.scenarios.find((d) => d.id === phase.nextScenarioId) : undefined
    body = (
      <>
        <h3 className="scenario-title">Rest period</h3>
        <p className="clock calm">{`Next scenario in ${hoursText(Math.max(0, phase.hoursLeft))}`}</p>
        {next ? (
          <>
            <p>
              Coming up: <strong>{next.title}</strong>
            </p>
            <p className="twist">{next.twist}</p>
          </>
        ) : (
          <p className="muted">{SYSTEM} is preparing the next scenario.</p>
        )}
      </>
    )
  } else {
    body = <p>{phase.cause}</p>
  }

  return (
    <section className="panel" data-tab-panel="scenario" aria-labelledby="scenario-title">
      <h2 id="scenario-title">Scenario</h2>
      <div className="panel-body">
        {body}
        {hidden && hiddenDef && (
          <div className="sub hidden-scenario">
            <p className="mono small">Hidden scenario · {hiddenDef.title}</p>
            <p className="small">
              {hiddenGoalText(hiddenDef, hidden.progress, content)} · {Math.max(0, hidden.hoursLeft)}h remaining · reward {hiddenDef.rewards.coins} coins
            </p>
          </div>
        )}
        {sub && subDef && (
          <div className="sub">
            <p className="mono small">Sub-scenario · {subDef.title}</p>
            <p className="small">
              {subGoalText(subDef, sub.progress, content)} · {Math.max(0, sub.hoursLeft)}h remaining · reward {subDef.rewards.coins} coins
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

function WardLine({ state }: { state: GameState }) {
  const content = useContent()
  if (state.phase.kind !== 'scenario') return null
  const id = state.phase.protectedSurvivorId
  const ward = state.survivors.find((v) => v.id === id)
  if (!ward) return null
  const zone = zoneRef(content, ward.zoneId)
  const wounds = state.phase.wardWounds ?? 0
  return <p className="small ward">{`${ward.name} waits in ${zone} · ${wounds} ${wounds === 1 ? 'wound' : 'wounds'} left`}</p>
}
