import { useState } from 'react'
import { CITY } from '../../data/names'
import type { GameState } from '../../engine/types'
import { clockText } from '../format'
import { ChoiceModal } from '../panels/ChoiceModal'
import { DigestModal } from '../panels/DigestModal'
import { LogPanel } from '../panels/LogPanel'
import { MapPanel } from '../panels/MapPanel'
import { ScenarioPanel } from '../panels/ScenarioPanel'
import { StatusPanel } from '../panels/StatusPanel'
import { ZonePanel } from '../panels/ZonePanel'
import { useContent, type Game } from '../useGame'

type Tab = 'status' | 'map' | 'scenario' | 'log'

const TABS: { id: Tab; label: string }[] = [
  { id: 'status', label: 'Status' },
  { id: 'map', label: 'Map' },
  { id: 'scenario', label: 'Scenario' },
  { id: 'log', label: 'Log' },
]

export function Home({ game, state }: { game: Game; state: GameState }) {
  const content = useContent()
  const [tab, setTab] = useState<Tab>('scenario')
  const firstOpen = content.zones.find((z) => !(state.zones[z.id]?.sealed ?? z.startsSealed)) ?? content.zones[0]
  const [zoneId, setZoneId] = useState(firstOpen.id)

  return (
    <>
      <main className="home" data-tab={tab}>
        <div className="topbar">
          <span>
            <strong>{CITY}</strong> · {clockText(state.inGameHour)}
          </span>
          <span>{state.player.name}</span>
        </div>
        <div className="col col-status">
          <StatusPanel state={state} now={game.now} />
        </div>
        <div className="col col-world">
          <MapPanel
            state={state}
            selected={zoneId}
            onSelect={(id) => {
              setZoneId(id)
              setTab('map')
            }}
          />
          <ZonePanel state={state} zoneId={zoneId} act={game.act} />
        </div>
        <div className="col col-story">
          <ScenarioPanel state={state} />
          <LogPanel state={state} />
        </div>
      </main>
      <nav className="tabbar" aria-label="Sections">
        {TABS.map((t) => (
          <button key={t.id} aria-current={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>
      {state.digest ? (
        <DigestModal entries={state.digest} onContinue={game.dismissDigest} />
      ) : state.pendingChoice ? (
        <ChoiceModal state={state} act={game.act} />
      ) : null}
    </>
  )
}
