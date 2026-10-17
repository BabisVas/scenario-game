import { useState } from 'react'
import { CITY } from '../../data/names'
import type { GameState } from '../../engine/types'
import { clockText } from '../format'
import { ChoiceModal } from '../panels/ChoiceModal'
import { InventoryPanel } from '../panels/InventoryPanel'
import { RankingPanel } from '../panels/RankingPanel'
import { ShopPanel } from '../panels/ShopPanel'
import { StatShop } from '../panels/StatShop'
import { DigestModal } from '../panels/DigestModal'
import { LogPanel } from '../panels/LogPanel'
import { MapPanel } from '../panels/MapPanel'
import { ScenarioPanel } from '../panels/ScenarioPanel'
import { StatusPanel } from '../panels/StatusPanel'
import { ZonePanel } from '../panels/ZonePanel'
import { Fight } from './Fight'
import { useContent, type Game } from '../useGame'

type Tab = 'status' | 'map' | 'scenario' | 'log' | 'ranking'

const TABS: { id: Tab; label: string }[] = [
  { id: 'status', label: 'Status' },
  { id: 'map', label: 'Map' },
  { id: 'scenario', label: 'Scenario' },
  { id: 'log', label: 'Log' },
  { id: 'ranking', label: 'Ranking' },
]

export function Home({ game, state }: { game: Game; state: GameState }) {
  const content = useContent()
  const [tab, setTab] = useState<Tab>('scenario')
  const firstOpen = content.zones.find((z) => !(state.zones[z.id]?.sealed ?? z.startsSealed)) ?? content.zones[0]
  const here = content.zones.find((z) => z.id === state.zoneId && !(state.zones[z.id]?.sealed ?? z.startsSealed))
  const [zoneId, setZoneId] = useState((here ?? firstOpen).id)
  // Moving (travel, or being pushed out of a sealing zone) brings the zone panel along.
  const [standingIn, setStandingIn] = useState(state.zoneId)
  if (standingIn !== state.zoneId) {
    setStandingIn(state.zoneId)
    setZoneId(state.zoneId)
  }
  const digest = state.digest ? <DigestModal entries={state.digest} onContinue={game.dismissDigest} /> : null

  if (state.fight) {
    return (
      <>
        <Fight state={state} act={game.act} />
        {digest}
      </>
    )
  }
  const tabs = TABS.filter((t) => t.id !== 'ranking' || state.rankingOpen)

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
          <InventoryPanel state={state} act={game.act} />
          <StatShop state={state} act={game.act} />
          <ShopPanel state={state} act={game.act} />
        </div>
        <div className="col col-world">
          <MapPanel
            state={state}
            act={game.act}
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
          <RankingPanel state={state} />
        </div>
      </main>
      <nav className="tabbar" aria-label="Sections">
        {tabs.map((t) => (
          <button key={t.id} aria-current={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>
      {digest ?? (state.pendingChoice ? (
        <ChoiceModal state={state} act={game.act} />
      ) : null)}
    </>
  )
}
