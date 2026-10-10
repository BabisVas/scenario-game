import type { LogEntry } from '../../engine/types'

export function DigestModal({ entries, onContinue }: { entries: LogEntry[]; onContinue: () => void }) {
  return (
    <div className="overlay">
      <section className="panel modal" role="dialog" aria-modal="true" aria-labelledby="digest-title">
        <h2 id="digest-title">While you were gone</h2>
        <div className="panel-body">
          <ul className="list">
            {entries.map((e) => (
              <li key={e.id}>{e.text}</li>
            ))}
          </ul>
        </div>
        <footer>
          <button className="btn primary" onClick={onContinue} autoFocus>
            Continue
          </button>
        </footer>
      </section>
    </div>
  )
}
