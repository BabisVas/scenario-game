export function Unreadable({ onNewGame }: { onNewGame: () => void }) {
  return (
    <main className="page">
      <section className="panel" aria-labelledby="unreadable-title">
        <h2 id="unreadable-title">Save error</h2>
        <div className="panel-body">
          <p>This save can't be read.</p>
          <p className="muted small">It may be damaged or from an older version of the game. Starting over replaces it.</p>
          <button className="btn primary" onClick={onNewGame}>
            New Game
          </button>
        </div>
      </section>
    </main>
  )
}
