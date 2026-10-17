import { catchUp, msUntilNextEnergy, refillEnergy } from './time'
import { createRng } from './rng'
import type { GameState } from './types'
import { baseState } from '../test/fixtures'
import { DIGEST_LINE_LOSSES, DIGEST_LINE_QUIET } from '../data/screens'

test('8 hours away refills from 0 to full', () => {
  const s = { ...baseState(), energy: 0, energyUpdatedAt: 0 };
  expect(refillEnergy(s, 8 * 3600_000).energy).toBe(100);
});
test('partial refill keeps the remainder', () => {
  const s = { ...baseState(), energy: 10, energyUpdatedAt: 0 };
  const r = refillEnergy(s, 288_000 * 3 + 1000);
  expect(r.energy).toBe(13);
  expect(r.energyUpdatedAt).toBe(288_000 * 3);
});
test('clock going backwards changes nothing but the timestamp', () => {
  const s = { ...baseState(), energy: 40, energyUpdatedAt: 10_000 };
  const r = refillEnergy(s, 5_000);
  expect(r.energy).toBe(40);
  expect(r.energyUpdatedAt).toBe(5_000);
});
test('a full tank does not bank time for later', () => {
  const s = { ...baseState(), energy: 95, energyUpdatedAt: 0 };
  const r = refillEnergy(s, 24 * 3600_000);
  expect(r.energy).toBe(100);
  expect(r.energyUpdatedAt).toBe(24 * 3600_000);
});
test('next energy point countdown', () => {
  const s = { ...baseState(), energy: 50, energyUpdatedAt: 0 };
  expect(msUntilNextEnergy(s, 1000)).toBe(287_000);
  expect(msUntilNextEnergy({ ...s, energy: 100 }, 1000)).toBe(0);
});
test('catch-up after a year runs at most 72 ticks', () => {
  const tick = vi.fn((s: GameState) => ({ state: s, events: [] }));
  catchUp({ ...baseState(), worldTickAt: 0 }, 365 * 24 * 3600_000, createRng(1), tick);
  expect(tick).toHaveBeenCalledTimes(72);
});
test('catch-up runs one tick per 20 minutes away', () => {
  const tick = vi.fn((s: GameState) => ({ state: s, events: [] }));
  catchUp({ ...baseState(), worldTickAt: 0 }, 59 * 60_000, createRng(1), tick);
  expect(tick).toHaveBeenCalledTimes(2);
});
test('catch-up with the clock gone backwards runs no ticks and resets the timestamps', () => {
  const tick = vi.fn((s: GameState) => ({ state: s, events: [] }));
  const r = catchUp({ ...baseState(), worldTickAt: 50_000, lastSeenAt: 50_000 }, 10_000, createRng(1), tick).state;
  expect(tick).not.toHaveBeenCalled();
  expect([r.worldTickAt, r.lastSeenAt]).toEqual([10_000, 10_000]);
});
test('catch-up never touches hp, scenario hours or in-game time', () => {
  const s = baseState();
  const tick = (x: GameState) => ({ state: x, events: [{ kind: 'survivor' as const, text: 'x' }] });
  const r = catchUp(s, s.worldTickAt + 3600_000, createRng(1), tick).state;
  expect(r.player.hp).toBe(s.player.hp);
  expect(r.phase).toEqual(s.phase);
  expect(r.inGameHour).toBe(s.inGameHour);
  expect(r.digest).toHaveLength(4);
});
test('catch-up undoes a tick that misbehaves and touches the player or the clock', () => {
  const s = baseState();
  const rogue = (x: GameState) => ({
    state: { ...x, player: { ...x.player, hp: 1 }, inGameHour: x.inGameHour + 5, phase: { kind: 'dead' as const, cause: 'x' } },
    events: [],
  });
  const r = catchUp(s, s.worldTickAt + 3600_000, createRng(1), rogue).state;
  expect(r.player).toEqual(s.player);
  expect(r.phase).toEqual(s.phase);
  expect(r.inGameHour).toBe(s.inGameHour);
});
test('the digest keeps the newest 12 events as digest entries, after its opening line', () => {
  let n = 0;
  const tick = (x: GameState) => ({ state: x, events: [{ kind: 'survivor' as const, text: `e${n++}` }, { kind: 'constellation' as const, text: `e${n++}` }] });
  const r = catchUp(baseState(), 24 * 3600_000, createRng(1), tick);
  expect(r.state.digest).toHaveLength(13);
  expect(r.state.digest!.slice(1).every(d => d.kind === 'digest')).toBe(true);
  expect(r.state.digest!.at(-1)!.text).toBe('e143');
  expect(r.events).toHaveLength(144);
});
test('no events leaves no digest', () => {
  const tick = (x: GameState) => ({ state: x, events: [] });
  expect(catchUp(baseState(), 3600_000, createRng(1), tick).state.digest).toBeNull();
});

describe('the digest opens with a true line about the time away', () => {
  const dies = (x: GameState) => ({
    state: { ...x, survivors: x.survivors.map((v, i) => (i === 0 ? { ...v, alive: false } : v)) },
    events: [{ kind: 'survivor' as const, text: 'someone fell' }],
  });
  const quiet = (x: GameState) => ({ state: x, events: [{ kind: 'survivor' as const, text: 'a party formed' }] });
  test('when someone died while the player was away, it says others were less fortunate', () => {
    const r = catchUp(baseState(), 3600_000, createRng(1), dies).state;
    expect(r.digest![0]).toMatchObject({ kind: 'system', text: DIGEST_LINE_LOSSES });
    expect(DIGEST_LINE_LOSSES).toMatch(/less fortunate/i);
  });
  test('when nobody died, it never says so', () => {
    const r = catchUp(baseState(), 3600_000, createRng(1), quiet).state;
    expect(r.digest![0]).toMatchObject({ kind: 'system', text: DIGEST_LINE_QUIET });
    expect(DIGEST_LINE_QUIET).not.toMatch(/less fortunate/i);
  });
});
