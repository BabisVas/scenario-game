// Keeps two open tabs from overwriting each other's progress: the newest tab
// to claim the game wins, and every older tab is told to stop.

const ACTIVE_TAB_KEY = 'scenario-game/active-tab'

export function createTabGuard(opts: {
  storage: Storage
  tabId: string
  onTakenOver: () => void
  window: Pick<Window, 'addEventListener' | 'removeEventListener'>
}): { claim(): void; dispose(): void } {
  const onStorage = (e: StorageEvent) => {
    if (e.key !== ACTIVE_TAB_KEY || e.newValue === null) return
    let claimant: unknown
    try {
      claimant = (JSON.parse(e.newValue) as { tabId?: unknown }).tabId
    } catch {
      return
    }
    if (typeof claimant === 'string' && claimant !== opts.tabId) opts.onTakenOver()
  }
  opts.window.addEventListener('storage', onStorage)

  return {
    claim() {
      opts.storage.setItem(ACTIVE_TAB_KEY, JSON.stringify({ tabId: opts.tabId, at: Date.now() }))
    },
    dispose() {
      opts.window.removeEventListener('storage', onStorage)
    },
  }
}
