import { useState } from 'react'
import { Death } from './screens/Death'
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
      return game.state ? <Death state={game.state} onNewLife={() => setCreating(true)} /> : null
    case 'playing':
      return game.state ? <Home game={game} state={game.state} /> : null
  }
}
