import { LOG_MAX_ENTRIES } from './config'
import type { GameEvent, GameState, LogEntry } from './types'

/** Turns events into numbered log entries and keeps only the newest LOG_MAX_ENTRIES. */
export function appendEvents(state: GameState, events: GameEvent[]): GameState {
  if (events.length === 0) return state
  const entries: LogEntry[] = events.map((e, i) => ({
    id: state.nextLogId + i,
    kind: e.kind,
    text: e.text,
    inGameHour: state.inGameHour,
  }))
  return {
    ...state,
    log: [...state.log, ...entries].slice(-LOG_MAX_ENTRIES),
    nextLogId: state.nextLogId + events.length,
  }
}
