import type { ZoneDef } from './schema'

export const zones: ZoneDef[] = [
  {
    id: 'old-market',
    name: 'Old Market',
    blurb: 'Tarps, stalls and a thousand places to hide. Half the vendors are still open, out of pure stubbornness.',
    danger: 1,
    actions: ['scavenge', 'explore', 'rest', 'talk', 'trade', 'hunt'],
    enemyIds: ['rat-swarm', 'feral-hound'],
    connections: ['riverside-park', 'glass-towers', 'subway-tunnels'],
  },
  {
    id: 'riverside-park',
    name: 'Riverside Park',
    blurb: 'Open lawns, a frozen fountain and something big moving under the river ice.',
    danger: 2,
    actions: ['train', 'rest', 'explore', 'hunt', 'talk'],
    enemyIds: ['feral-hound', 'iron-boar'],
    connections: ['old-market', 'subway-tunnels'],
  },
  {
    id: 'glass-towers',
    name: 'Glass Towers',
    blurb: 'The office district. Every window reflects you a little late.',
    danger: 2,
    actions: ['scavenge', 'explore', 'hunt', 'talk', 'trade'],
    enemyIds: ['glass-wraith', 'rooftop-harpy'],
    connections: ['old-market', 'subway-tunnels'],
  },
  {
    id: 'subway-tunnels',
    name: 'Subway Tunnels',
    blurb: 'The trains stopped. The tunnels did not stay empty.',
    danger: 3,
    actions: ['scavenge', 'explore', 'hunt'],
    enemyIds: ['tunnel-crawler', 'rat-swarm'],
    connections: ['old-market', 'riverside-park', 'glass-towers'],
  },
]
