import { addItem, buyFromShop, equip, removeItem, sellToShop, useConsumable } from './inventory'
import { content } from '../data'
import { baseState, withCoins, withItem } from '../test/fixtures'

const qty = (s: ReturnType<typeof baseState>, id: string) => s.player.inventory.find(i => i.itemId === id)?.qty ?? 0;

test('healing never exceeds max hp', () => {
  const s = withItem({ ...baseState(), player: { ...baseState().player, hp: 95 } }, 'bandage');
  expect(useConsumable(s, 'bandage', content).state.player.hp).toBe(100);
});
test('a consumable heals by its amount and is used up', () => {
  const s = withItem({ ...baseState(), player: { ...baseState().player, hp: 50 } }, 'bandage');
  const r = useConsumable(s, 'bandage', content).state;
  expect(r.player.hp).toBe(75);
  expect(qty(r, 'bandage')).toBe(0);
});
test('using an item you do not have is refused', () => {
  const s = { ...baseState(), player: { ...baseState().player, hp: 50 } };
  const r = useConsumable(s, 'bandage', content);
  expect(r.state).toEqual(s);
  expect(r.events[0].kind).toBe('system');
});
test('adding an item stacks with the same item', () => {
  const s = addItem(addItem(baseState(), 'bandage'), 'bandage', 2);
  expect(qty(s, 'bandage')).toBe(3);
  expect(s.player.inventory.filter(i => i.itemId === 'bandage')).toHaveLength(1);
});
test('removing more than you have returns null; removing the last one drops the stack', () => {
  const s = addItem(baseState(), 'bandage');
  expect(removeItem(s, 'bandage', 2)).toBeNull();
  expect(removeItem(s, 'bandage')!.player.inventory.some(i => i.itemId === 'bandage')).toBe(false);
});
test('equip puts an owned weapon in the weapon slot', () => {
  expect(equip(baseState(), 'bike-chain', content).player.equipped.weapon).toBe('bike-chain');
});
test('equip ignores items you do not own or that are not gear', () => {
  const s = withItem(baseState(), 'bandage');
  expect(equip(s, 'crowbar', content)).toEqual(s);
  expect(equip(s, 'bandage', content)).toEqual(s);
});
test('buying from the shop spends the price and adds the item', () => {
  const r = buyFromShop(withCoins(baseState(), 100), 'crowbar', content).state;
  expect(r.player.coins).toBe(40);
  expect(qty(r, 'crowbar')).toBe(1);
});
test('the shop refuses when coins are short or the item is not sold', () => {
  const poor = withCoins(baseState(), 59);
  expect(buyFromShop(poor, 'crowbar', content).state).toEqual(poor);
  const rich = withCoins(baseState(), 999);
  expect(buyFromShop(rich, 'mirror-shard', content).state).toEqual(rich);
});
test('selling pays half the price, rounded down', () => {
  const r = sellToShop(withItem(withCoins(baseState(), 0), 'flare'), 'flare', content).state;
  expect(r.player.coins).toBe(9);
  expect(qty(r, 'flare')).toBe(0);
});
test('selling your last equipped weapon unequips it', () => {
  const s = equip(baseState(), 'bike-chain', content);
  expect(sellToShop(s, 'bike-chain', content).state.player.equipped.weapon).toBeUndefined();
});
