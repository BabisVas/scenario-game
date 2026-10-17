import { content } from '../data'
import type { HiddenScenarioDef } from '../data/schema'
import { goalText, hiddenGoalText } from './format'
import { baseState } from '../test/fixtures'

const def = (goal: HiddenScenarioDef['goal']): HiddenScenarioDef => ({
  id: 'fx', title: 'Fx', announcement: 'a', trigger: { kind: 'meet-survivor', count: 9 }, goal, hours: 4, rewards: { coins: 1 }, rumor: 'r',
})

test('a hidden survive goal with a zone says where to be when the clock runs out', () => {
  expect(hiddenGoalText(def({ kind: 'survive', zoneId: 'subway-tunnels' }), 0, content)).toMatch(/be in the subway tunnels when its clock runs out/i)
  expect(hiddenGoalText(def({ kind: 'survive' }), 0, content)).toMatch(/stay alive until its clock runs out/i)
})

test('kill goals read naturally, with or without a kind of enemy', () => {
  expect(hiddenGoalText(def({ kind: 'kill', count: 3, enemyTag: 'spirit' }), 1, content)).toBe('Kill 3 spirits (1/3)')
  expect(hiddenGoalText(def({ kind: 'kill', count: 1, enemyTag: 'spirit' }), 0, content)).toBe('Kill 1 spirit (0/1)')
  expect(hiddenGoalText(def({ kind: 'kill', count: 2 }), 0, content)).toBe('Kill 2 enemies (0/2)')
  const s02 = content.scenarios.find((s) => s.id === 's02')!
  expect(goalText(s02, baseState(), content)).toBe('Kill 5 beasts (0/5).')
})
