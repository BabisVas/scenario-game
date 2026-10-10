// Seeded random numbers (mulberry32). The engine never calls Math.random().

export type Rng = {
  next(): number
  int(min: number, max: number): number
  chance(p: number): boolean
  pick<T>(arr: readonly T[]): T
  getState(): number
}

export function createRng(state: number): Rng {
  let s = state >>> 0
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    chance: (p) => next() < p,
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    getState: () => s,
  }
}
