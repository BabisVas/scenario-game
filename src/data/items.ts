import type { ItemDef } from './schema'

export const items: ItemDef[] = [
  { id: 'kitchen-knife', name: 'Kitchen Knife', kind: 'weapon', power: 3, price: 20, inShop: true },
  { id: 'bike-chain', name: 'Bike Chain', kind: 'weapon', power: 3, price: 20, inShop: false },
  { id: 'crowbar', name: 'Crowbar', kind: 'weapon', power: 6, price: 60, inShop: true },
  { id: 'padded-jacket', name: 'Padded Jacket', kind: 'armor', power: 2, price: 25, inShop: true },
  { id: 'riot-vest', name: 'Riot Vest', kind: 'armor', power: 5, price: 90, inShop: true },
  { id: 'bandage', name: 'Bandage', kind: 'consumable', power: 0, price: 10, inShop: true, effect: { heal: 25 } },
  { id: 'flare', name: 'Road Flare', kind: 'consumable', power: 0, price: 18, inShop: true, effect: { damage: 20 } },
  { id: 'mirror-shard', name: 'Humming Mirror Shard', kind: 'rare', power: 0, price: 120, inShop: false },
]
