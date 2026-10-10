import { ENERGY_MAX } from '../../engine/config'
import { maxHp } from '../../engine/newGame'
import { msUntilNextEnergy } from '../../engine/time'
import type { GameState, StatKey } from '../../engine/types'
import { mmss } from '../format'
import { useContent } from '../useGame'

const STATS: { key: StatKey; label: string }[] = [
  { key: 'strength', label: 'STR' },
  { key: 'agility', label: 'AGI' },
  { key: 'endurance', label: 'END' },
  { key: 'spirit', label: 'SPI' },
]

export function Meter({ label, value, max, kind, note }: { label: string; value: number; max: number; kind: 'hp' | 'energy'; note?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className="meter">
      <div className="meter-head">
        <span>{label}</span>
        <span>
          {value}/{max}
          {note ? ` · ${note}` : ''}
        </span>
      </div>
      <div className={`bar ${kind}`} role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}>
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function StatusPanel({ state, now }: { state: GameState; now: number }) {
  const content = useContent()
  const p = state.player
  const background = content.backgrounds.find((b) => b.id === p.backgroundId)
  const wait = msUntilNextEnergy(state, now)
  return (
    <section className="panel" data-tab-panel="status" aria-labelledby="status-title">
      <h2 id="status-title">Status</h2>
      <div className="panel-body">
        <div className="who">
          <h3>{p.name}</h3>
          <span className="muted small">{background?.name}</span>
        </div>
        <Meter label="HP" value={p.hp} max={maxHp(p.stats)} kind="hp" />
        <Meter
          label="Energy"
          value={state.energy}
          max={ENERGY_MAX}
          kind="energy"
          note={state.energy >= ENERGY_MAX ? 'full' : `next +1 in ${mmss(wait)}`}
        />
        <ul className="stats">
          {STATS.map((s) => (
            <li key={s.key}>
              <span>{s.label}</span>
              <span>{p.stats[s.key]}</span>
            </li>
          ))}
        </ul>
        <p className="coins">◈ {p.coins} coins</p>
        {p.skills.length > 0 && (
          <p className="small muted">
            Skills:{' '}
            {p.skills
              .map((k) => `${content.skills.find((d) => d.id === k.skillId)?.name ?? k.skillId} Lv${k.level}`)
              .join(', ')}
          </p>
        )}
      </div>
    </section>
  )
}
