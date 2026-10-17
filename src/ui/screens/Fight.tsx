import { playerRunChance, STIGMA_COOLDOWN_PREFIX } from '../../engine/combat'
import { isUsable } from '../../engine/inventory'
import { maxHp } from '../../engine/newGame'
import type { GameState } from '../../engine/types'
import { Meter } from '../panels/StatusPanel'
import { useContent, type PlayerAction } from '../useGame'

const RECENT_LINES = 6

export function Fight({ state, act }: { state: GameState; act: (a: PlayerAction) => void }) {
  const content = useContent()
  const fight = state.fight
  if (!fight) return null
  const p = state.player
  const enemy = fight.enemy
  const chance = Math.round(playerRunChance(state, enemy, content) * 100)
  // The scenario's own fights cannot be run from.
  const held = fight.origin === 'final-wave' || fight.origin === 'scenario'
  const stigma = p.stigma
  const stigmaDef = stigma ? content.stigmas.find((x) => x.id === stigma.stigmaId) : undefined
  const stigmaCooldown = stigma ? (fight.cooldowns[STIGMA_COOLDOWN_PREFIX + stigma.stigmaId] ?? 0) : 0
  const consumables = p.inventory
    .map((stack) => ({ stack, def: content.items.find((i) => i.id === stack.itemId) }))
    .filter((x) => !!x.def && isUsable(x.def) && !x.def.effect?.statPoint)

  // The newest run of fight lines at the end of the log tells this fight's story.
  const lines = []
  for (let i = state.log.length - 1; i >= 0 && lines.length < RECENT_LINES; i--) {
    const e = state.log[i]
    if (e.kind !== 'fight' && e.kind !== 'player') break
    lines.unshift(e)
  }

  const turn = (t: Extract<PlayerAction, { kind: 'fight' }>['turn']) => act({ kind: 'fight', turn: t })

  return (
    <main className="page fight-page">
      <section className="panel fight" aria-labelledby="fight-title">
        <h2 id="fight-title">{`Fight · Round ${fight.round}`}</h2>
        <div className="panel-body">
          <div className="fighters">
            <div>
              <h3>{enemy.name}</h3>
              <Meter label={enemy.name} value={Math.max(0, enemy.hp)} max={enemy.maxHp} kind="hp" />
            </div>
            <div>
              <h3>{p.name}</h3>
              <Meter label="Your HP" value={p.hp} max={maxHp(p.stats)} kind="hp" />
            </div>
          </div>
          <ol className="fight-log" aria-live="polite">
            {lines.map((e) => (
              <li key={e.id} className={`kind-${e.kind}`}>
                <span className="text">{e.text}</span>
              </li>
            ))}
          </ol>
          <div className="fight-actions">
            <button className="btn primary" onClick={() => turn({ kind: 'attack' })}>
              Attack
            </button>
            {p.skills.map((k) => {
              const def = content.skills.find((d) => d.id === k.skillId)
              const cd = fight.cooldowns[k.skillId] ?? 0
              return (
                <button key={k.skillId} className="btn" disabled={cd > 0} onClick={() => turn({ kind: 'skill', skillId: k.skillId })}>
                  {def?.name ?? k.skillId}
                  <span className="cost">{cd > 0 ? `ready in ${cd}` : `Lv${k.level}`}</span>
                </button>
              )
            })}
            {stigma && (
              <button className="btn star" disabled={stigma.sealed || stigmaCooldown > 0} onClick={() => turn({ kind: 'stigma' })}>
                {`Stigma: ${stigmaDef?.name ?? stigma.stigmaId}`}
                <span className="cost">{stigma.sealed ? 'sealed' : stigmaCooldown > 0 ? `ready in ${stigmaCooldown}` : `Lv${stigma.level}`}</span>
              </button>
            )}
            {consumables.map(({ stack, def }) => (
              <button key={stack.itemId} className="btn" onClick={() => turn({ kind: 'item', itemId: stack.itemId })}>
                {def!.name} ×{stack.qty}
              </button>
            ))}
            <button className="btn danger" disabled={held} onClick={() => turn({ kind: 'run' })}>
              {held ? 'Run (nowhere to run)' : `Run (${chance}%)`}
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}
