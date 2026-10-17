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

describe('the rest of the record speaks in brackets too', () => {
  beforeEach(() => clearHiddenDefs())
  test('the attribute of the first morning', async () => {
    const { newGame } = await import('./newGame')
    const { onlyAttribute, attributeDef } = await import('../test/fixtures')
    const def = attributeDef({ kind: 'coins', percent: 10 }, { name: 'Fx Luck', blurb: 'FX-BLURB.' })
    const s = newGame({ name: 'Ari', backgroundId: 'courier', seed: 1, now: 0 }, onlyAttribute(def))
    expect(s.log[0].text).toBe('[Attribute assigned: Fx Luck (common).]\nFX-BLURB.')
  })
  test('a cleared main scenario lists its rewards, counting repeats', async () => {
    const { clearScenario } = await import('./scenario')
    const def = { ...surviveDef({ hours: 2 }), rewards: { coins: 50, itemIds: ['bandage', 'bandage'] } }
    content.scenarios[content.scenarios.findIndex((d) => d.id === def.id)] = def
    const r = clearScenario(inScenario(baseState(), def), createRng(1), content)
    expect(r.events[0].text).toBe(`[Main Scenario #${def.number} cleared: ${def.title}.] [Rewards: 50 coins. Bandage ×2.]`)
  })
  test('a hidden scenario that runs out says the reward is withdrawn', () => {
    hiddenDef('fx-late', { kind: 'repeat-action', zoneId: 'old-market', action: 'rest', count: 1 }, { title: 'Fx Late', goal: { kind: 'kill', count: 9 } })
    const s = { ...inRest(baseState(), 99), hiddenScenario: { defId: 'fx-late', hoursLeft: 0, progress: 0 }, foundHiddenIds: ['fx-late'] }
    expect(checkScenarioClock(s, createRng(1), content).events[0].text).toBe('[Hidden scenario failed: Fx Late. The reward is withdrawn.]')
  })
  test('a cleared hidden scenario lists its rewards', () => {
    hiddenDef('fx-won', { kind: 'repeat-action', zoneId: 'old-market', action: 'rest', count: 1 }, { title: 'Fx Won', goal: { kind: 'kill', count: 1 } })
    const s = { ...inRest(baseState(), 99), hiddenScenario: { defId: 'fx-won', hoursLeft: 3, progress: 1 }, foundHiddenIds: ['fx-won'] }
    expect(checkScenarioClock(s, createRng(1), content).events[0].text).toBe('[Hidden scenario cleared: Fx Won.] [Rewards: 100 coins.]')
  })
  test('sub-scenarios clear and fail in brackets', () => {
    const sub = content.subScenarios[0]
    const won = { ...inRest(baseState(), 99), subScenario: { defId: sub.id, hoursLeft: 3, progress: 99 } }
    expect(checkScenarioClock(won, createRng(1), content).events[0].text.startsWith(`[Sub-scenario cleared: ${sub.title}.] [Rewards: ${sub.rewards.coins} coins`)).toBe(true)
    const lost = { ...inRest(baseState(), 99), subScenario: { defId: sub.id, hoursLeft: 0, progress: 0 } }
    expect(checkScenarioClock(lost, createRng(1), content).events[0].text).toBe(`[Sub-scenario failed: ${sub.title}. The reward is withdrawn.]`)
  })
  test('a stigma is granted, and sealed, in the record', async () => {
    const { resolveContract, onScenarioCleared } = await import('./constellations')
    const c = content.constellations[0]
    const stigma = content.stigmas.find((x) => x.id === c.contract.stigmaId)!
    const offered = { ...baseState(), pendingChoice: { source: 'contract' as const, constellationId: c.id }, constellations: { ...baseState().constellations, [c.id]: { interest: 70, contract: 'offered' as const, demandMetThisScenario: false } } }
    const signed = resolveContract(offered, true, content)
    expect(signed.events.map((e) => e.text)).toContain(`[Stigma granted: ${stigma.name}. Lent by «${c.title}». Terms apply.]`)
    const broken = onScenarioCleared(signed.state, content)
    expect(broken.events.map((e) => e.text)).toContain(`[Stigma sealed: ${stigma.name}. The lender is displeased.]`)
  })
})

test('a skill levelling up is a bracketed notice', async () => {
  const { recordSkillUse } = await import('./growth')
  const { withSkill } = await import('../test/fixtures')
  let s = withSkill(baseState(), 'quick-strike')
  let last = recordSkillUse(s, 'quick-strike')
  for (let i = 0; i < 4; i++) { s = last.state; last = recordSkillUse(s, 'quick-strike') }
  expect(last.events[0].text).toBe('[Skill level up: Quick Strike, level 2.]')
})
test('explore flavor and world rumors come from the content', async () => {
  const flavor = { ...content, flavor: { explore: ['FX-EXPLORE'], rumors: ['FX-RUMOR in {zone}.'] } }
  const r = doAction(at(inRest(baseState(), 99), 'old-market'), 'old-market', 'explore', seqRng(0.99), flavor)
  expect(r.events.some((e) => e.text === 'FX-EXPLORE')).toBe(true)
})

test('after death, the constellations only say farewell', () => {
  // Winning a stylish fight as the clock runs out: the win's tags arrive after the death.
  const def = killDef({ hours: 1, count: 9 })
  const watched = { ...baseState(), constellations: { ...baseState().constellations, [content.constellations[0].id]: { interest: 30, contract: 'none' as const, demandMetThisScenario: false } } }
  const base = inScenario(watched, def)
  const s = inFight({ ...base, phase: { ...base.phase, hoursLeft: 0 } as typeof base.phase }, { ...brutalEnemy(), hp: 1, maxHp: 1 })
  let checked = 0
  for (let seed = 1; seed <= 40; seed++) {
    const r = fightTurn(s, { kind: 'attack' }, createRng(seed), content)
    expect(r.state.phase.kind).toBe('dead')
    const after = r.events.slice(r.events.findIndex((e) => e.text.startsWith('You died')) + 1)
    for (const e of after) { checked++; expect(e.text).toMatch(/watches you fall/) }
  }
  expect(checked).toBeGreaterThan(0)
})
