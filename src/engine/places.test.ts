import { content } from '../data'
import { travel } from './actions'
import { createRng } from './rng'
import { capitalize, zoneRef } from './places'
import { at, baseState, inRest } from '../test/fixtures'

test('zones are named with "the" only where English wants it', () => {
  expect(zoneRef(content, 'old-market')).toBe('the Old Market')
  expect(zoneRef(content, 'riverside-park')).toBe('Riverside Park')
  expect(zoneRef(content, 'university-hill')).toBe('University Hill')
  expect(zoneRef(content, 'clocktower-square')).toBe('Clocktower Square')
  expect(zoneRef(content, 'the-bowl')).toBe('the Bowl')
  expect(capitalize(zoneRef(content, 'the-bowl'))).toBe('The Bowl')
})

test('travel reads naturally', () => {
  const r = travel(at(inRest(baseState(), 99), 'old-market'), 'riverside-park', createRng(1), content)
  expect(r.events[0].text).toBe('You leave the Old Market for Riverside Park.')
})
