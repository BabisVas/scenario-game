import { ANNOUNCER } from '../data/names'
import { doAction } from './actions'
import { fightTurn } from './combat'
import { checkHiddenTriggers } from './hidden'
import { checkScenarioClock, spendHours, startScenario } from './scenario'
import { createRng } from './rng'
import {
  at, baseState, brutalEnemy, clearHiddenDefs, fixtureContent as content, hiddenDef, inFight, inRest, inScenario, killDef,
  makeSurvivor, protectDef, seqRng, surviveDef,
} from '../test/fixtures'

describe('a main scenario opens with its notice, then the announcer, then narration', () => {
  test('in that order, as three lines', () => {
    const def = { ...surviveDef({ hours: 6 }), announcement: '[FX notice]', announcer: 'FX-ANNOUNCER line.', narration: 'FX-NARRATION line.' }
    const texts = startScenario(baseState(), def, createRng(1), content).events.map((e) => e.text)
    const notice = texts.indexOf('[FX notice]')
    expect(notice).toBeGreaterThanOrEqual(0)
    expect(texts[notice + 1]).toBe(`${ANNOUNCER}: "FX-ANNOUNCER line."`)
    expect(texts[notice + 2]).toBe('FX-NARRATION line.')
  })
})

describe('causes of death are written as the record states them', () => {
  test('a fight', () => {
    const s = inFight({ ...baseState(), player: { ...baseState().player, hp: 1 } }, brutalEnemy())
    const r = fightTurn(s, { kind: 'attack' }, createRng(9), content)
    expect(r.state.phase).toEqual({ kind: 'dead', cause: 'Test Titan, round 1.' })
  })
  test('a scenario whose clock ran out', () => {
    const def = killDef({ hours: 2, count: 9 })
    const r = checkScenarioClock(spendHours(inScenario(baseState(), def), 2), createRng(1), content)
    expect(r.state.phase).toEqual({ kind: 'dead', cause: `Main Scenario #${def.number}, "${def.title}". The time limit expired.` })
  })
  test('a ward who died', () => {
    const def = protectDef({ hours: 4 })
    const s = inScenario({ ...baseState(), survivors: [makeSurvivor('s-0', { name: 'Wren', alive: false })] }, def)
    const r = checkScenarioClock({ ...s, phase: { ...s.phase, protectedSurvivorId: 's-0' } as typeof s.phase }, createRng(1), content)
    expect(r.state.phase).toEqual({ kind: 'dead', cause: 'Wren did not survive. Neither did you.' })
  })
})

describe('sub-scenario and hidden-scenario notices', () => {
  beforeEach(() => clearHiddenDefs())
  test('an offered sub-scenario is announced in brackets with objective, time limit, reward and failure', () => {
    const sub = content.subScenarios[0]
    // explore: 0.0 offers the sub-scenario, picks the first; 0.99 skips the fight
    const r = doAction(at(inRest(baseState(), 99), sub.zoneIds[0]), sub.zoneIds[0], 'explore', seqRng(0.0, 0.0, 0.99), content)
    const notice = r.events.find((e) => e.text.startsWith('[Sub-scenario available:'))!
    expect(notice.text).toContain(`[Sub-scenario available: ${sub.title}.]`)
    expect(notice.text).toContain(`[Time limit: ${sub.hours} hours.]`)
    expect(notice.text).toMatch(/\[Objective: .+\.\]/)
    expect(notice.text).toMatch(/\[Reward: .*\d+ coins.*\.\]/)
    expect(notice.text).toContain('[Failure: The reward is withdrawn. Participation is optional. Participation is appreciated.]')
  })
  test('a discovered hidden scenario is announced in brackets', () => {
    hiddenDef('fx-quiet', { kind: 'repeat-action', zoneId: 'old-market', action: 'rest', count: 1 }, { title: 'Fx Quiet' })
    const s = { ...inRest(baseState(), 99), actionCounts: { 'old-market/rest': 1 } }
    const r = checkHiddenTriggers(s, { zoneId: 'old-market', action: 'rest' }, content)
    expect(r.events[0].text).toBe('[Hidden scenario discovered: Fx Quiet.]')
  })
})
