import { fireEvent, screen, within } from '@testing-library/react'
import { loadGame } from '../../save/save'
import { fixtureContent, inFight, itemFixture, makeSurvivor, playingState, weakEnemy, withCoins, withItem, withSkill, withStigma } from '../../test/fixtures'
import { renderWithGame } from '../../test/render'
import { content } from '../../data'

test('run button shows the run chance', () => {
  renderWithGame(inFight(playingState(), weakEnemy()));
  expect(screen.getByRole('button', { name: /run \(\d+%\)/i })).toBeInTheDocument();
});
test('a skill on cooldown is disabled', () => {
  const s = inFight(withSkill(playingState(), 'quick-strike'), weakEnemy());
  s.fight!.cooldowns['quick-strike'] = 1;
  renderWithGame(s);
  expect(screen.getByRole('button', { name: /quick strike/i })).toBeDisabled();
});

test('the fight shows both fighters, the round and the exact run chance', () => {
  renderWithGame(inFight(playingState(), weakEnemy()));
  expect(screen.getByRole('meter', { name: /test rat/i })).toBeInTheDocument();
  expect(screen.getByRole('meter', { name: /your hp/i })).toBeInTheDocument();
  expect(screen.getByText(/round 1/i)).toBeInTheDocument();
  // agility 7 (courier) vs 3: 0.4 + 0.05 * 4 = 60%
  expect(screen.getByRole('button', { name: /run \(60%\)/i })).toBeInTheDocument();
});
test('attacking hurts the enemy and the fight goes on', () => {
  const { storage } = renderWithGame(inFight(playingState(), weakEnemy()));
  fireEvent.click(screen.getByRole('button', { name: /^attack$/i }));
  const saved = loadGame(storage);
  expect(saved.ok && saved.state.fight!.enemy.hp).toBeLessThan(30);
  expect(screen.getByText(/round 2/i)).toBeInTheDocument();
});
test('consumables can be used mid-fight', () => {
  const s = inFight(withItem({ ...playingState(), player: { ...playingState().player, hp: 50 } }, 'bandage'), weakEnemy());
  const { storage } = renderWithGame(s);
  fireEvent.click(screen.getByRole('button', { name: /bandage/i }));
  const saved = loadGame(storage);
  expect(saved.ok && saved.state.player.inventory.some(i => i.itemId === 'bandage')).toBe(false);
});
test('the shop disables what you cannot afford', () => {
  renderWithGame(withCoins(playingState(), 30));
  const shop = screen.getByRole('region', { name: /system shop/i });
  expect(within(shop).getByRole('button', { name: /buy crowbar/i })).toBeDisabled();
  expect(within(shop).getByRole('button', { name: /buy bandage/i })).toBeEnabled();
});
test('buying a stat point raises it', () => {
  const { storage } = renderWithGame(withCoins(playingState(), 30));
  fireEvent.click(screen.getByRole('button', { name: /raise strength/i }));
  const saved = loadGame(storage);
  expect(saved.ok && saved.state.player.stats.strength).toBe(6);
});
test('gear can be equipped from the inventory', () => {
  const { storage } = renderWithGame(withItem(playingState(), 'crowbar'));
  fireEvent.click(screen.getByRole('button', { name: /equip crowbar/i }));
  const saved = loadGame(storage);
  expect(saved.ok && saved.state.player.equipped.weapon).toBe('crowbar');
});
test('after the first clear the ranking shows, the dead struck through and you highlighted', () => {
  const s = { ...playingState(), rankingOpen: true, survivors: [makeSurvivor('s-0', { name: 'Mara', points: 9 }), makeSurvivor('s-1', { name: 'Kofi', alive: false })] };
  renderWithGame(s);
  const board = screen.getByRole('region', { name: /ranking/i });
  expect(within(board).getByText('Kofi').closest('s')).not.toBeNull();
  expect(within(board).getByText(/ari/i).closest('tr')).toHaveClass('you');
  expect(screen.getByRole('button', { name: /^ranking$/i })).toBeInTheDocument();
});
test('the stigma has its own button, disabled and marked when sealed', () => {
  const c = content.constellations[0];
  const stigma = content.stigmas.find(x => x.id === c.contract.stigmaId)!;
  renderWithGame(inFight(withStigma(playingState(), c.id, { sealed: true }), weakEnemy()));
  const button = screen.getByRole('button', { name: new RegExp(`stigma: ${stigma.name}`, 'i') });
  expect(button).toBeDisabled();
  expect(button).toHaveTextContent(/sealed/i);
});
test('the Final Wave disables Run', () => {
  const s = inFight(playingState(), weakEnemy());
  renderWithGame({ ...s, fight: { ...s.fight!, origin: 'final-wave' } });
  expect(screen.getByRole('button', { name: /run/i })).toBeDisabled();
});
test('usable rare items show up in fights and in the inventory', () => {
  fixtureContent.items.push({ id: 'fx-relic', name: 'Fixture Relic', kind: 'rare', power: 0, price: 300, inShop: false, effect: { heal: 30 } });
  renderWithGame(inFight(withItem(playingState(), 'fx-relic'), weakEnemy()));
  expect(screen.getByRole('button', { name: /fixture relic/i })).toBeEnabled();
});
test('the inventory offers Use for a usable rare item', () => {
  if (!fixtureContent.items.some(i => i.id === 'fx-relic')) fixtureContent.items.push({ id: 'fx-relic', name: 'Fixture Relic', kind: 'rare', power: 0, price: 300, inShop: false, effect: { heal: 30 } });
  renderWithGame(withItem(playingState(), 'fx-relic'));
  expect(screen.getByRole('button', { name: /use fixture relic/i })).toBeInTheDocument();
});

test('a stat relic is not offered in fights', () => {
  itemFixture({ id: 'fx-crown-ui', name: 'Fixture Crown', kind: 'rare', power: 0, price: 260, inShop: false, effect: { statPoint: 1 } });
  renderWithGame(inFight(withItem(playingState(), 'fx-crown-ui'), weakEnemy()));
  expect(screen.queryByRole('button', { name: /fixture crown/i })).toBeNull();
});
test('a stat relic asks which stat, then raises it', () => {
  itemFixture({ id: 'fx-crown-ui', name: 'Fixture Crown', kind: 'rare', power: 0, price: 260, inShop: false, effect: { statPoint: 1 } });
  const { storage } = renderWithGame(withItem(playingState(), 'fx-crown-ui'));
  fireEvent.click(screen.getByRole('button', { name: /use fixture crown/i }));
  fireEvent.click(screen.getByRole('button', { name: /^raise strength$/i }));
  const loaded = loadGame(storage);
  expect(loaded.ok && loaded.state.player.stats.strength).toBe(playingState().player.stats.strength + 1);
});
test('a full-heal relic and a coin charm are labelled by what they do', () => {
  itemFixture({ id: 'fx-ticket-ui', name: 'Fixture Ticket', kind: 'rare', power: 0, price: 400, inShop: false, effect: { fullHeal: true } });
  itemFixture({ id: 'fx-tooth-ui', name: 'Fixture Tooth', kind: 'rare', power: 0, price: 600, inShop: false, passive: { coinPercent: 20 } });
  renderWithGame(withItem(withItem(playingState(), 'fx-ticket-ui'), 'fx-tooth-ui'));
  expect(screen.getByText(/heals to full/i)).toBeInTheDocument();
  expect(screen.getByText(/\+20% coins while carried/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /use fixture ticket/i })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /use fixture tooth/i })).toBeNull();
});
