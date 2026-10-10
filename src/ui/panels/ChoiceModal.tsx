import { useState } from 'react'
import type { ChoiceOption, ScenarioDef } from '../../data/schema'
import type { GameState, Survivor } from '../../engine/types'
import { useContent, type PlayerAction } from '../useGame'

export function ChoiceModal({ state, act }: { state: GameState; act: (a: PlayerAction) => void }) {
  const content = useContent()
  const pending = state.pendingChoice
  if (!pending) return null

  if (pending.source === 'contract') {
    const def = content.constellations.find((c) => c.id === pending.constellationId)
    if (!def) return null
    const gift = content.skills.find((k) => k.id === def.contract.giftSkillId)
    return (
      <div className="overlay">
        <section className="panel modal star" role="dialog" aria-modal="true" aria-labelledby="contract-title">
          <h2 id="contract-title">Contract offer</h2>
          <div className="panel-body">
            <p className="mono">The constellation «{def.title}»</p>
            <p className="muted small">{def.blurb}</p>
            <p>"{def.lines.contract[0]}"</p>
            <ul className="list small">
              <li>
                Demand: show <strong>{def.contract.demandTag}</strong> in every scenario.
              </li>
              <li>Gift: the skill {gift?.name ?? def.contract.giftSkillId}.</li>
              <li>Pay: {def.contract.coinsPerScenario} coins for each scenario where you keep your word.</li>
              <li>Break it, and it will remember.</li>
            </ul>
          </div>
          <footer>
            <button className="btn" onClick={() => act({ kind: 'contract', accept: false })}>
              Decline
            </button>
            <button className="btn star" onClick={() => act({ kind: 'contract', accept: true })}>
              Accept
            </button>
          </footer>
        </section>
      </div>
    )
  }

  const def = content.scenarios.find((d) => d.id === pending.scenarioId)
  if (!def || def.goal.kind !== 'choice') return null
  return <ScenarioChoice def={def} options={def.goal.options} prompt={def.goal.prompt} state={state} act={act} />
}

function ScenarioChoice({
  def,
  options,
  prompt,
  state,
  act,
}: {
  def: ScenarioDef
  options: ChoiceOption[]
  prompt: string
  state: GameState
  act: (a: PlayerAction) => void
}) {
  const metAlive = state.survivors.filter((v) => v.alive && v.met)
  return (
    <div className="overlay">
      <section className="panel modal" role="dialog" aria-modal="true" aria-label="Scenario choice">
        <h2>Choice</h2>
        <div className="panel-body">
          <p className="mono small muted">Main Scenario {def.number} · {def.title}</p>
          <p>{prompt}</p>
          <div className="options">
            {options.map((o) =>
              o.outcome.spareCount !== undefined ? (
                <SpareOption key={o.id} option={o} spareCount={o.outcome.spareCount} people={metAlive} act={act} />
              ) : o.target === 'met-survivor' ? (
                metAlive.length > 0 ? <TargetOption key={o.id} option={o} people={metAlive} act={act} /> : null
              ) : (
                <button key={o.id} className="btn" onClick={() => act({ kind: 'choice', optionId: o.id, targetSurvivorId: null })}>
                  {o.label}
                </button>
              ),
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

function TargetOption({ option, people, act }: { option: ChoiceOption; people: Survivor[]; act: (a: PlayerAction) => void }) {
  const [target, setTarget] = useState(people[0].id)
  return (
    <div className="option">
      <select aria-label={`Who: ${option.label}`} value={target} onChange={(e) => setTarget(e.target.value)}>
        {people.map((v) => (
          <option key={v.id} value={v.id}>
            {v.name}
          </option>
        ))}
      </select>
      <button className="btn danger" onClick={() => act({ kind: 'choice', optionId: option.id, targetSurvivorId: target })}>
        {option.label}
      </button>
    </div>
  )
}

function SpareOption({
  option,
  spareCount,
  people,
  act,
}: {
  option: ChoiceOption
  spareCount: number
  people: Survivor[]
  act: (a: PlayerAction) => void
}) {
  const [picked, setPicked] = useState<string[]>([])
  const choose = () => act({ kind: 'choice', optionId: option.id, targetSurvivorId: null, spareIds: picked })
  if (people.length < spareCount) {
    return (
      <div className="option">
        <p className="small muted">
          {people.length === 0
            ? 'You do not know anyone here. The system will choose for you.'
            : `You know only ${people.length}. All of them will be spared.`}
        </p>
        <button className="btn" onClick={choose}>
          {option.label}
        </button>
      </div>
    )
  }
  const full = picked.length >= spareCount
  return (
    <fieldset className="option spare">
      <legend className="small">
        Spare up to {spareCount}. Everyone you know who is not chosen dies.
      </legend>
      {people.map((v) => {
        const on = picked.includes(v.id)
        return (
          <label key={v.id} className="check">
            <input
              type="checkbox"
              checked={on}
              disabled={!on && full}
              onChange={() => setPicked(on ? picked.filter((id) => id !== v.id) : [...picked, v.id])}
            />
            {v.name}
          </label>
        )
      })}
      <button className="btn danger" onClick={choose}>
        {option.label}
      </button>
    </fieldset>
  )
}
