import { fireEvent, render, screen } from '@testing-library/react'
import { ErrorBoundary } from './ErrorBoundary'
import { SAVE_KEY } from '../engine/config'
import { saveGame } from '../save/save'
import { memoryStorage, playingState } from '../test/fixtures'
import { withStorage } from '../test/render'

function Boom(): never {
  throw new Error('kaboom');
}

beforeEach(() => { vi.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => { vi.restoreAllMocks(); });

test('renders its children when nothing goes wrong', () => {
  render(<ErrorBoundary><p>all fine</p></ErrorBoundary>);
  expect(screen.getByText('all fine')).toBeInTheDocument();
});
test('a crashing screen shows "Something went wrong" with a Reload button', () => {
  render(<ErrorBoundary><Boom /></ErrorBoundary>);
  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /reload/i })).toBeInTheDocument();
});
test('Reload reloads the page', () => {
  const onReload = vi.fn();
  render(<ErrorBoundary onReload={onReload}><Boom /></ErrorBoundary>);
  fireEvent.click(screen.getByRole('button', { name: /reload/i }));
  expect(onReload).toHaveBeenCalledOnce();
});
test('a crash never touches the save', () => {
  const st = memoryStorage();
  saveGame(playingState(), st);
  const before = st.getItem(SAVE_KEY);
  const setItem = vi.spyOn(st, 'setItem');
  const removeItem = vi.spyOn(st, 'removeItem');
  const Wrapper = withStorage(st);
  render(<Wrapper><ErrorBoundary onReload={() => {}}><Boom /></ErrorBoundary></Wrapper>);
  fireEvent.click(screen.getByRole('button', { name: /reload/i }));
  expect(st.getItem(SAVE_KEY)).toBe(before);
  expect(setItem).not.toHaveBeenCalled();
  expect(removeItem).not.toHaveBeenCalled();
});
