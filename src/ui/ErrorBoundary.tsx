import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode; onReload?: () => void }

/**
 * Catches a crashing screen and offers a reload. It never reads or writes the
 * save: whatever was last saved is exactly what the reload will load.
 */
export class ErrorBoundary extends Component<Props, { crashed: boolean }> {
  state = { crashed: false }

  static getDerivedStateFromError() {
    return { crashed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Screen crashed:', error, info.componentStack)
  }

  render() {
    if (!this.state.crashed) return this.props.children
    const reload = this.props.onReload ?? (() => window.location.reload())
    return (
      <main className="page">
        <section className="panel" role="alert" aria-labelledby="crash-title">
          <h2 id="crash-title">Error</h2>
          <div className="panel-body">
            <p>Something went wrong.</p>
            <p className="muted small">Your save is safe. Reloading picks up from your last action.</p>
            <button className="btn primary" onClick={reload}>
              Reload
            </button>
          </div>
        </section>
      </main>
    )
  }
}
