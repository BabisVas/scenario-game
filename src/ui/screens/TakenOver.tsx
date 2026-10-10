export function TakenOver() {
  return (
    <main className="page">
      <section className="panel" aria-labelledby="taken-over-title">
        <h2 id="taken-over-title">Paused</h2>
        <div className="panel-body">
          <p>The game is open in another tab.</p>
          <p className="muted small">This tab has stopped so the two cannot overwrite each other. Close it, or reload to play here instead.</p>
        </div>
      </section>
    </main>
  )
}
