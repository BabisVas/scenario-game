import { CITY } from './names'
import type { ItemDef } from './schema'

// Rare items are never sold by the shop or by survivors. Each one does something nothing else does.
export const items: ItemDef[] = [
  // Weapons
  { id: 'kitchen-knife', name: 'Kitchen Knife', kind: 'weapon', power: 3, price: 20, inShop: true, blurb: 'Still smells of onions. It has opinions about how things should be cut.' },
  { id: 'bike-chain', name: 'Bike Chain', kind: 'weapon', power: 3, price: 20, inShop: false, blurb: `Wrapped twice round your fist. It has carried you across ${CITY} a thousand times; now it carries you through it.` },
  { id: 'crowbar', name: 'Crowbar', kind: 'weapon', power: 6, price: 60, inShop: true, blurb: `The universal key. Every door in ${CITY} knows its name.` },
  { id: 'rebar-spear', name: 'Rebar Spear', kind: 'weapon', power: 7, price: 90, inShop: true, blurb: "Concrete still clings to the end. Somebody's half-built house is a little more unfinished now." },
  { id: 'fire-axe', name: 'Fire Axe', kind: 'weapon', power: 8, price: 110, inShop: true, blurb: 'IN CASE OF EMERGENCY. This counts.' },
  { id: 'harbor-hook', name: 'Harbor Hook', kind: 'weapon', power: 8, price: 160, inShop: false, blurb: 'The dockers say it once pulled something up from the deep that was still blinking.' },
  { id: 'arena-gauntlets', name: 'Arena Gauntlets', kind: 'weapon', power: 10, price: 220, inShop: false, blurb: 'Heavy, scuffed, and warm inside, as if someone took them off a moment ago.' },
  // Armor
  { id: 'padded-jacket', name: 'Padded Jacket', kind: 'armor', power: 2, price: 25, inShop: true, blurb: 'Warm, ugly, and very hard to cut through. Two out of three is excellent.' },
  { id: 'hi-vis-vest', name: 'Hi-Vis Vest', kind: 'armor', power: 3, price: 40, inShop: true, blurb: 'Makes you easy to see. That used to be the point.' },
  { id: 'welding-apron', name: 'Welding Apron', kind: 'armor', power: 4, price: 70, inShop: true, blurb: 'Leather, scorched in the shape of old sparks. Fire has tried you before and lost.' },
  { id: 'riot-vest', name: 'Riot Vest', kind: 'armor', power: 5, price: 90, inShop: true, blurb: "Somebody's name is written inside the collar in marker. It has been scratched out, carefully." },
  { id: 'stage-armor', name: 'Stage Armor', kind: 'armor', power: 7, price: 300, inShop: false, blurb: 'Painted to look like steel, and somehow it is steel now. The Bowl takes its costumes seriously.' },
  // Consumables
  { id: 'painkillers', name: 'Painkillers', kind: 'consumable', power: 0, price: 6, inShop: true, effect: { heal: 15 }, blurb: 'Take two. Ignore the expiry date. Ignore everything, briefly.' },
  { id: 'energy-drink', name: 'Energy Drink', kind: 'consumable', power: 0, price: 12, inShop: true, effect: { heal: 20 }, blurb: 'Tastes like a battery that went to art school.' },
  { id: 'bandage', name: 'Bandage', kind: 'consumable', power: 0, price: 10, inShop: true, effect: { heal: 25 }, blurb: `Clean, white, and the most beautiful thing in ${CITY} when you need one.` },
  { id: 'med-kit', name: 'Med Kit', kind: 'consumable', power: 0, price: 30, inShop: true, effect: { heal: 50 }, blurb: 'A red cross on a white box. The oldest promise anyone still keeps.' },
  { id: 'flare', name: 'Road Flare', kind: 'consumable', power: 0, price: 18, inShop: true, effect: { damage: 20 }, blurb: 'Red light, hot smoke, a hiss like an argument. Most things back away from it.' },
  { id: 'pepper-spray', name: 'Pepper Spray', kind: 'consumable', power: 0, price: 22, inShop: true, effect: { damage: 25 }, blurb: 'Point away from face. Read the label. The label is mostly screaming.' },
  { id: 'firecracker-string', name: 'Firecracker String', kind: 'consumable', power: 0, price: 28, inShop: true, effect: { damage: 30 }, blurb: 'Twenty small bangs that sound, for a moment, like a party.' },
  // Rare
  {
    id: 'mirror-shard', name: 'Humming Mirror Shard', kind: 'rare', power: 0, price: 120, inShop: false,
    blurb: 'A sliver of window that hums one low note, always the same. Somewhere, a lot of glass is humming back.',
  },
  {
    id: 'ink-stained-crown', name: 'Ink-Stained Crown', kind: 'rare', power: 0, price: 260, inShop: false, effect: { statPoint: 1 },
    blurb: 'Paper and wire, stained with ink that has never dried. Wear it once and a line of you is rewritten, for good.',
  },
  {
    id: 'bell-fragment', name: 'Bell Fragment', kind: 'rare', power: 0, price: 240, inShop: false, effect: { damage: 40, stun: true },
    blurb: 'A shard of bronze that still remembers its note. Strike it once and the air breaks along the line of the sound. Whatever hears it forgets, for a moment, what it was doing.',
  },
  {
    id: 'salt-pearl', name: 'Salt Pearl', kind: 'rare', power: 0, price: 280, inShop: false, effect: { escape: true },
    blurb: 'Found on the seat of a train that should not have been running. Crush it and the tide comes in between you and whatever was chasing you. It will not come for a fight the system arranged.',
  },
  {
    id: 'golden-tooth', name: 'Golden Tooth', kind: 'rare', power: 0, price: 600, inShop: false, passive: { coinPercent: 20 },
    blurb: 'The Ledger\'s, supposedly. Keep it in your pocket and coins start finding their way to you. The bill comes later.',
  },
  {
    id: 'encore-ticket', name: 'Encore Ticket', kind: 'rare', power: 0, price: 400, inShop: false, effect: { fullHeal: true },
    blurb: 'Admit one. Again. The stub has your name on it, in handwriting you almost recognize.',
  },
]
