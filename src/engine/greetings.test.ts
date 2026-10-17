import { validateContent } from '../data/validate'
import type { Content } from '../data/schema'
import { attitudeBand, meetSurvivor } from './survivors'
import { baseState, fixtureContent, makeSurvivor, seqRng } from '../test/fixtures'
import type { GameState, Survivor } from './types'

const PERSONALITIES = ['brave', 'cautious', 'ruthless', 'kind', 'schemer'] as const
const BANDS = ['hostile', 'wary', 'neutral', 'friendly'] as const

/** Every line names its personality, band and index, so a test can tell exactly which was used. */
const marked: Content = {
  ...fixtureContent,
  greetings: Object.fromEntries(
    PERSONALITIES.map((p) => [p, Object.fromEntries(BANDS.map((b) => [b, [0, 1, 2].map((i) => `{name} ${p}/${b}/${i}`)]))]),
  ) as Content['greetings'],
}

const alone = (v: Survivor): GameState => ({ ...baseState(), zoneId: 'old-market', survivors: [v] })
// 0.9 keeps a hostile survivor from attacking, so only the greeting is under test.
const greet = (s: GameState) => meetSurvivor(s, 'old-market', seqRng(0.9), marked)

test.each([
  [-80, 'hostile'],
  [-50, 'hostile'],
  [-49, 'wary'],
  [-1, 'wary'],
  [0, 'neutral'],
  [49, 'neutral'],
  [50, 'friendly'],
  [100, 'friendly'],
])('attitude %i is %s', (attitude, band) => {
  expect(attitudeBand(attitude)).toBe(band)
})

test("a greeting comes from the survivor's personality and band, with their name in it", () => {
  const r = greet(alone(makeSurvivor('s-0', { name: 'Wren', personality: 'ruthless', attitude: -20, met: true })))
  expect(r.events[0].text).toMatch(/^Wren ruthless\/wary\/\d$/)
})

test('meeting the same person again never repeats the line just heard', () => {
  let s = alone(makeSurvivor('s-0', { name: 'Wren', personality: 'kind', attitude: 10 }))
  const heard: string[] = []
  for (let i = 0; i < 6; i++) {
    const r = greet(s)
    heard.push(r.events[0].text)
    s = r.state
  }
  for (let i = 1; i < heard.length; i++) expect(heard[i]).not.toBe(heard[i - 1])
  expect(new Set(heard).size).toBe(3)
})

describe('greetings content', () => {
  test('the shipped greetings are valid', () => {
    expect(validateContent(fixtureContent).filter((p) => p.startsWith('greetings'))).toEqual([])
  })
  test('a band with fewer than 3 lines is reported', () => {
    const bad = { ...marked, greetings: { ...marked.greetings, brave: { ...marked.greetings.brave, wary: ['{name} only'] } } }
    expect(validateContent(bad)).toContainEqual(expect.stringContaining('greetings brave/wary'))
  })
  test("a line without the survivor's name is reported", () => {
    const bad = { ...marked, greetings: { ...marked.greetings, kind: { ...marked.greetings.kind, friendly: ['a', '{name} b', '{name} c'] } } }
    expect(validateContent(bad)).toContainEqual(expect.stringContaining('{name}'))
  })
})
