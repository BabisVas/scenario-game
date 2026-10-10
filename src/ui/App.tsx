import { useState } from 'react'
import { NewGame } from './screens/NewGame'
import { Home } from './screens/Home'
import { TakenOver } from './screens/TakenOver'
import { Unreadable } from './screens/Unreadable'
import { useGame } from './useGame'

export function App() {
  const game = useGame()
  const [creating, setCreating] = useState(false)

  if (creating || game.status === 'no-save') {
    return (
      <NewGame
        onStart={(name, backgroundId) => {
          game.newGame(name, backgroundId)
          setCreating(false)
        }}
      />
    )
  }
  switch (game.status) {
    case 'loading':
      return <p className="page muted mono">Loading…</p>
    case 'unreadable':
      return <Unreadable onNewGame={() => setCreating(true)} />
    case 'taken-over':
      return <TakenOver />
    case 'dead':
      return (
        <main className="page">
          <section className="panel">
            <h2>You died</h2>
            <div className="panel-body">
              <p>{game.state?.phase.kind === 'dead' ? game.state.phase.cause : ''}</p>
              <button className="btn primary" onClick={() => setCreating(true)}>
                Start a new life
              </button>
            </div>
          </section>
        </main>
      )
    case 'playing':
      return game.state ? <Home game={game} state={game.state} /> : null
  }
}
