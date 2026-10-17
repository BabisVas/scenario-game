import { content } from '../data'
import type { HiddenScenarioDef } from '../data/schema'
import { hiddenGoalText } from './format'

const def = (goal: HiddenScenarioDef['goal']): HiddenScenarioDef => ({
  id: 'fx', title: 'Fx', announcement: 'a', trigger: { kind: 'meet-survivor', count: 9 }, goal, hours: 4, rewards: { coins: 1 }, rumor: 'r',
})

test('a hidden survive goal with a zone says where to be when the clock runs out', () => {
  expect(hiddenGoalText(def({ kind: 'survive', zoneId: 'subway-tunnels' }), 0, content)).toMatch(/be in the subway tunnels when its clock runs out/i)
  expect(hiddenGoalText(def({ kind: 'survive' }), 0, content)).toMatch(/stay alive until its clock runs out/i)
})
