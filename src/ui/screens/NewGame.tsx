import { useState } from 'react'
import { SYSTEM } from '../../data/names'
import { BACKGROUND_STAT_BONUS } from '../../engine/config'
import { useContent } from '../useGame'

const NAME_MAX = 20

export function NewGame({ onStart }: { onStart: (name: string, backgroundId: string) => void }) {
  const content = useContent()
  const [name, setName] = useState('')
  const [backgroundId, setBackgroundId] = useState<string | null>(null)
  const trimmed = name.trim()
  const ready = trimmed.length >= 1 && trimmed.length <= NAME_MAX && backgroundId !== null

  return (
    <main className="page">
      <section className="panel" aria-labelledby="new-game-title">
        <h2 id="new-game-title">New survivor</h2>
        <form
          className="panel-body"
          onSubmit={(e) => {
            e.preventDefault()
            if (ready) onStart(trimmed, backgroundId)
          }}
        >
          <p className="notice">{SYSTEM} notice</p>
          <p>
            Good morning. The city is about to change. Before it does, the system would like to know who you are.
          </p>
          <div className="field">
            <label htmlFor="survivor-name" className="mono small muted">
              Your name
            </label>
            <input
              id="survivor-name"
              value={name}
              maxLength={NAME_MAX}
              autoComplete="off"
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <p className="mono small muted">What did you do yesterday, when the world was normal?</p>
          <div className="cards">
            {content.backgrounds.map((b) => (
              <button
                key={b.id}
                type="button"
                className="card"
                aria-pressed={backgroundId === b.id}
                onClick={() => setBackgroundId(b.id)}
              >
                <strong>{b.name}</strong>
                <span className="bonus">
                  +{BACKGROUND_STAT_BONUS} {b.statBonus}
                </span>
                <span className="blurb">{b.blurb}</span>
              </button>
            ))}
          </div>
          <button type="submit" className="btn primary" disabled={!ready}>
            Start
          </button>
        </form>
      </section>
    </main>
  )
}
