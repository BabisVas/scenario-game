import { act, renderHook } from '@testing-library/react'
import { runAction, useGame } from './useGame'
import { SAVE_KEY, WORLD_TICK_MS } from '../engine/config'
import { createRng } from '../engine/rng'
import type { GameState } from '../engine/types'
import { loadGame, saveGame } from '../save/save'
import { content } from '../data'
import { baseState, brutalEnemy, inFight, memoryStorage, withCoins } from '../test/fixtures'
import { withStorage } from '../test/render'

function nearDeathInLosingFight(): GameState {
  return inFight({ ...baseState(), player: { ...baseState().player, hp: 1 } }, brutalEnemy());
}

afterEach(() => { vi.useRealTimers(); });

test('no save shows no-save', () => {
  const { result } = renderHook(() => useGame(), { wrapper: withStorage(memoryStorage()) });
  expect(result.current.status).toBe('no-save');
});
test('an action is saved immediately', () => {
  const st = memoryStorage();
  const { result } = renderHook(() => useGame(), { wrapper: withStorage(st) });
  act(() => result.current.newGame('Ari', 'courier'));
  act(() => result.current.act({ kind: 'zone', zoneId: 'old-market', action: 'rest' }));
  // Resting takes 4 hours; an ambush in this survive scenario can add the fight's hour.
  const saved = loadGame(st);
  expect(saved.ok && saved.state.inGameHour).toBeGreaterThanOrEqual(4);
});
test('death deletes the save', () => {
  const st = memoryStorage();
  saveGame(nearDeathInLosingFight(), st);
  const { result } = renderHook(() => useGame(), { wrapper: withStorage(st) });
  act(() => result.current.act({ kind: 'fight', turn: { kind: 'attack' } }));
  expect(result.current.status).toBe('dead');
  expect(loadGame(st)).toEqual({ ok: false, reason: 'none' });
});
test('a corrupt save shows unreadable', () => {
  const st = memoryStorage(); st.setItem(SAVE_KEY, 'x');
  const { result } = renderHook(() => useGame(), { wrapper: withStorage(st) });
  expect(result.current.status).toBe('unreadable');
});

test('an outdated save shows unreadable too', () => {
  const st = memoryStorage(); st.setItem(SAVE_KEY, JSON.stringify({ ...baseState(), schemaVersion: 0 }));
  const { result } = renderHook(() => useGame(), { wrapper: withStorage(st) });
  expect(result.current.status).toBe('unreadable');
});
test('coming back after a while catches up and shows a digest', () => {
  const st = memoryStorage();
  saveGame({ ...baseState(), worldTickAt: Date.now() - 3 * 3600_000, energy: 0, energyUpdatedAt: Date.now() - 3 * 3600_000 }, st);
  const { result } = renderHook(() => useGame(), { wrapper: withStorage(st) });
  expect(result.current.status).toBe('playing');
  expect(result.current.state!.energy).toBeGreaterThan(30);
  expect(result.current.state!.digest!.length).toBeGreaterThan(0);
  act(() => result.current.dismissDigest());
  expect(result.current.state!.digest).toBeNull();
  expect(loadGame(st)).toMatchObject({ ok: true, state: { digest: null } });
});
test('a new game replaces an unreadable save', () => {
  const st = memoryStorage(); st.setItem(SAVE_KEY, 'x');
  const { result } = renderHook(() => useGame(), { wrapper: withStorage(st) });
  act(() => result.current.newGame('Ari', 'courier'));
  expect(result.current.status).toBe('playing');
  expect(loadGame(st)).toMatchObject({ ok: true, state: { player: { name: 'Ari' } } });
});
test('another tab taking over stops this one from saving', () => {
  const st = memoryStorage();
  const { result } = renderHook(() => useGame(), { wrapper: withStorage(st) });
  act(() => result.current.newGame('Ari', 'courier'));
  act(() => { window.dispatchEvent(new StorageEvent('storage', { key: 'scenario-game/active-tab', newValue: JSON.stringify({ tabId: 'other', at: 1 }) })); });
  expect(result.current.status).toBe('taken-over');
  const before = st.getItem(SAVE_KEY);
  act(() => result.current.act({ kind: 'zone', zoneId: 'old-market', action: 'rest' }));
  expect(st.getItem(SAVE_KEY)).toBe(before);
});
test('energy refills and the world moves while the tab stays open', () => {
  vi.useFakeTimers();
  vi.setSystemTime(1_000_000_000);
  const st = memoryStorage();
  saveGame({ ...baseState(), energy: 50, energyUpdatedAt: Date.now(), worldTickAt: Date.now(), lastSeenAt: Date.now() }, st);
  const { result } = renderHook(() => useGame(), { wrapper: withStorage(st) });
  act(() => { vi.advanceTimersByTime(WORLD_TICK_MS + 2000); });
  expect(result.current.state!.energy).toBeGreaterThan(50);
  expect(result.current.state!.worldTickAt).toBeGreaterThan(1_000_000_000);
  expect(result.current.state!.digest).toBeNull();
});

test('runAction refuses shopping in the middle of a fight', () => {
  const s = inFight(withCoins(baseState(), 500), brutalEnemy());
  const r = runAction(s, { kind: 'buyStat', stat: 'endurance' }, createRng(1), content);
  expect(r.state.player).toEqual(s.player);
});
test('runAction routes a contract answer and an attack', () => {
  const s = baseState();
  const r = runAction(s, { kind: 'attack', survivorId: 's-1' }, createRng(1), content);
  expect(r.state.fight).toMatchObject({ survivorId: 's-1' });
  const cruel = content.constellations.find(c => (c.likes.cruelty ?? 0) > 0)!.id;
  expect(r.state.constellations[cruel].interest).toBeGreaterThan(0);
});
