// Test-only React helpers.

import type { ReactNode } from 'react'
import { GameStorageContext } from '../ui/useGame'

/** A renderHook/render wrapper that points the game at the given storage. */
export function withStorage(storage: Storage) {
  return function StorageWrapper({ children }: { children: ReactNode }) {
    return <GameStorageContext.Provider value={storage}>{children}</GameStorageContext.Provider>
  }
}
