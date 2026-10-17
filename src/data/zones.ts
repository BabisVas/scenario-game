import type { ZoneDef } from './schema'

// The city. Each connection is one move (1 hour, 5 energy) and goes both ways.
// The Subway Tunnels touch four zones: the fast way everywhere, and the most dangerous road.
export const zones: ZoneDef[] = [
  {
    id: 'old-market',
    name: 'Old Market',
    blurb:
      'Tarps, stalls and a thousand places to hide. Half the vendors are still open, out of pure stubbornness. One stall near the fountain has a blanket nobody owns. It is always warm.',
    danger: 1,
    actions: ['scavenge', 'explore', 'rest', 'talk', 'trade', 'hunt'],
    enemyIds: ['rat-swarm', 'feral-hound'],
    connections: ['riverside-park', 'glass-towers', 'subway-tunnels'],
  },
  {
    id: 'riverside-park',
    name: 'Riverside Park',
    blurb:
      'Open lawns, a frozen fountain, and something long moving under the river ice. The ducks left on the first morning and did not say where.',
    danger: 2,
    actions: ['train', 'rest', 'explore', 'scavenge', 'hunt', 'talk'],
    enemyIds: ['feral-hound', 'iron-boar'],
    connections: ['old-market', 'university-hill', 'harbor-cranes'],
    finds: [{ itemId: 'mirror-shard', chance: 0.08 }],
  },
  {
    id: 'glass-towers',
    name: 'Glass Towers',
    blurb: 'The office district. Every window reflects you a little late. On every floor, in every tower, exactly one pane is missing.',
    danger: 2,
    actions: ['scavenge', 'explore', 'hunt', 'talk', 'trade'],
    enemyIds: ['glass-wraith', 'rooftop-harpy'],
    connections: ['old-market', 'clocktower-square', 'subway-tunnels'],
  },
  {
    id: 'university-hill',
    name: 'University Hill',
    blurb: 'Lecture halls with the lights still on and no one in them. A sign on the library gate says Returns accepted at all hours.',
    danger: 2,
    actions: ['explore', 'train', 'rest', 'scavenge', 'hunt', 'talk'],
    enemyIds: ['ink-wisp', 'paper-golem'],
    connections: ['riverside-park', 'clocktower-square'],
    startsSealed: true,
  },
  {
    id: 'clocktower-square',
    name: 'Clocktower Square',
    blurb:
      'Cobbles, pigeons, and a clock that is right twice a day, though not the same two times as yesterday. Someone has chalked four small marks by the clock-keeper\'s door.',
    danger: 3,
    actions: ['explore', 'rest', 'scavenge', 'hunt', 'talk', 'trade'],
    enemyIds: ['bell-gargoyle', 'clockwork-hound'],
    connections: ['glass-towers', 'university-hill', 'the-bowl'],
  },
  {
    id: 'harbor-cranes',
    name: 'Harbor Cranes',
    blurb: 'Rusted giants over black water. The cranes creak in a rhythm, like breathing, if breathing were slow and made of iron.',
    danger: 3,
    actions: ['scavenge', 'explore', 'hunt', 'talk', 'trade'],
    enemyIds: ['crane-crab', 'salt-eel'],
    connections: ['riverside-park', 'subway-tunnels'],
  },
  {
    id: 'the-bowl',
    name: 'The Bowl',
    blurb: 'The old stadium. The scoreboard has been counting something since the sirens. It is not a score.',
    danger: 4,
    actions: ['explore', 'train', 'hunt'],
    enemyIds: ['arena-gladiator'],
    connections: ['clocktower-square', 'subway-tunnels'],
    startsSealed: true,
  },
  {
    id: 'subway-tunnels',
    name: 'Subway Tunnels',
    blurb: 'The trains stopped. The tunnels did not stay empty. The departure board on the main platform still updates, though it only ever shows one train.',
    danger: 3,
    actions: ['scavenge', 'explore', 'hunt'],
    enemyIds: ['tunnel-crawler', 'rat-swarm'],
    connections: ['old-market', 'glass-towers', 'harbor-cranes', 'the-bowl'],
    finds: [{ itemId: 'mirror-shard', chance: 0.08 }],
  },
]
