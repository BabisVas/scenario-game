// The one game store: loads, catches up, runs player actions through the engine and autosaves.

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { content } from '../data'
import type { ActionId, Content } from '../data/schema'
import { doAction } from '../engine/actions'
import { fightTurn, type FightAction } from '../engine/combat'
import { WORLD_TICK_MS } from '../engine/config'
import { resolveContract, withReactions } from '../engine/constellations'
import { buyStat } from '../engine/growth'
import { buyFromShop, equip, sellToShop, useConsumable } from '../engine/inventory'
import { appendEvents } from '../engine/log'
import { newGame as createNewGame } from '../engine/newGame'
import { createRng, type Rng } from '../engine/rng'
import { resolveChoice } from '../engine/scenario'
import { attackSurvivor, tradeWithSurvivor, worldTick } from '../engine/survivors'
import { catchUp, refillEnergy } from '../engine/time'
import type { GameState, StatKey, Step } from '../engine/types'
import { deleteSave, loadGame, saveGame } from '../save/save'
import { createTabGuard } from '../save/tabGuard'

export type PlayerAction =
  | { kind: 'zone'; zoneId: string; action: ActionId }
  | { kind: 'fight'; turn: FightAction }
  | { kind: 'choice'; optionId: string; targetSurvivorId: string | null }
  | { kind: 'contract'; accept: boolean }
  | { kind: 'buyStat'; stat: StatKey }
  | { kind: 'shop'; mode: 'buy' | 'sell'; itemId: string }
  | { kind: 'equip'; itemId: string }
  | { kind: 'useItem'; itemId: string }
  | { kind: 'meet'; zoneId: string }
  | { kind: 'trade'; survivorId: string; itemId: string; mode: 'buy' | 'sell' }
  | { kind: 'attack'; survivorId: string }

export type GameStatus = 'loading' | 'no-save' | 'unreadable' | 'playing' | 'dead' | 'taken-over'

/** Where the game saves. Tests inject an in-memory Storage; the game uses localStorage. */
export const GameStorageContext = createContext<Storage | null>(null)

const refuse = (state: GameState, text: string): Step => ({ state, events: [{ kind: 'system', text }] })

/** Runs one player action through the engine. Pure: same state, action and rng give the same step. */
export function runAction(state: GameState, a: PlayerAction, rng: Rng, c: Content): Step {
  if (state.phase.kind === 'dead') return refuse(state, 'You are dead.')
  switch (a.kind) {
    case 'fight':
      return state.fight ? fightTurn(state, a.turn, rng, c) : refuse(state, 'There is no fight.')
    case 'choice':
      return resolveChoice(state, a.optionId, a.targetSurvivorId, rng, c)
    case 'contract':
      return resolveContract(state, a.accept, c)
    case 'zone':
      return doAction(state, a.zoneId, a.action, rng, c)
    case 'meet':
      return doAction(state, a.zoneId, 'talk', rng, c)
  }
  if (state.fight) return refuse(state, 'Not in the middle of a fight!')
  switch (a.kind) {
    case 'buyStat':
      return buyStat(state, a.stat)
    case 'shop':
      return a.mode === 'buy' ? buyFromShop(state, a.itemId, c) : sellToShop(state, a.itemId, c)
    case 'equip':
      return { state: equip(state, a.itemId, c), events: [] }
    case 'useItem':
      return useConsumable(state, a.itemId, c)
    case 'trade':
      return tradeWithSurvivor(state, a.survivorId, a.itemId, a.mode, c)
    case 'attack':
      if (state.pendingChoice) return refuse(state, 'Finish what you are doing first.')
      return withReactions(attackSurvivor(state, a.survivorId), rng, c)
  }
}

/** Real-time catch-up. In-tab catch-ups keep the old digest so no popup interrupts play. */
function catchUpTo(state: GameState, now: number, showDigest: boolean): GameState {
  const rng = createRng(state.rngState)
  const step = catchUp(state, now, rng, (s, r) => worldTick(s, r, content))
  const s = appendEvents(step.state, step.events)
  return { ...s, digest: showDigest ? s.digest : state.digest, rngState: rng.getState() }
}

type View = { status: GameStatus; state: GameState | null }

export function useGame() {
  const injected = useContext(GameStorageContext)
  const storage = injected ?? window.localStorage
  const [view, setView] = useState<View>({ status: 'loading', state: null })
  const [now, setNow] = useState(() => Date.now())
  const ref = useRef<View>(view)
  const takenOver = useRef(false)
  const tabId = useRef(Math.random().toString(36).slice(2))

  const commit = useCallback(
    (status: GameStatus, state: GameState | null) => {
      if (takenOver.current) return
      if (status === 'dead') deleteSave(storage)
      else if (state) saveGame(state, storage)
      ref.current = { status, state }
      setView(ref.current)
    },
    [storage],
  )

  useEffect(() => {
    const guard = createTabGuard({
      storage,
      tabId: tabId.current,
      window,
      onTakenOver: () => {
        takenOver.current = true
        ref.current = { ...ref.current, status: 'taken-over' }
        setView(ref.current)
      },
    })
    guard.claim()
    const loaded = loadGame(storage)
    if (!loaded.ok) commit(loaded.reason === 'none' ? 'no-save' : 'unreadable', null)
    else if (loaded.state.phase.kind === 'dead') commit('dead', loaded.state)
    else commit('playing', catchUpTo(loaded.state, Date.now(), true))
    return () => guard.dispose()
  }, [storage, commit])

  useEffect(() => {
    const id = setInterval(() => {
      const t = Date.now()
      setNow(t)
      const cur = ref.current
      if (cur.status !== 'playing' || !cur.state) return
      let s = cur.state
      if (t - s.worldTickAt >= WORLD_TICK_MS) s = catchUpTo(s, t, false)
      else {
        const refilled = refillEnergy(s, t)
        if (refilled.energy !== s.energy) s = refilled
      }
      if (s !== cur.state) commit('playing', s)
    }, 1000)
    return () => clearInterval(id)
  }, [commit])

  const act = useCallback(
    (a: PlayerAction) => {
      const cur = ref.current
      if (takenOver.current || cur.status !== 'playing' || !cur.state) return
      const t = Date.now()
      const base = refillEnergy(cur.state, t)
      const rng = createRng(base.rngState)
      const step = runAction(base, a, rng, content)
      const s = { ...appendEvents(step.state, step.events), rngState: rng.getState(), lastSeenAt: t }
      commit(s.phase.kind === 'dead' ? 'dead' : 'playing', s)
    },
    [commit],
  )

  const newGame = useCallback(
    (name: string, backgroundId: string) => {
      const seed = Math.floor(Math.random() * 2 ** 32)
      commit('playing', createNewGame({ name, backgroundId, seed, now: Date.now() }, content))
    },
    [commit],
  )

  const dismissDigest = useCallback(() => {
    const cur = ref.current
    if (cur.state) commit(cur.status, { ...cur.state, digest: null })
  }, [commit])

  return { status: view.status, state: view.state, now, act, newGame, dismissDigest }
}
