import { createTabGuard } from './tabGuard'
import { fakeWindow, memoryStorage } from '../test/fixtures'

const KEY = 'scenario-game/active-tab';

test('a newer tab claiming the game takes over the older one', () => {
  const onTakenOver = vi.fn();
  const win = fakeWindow(); const st = memoryStorage();
  createTabGuard({ storage: st, tabId: 'A', onTakenOver, window: win }).claim();
  win.fireStorage('scenario-game/active-tab', JSON.stringify({ tabId: 'B', at: 2 }));
  expect(onTakenOver).toHaveBeenCalledOnce();
});
test('claim records this tab as the active one', () => {
  const st = memoryStorage();
  createTabGuard({ storage: st, tabId: 'A', onTakenOver: () => {}, window: fakeWindow() }).claim();
  expect(JSON.parse(st.getItem(KEY)!)).toMatchObject({ tabId: 'A' });
});
test('storage events about other keys or this tab are ignored', () => {
  const onTakenOver = vi.fn();
  const win = fakeWindow();
  createTabGuard({ storage: memoryStorage(), tabId: 'A', onTakenOver, window: win }).claim();
  win.fireStorage('something-else', JSON.stringify({ tabId: 'B', at: 2 }));
  win.fireStorage(KEY, JSON.stringify({ tabId: 'A', at: 3 }));
  win.fireStorage(KEY, null);
  win.fireStorage(KEY, 'garbage');
  expect(onTakenOver).not.toHaveBeenCalled();
});
test('a disposed guard no longer reacts', () => {
  const onTakenOver = vi.fn();
  const win = fakeWindow();
  const g = createTabGuard({ storage: memoryStorage(), tabId: 'A', onTakenOver, window: win });
  g.claim(); g.dispose();
  win.fireStorage(KEY, JSON.stringify({ tabId: 'B', at: 2 }));
  expect(onTakenOver).not.toHaveBeenCalled();
});
