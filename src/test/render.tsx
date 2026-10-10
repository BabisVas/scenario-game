// Test-only React helpers.

import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import type { GameState } from '../engine/types'
import { saveGame } from '../save/save'
import { App } from '../ui/App'
import { GameContentContext, GameStorageContext } from '../ui/useGame'
import { fixtureContent, memoryStorage } from './fixtures'

/** A renderHook/render wrapper that points the game at the given storage and the fixture content. */
export function withStorage(storage: Storage) {
  return function StorageWrapper({ children }: { children: ReactNode }) {
    return (
      <GameContentContext.Provider value={fixtureContent}>
        <GameStorageContext.Provider value={storage}>{children}</GameStorageContext.Provider>
      </GameContentContext.Provider>
    )
  }
}

/** Renders the whole app over a storage that already holds `state` (or nothing). */
export function renderWithGame(state: GameState | null, storage: Storage = memoryStorage()) {
  if (state) saveGame(state, storage)
  const Wrapper = withStorage(storage)
  return { storage, ...render(<Wrapper><App /></Wrapper>) }
}
