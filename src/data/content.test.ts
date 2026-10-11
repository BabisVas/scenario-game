import { content } from './index'
import { validateContent } from './validate'
import type { ScenarioDef } from './schema'

test('shipped content is valid', () => {
  expect(validateContent(content)).toEqual([]);
});
test('dangling enemy reference is reported', () => {
  const bad = { ...content, zones: [{ ...content.zones[0], enemyIds: ['nope'] }] };
  expect(validateContent(bad)).toContainEqual(expect.stringContaining('nope'));
});
test('choice without a target-free fallback is reported', () => {
  const s = { ...content.scenarios[0], goal: { kind: 'choice', prompt: 'p', fallbackOptionId: 'a',
    options: [{ id: 'a', label: 'A', tags: [], target: 'met-survivor', outcome: { kill: true } }] } } as ScenarioDef;
  expect(validateContent({ ...content, scenarios: [s] })).toContainEqual(expect.stringContaining('fallback'));
});
test('a fallback id that is not one of the options is reported', () => {
  const s = { ...content.scenarios[0], goal: { kind: 'choice', prompt: 'p', fallbackOptionId: 'zzz',
    options: [{ id: 'a', label: 'A', tags: [], outcome: {} }] } } as ScenarioDef;
  expect(validateContent({ ...content, scenarios: [s] })).toContainEqual(expect.stringContaining('zzz'));
});
test('duplicate ids are reported', () => {
  const bad = { ...content, items: [...content.items, content.items[0]] };
  expect(validateContent(bad)).toContainEqual(expect.stringContaining(content.items[0].id));
});
test('a gap in scenario numbers is reported', () => {
  const bad = { ...content, scenarios: [{ ...content.scenarios[0], number: 2 }] };
  expect(validateContent(bad)).toContainEqual(expect.stringMatching(/number/i));
});
test('a zone with no actions is reported', () => {
  const bad = { ...content, zones: [{ ...content.zones[0], actions: [] }, ...content.zones.slice(1)] };
  expect(validateContent(bad)).toContainEqual(expect.stringContaining(content.zones[0].id));
});
test.each([
  ['a starting item', (c: typeof content) => ({ ...c, backgrounds: [{ ...c.backgrounds[0], startingItemId: 'ghost-item' }] })],
  ['an enemy drop', (c: typeof content) => ({ ...c, enemies: [{ ...c.enemies[0], drops: [{ itemId: 'ghost-item', chance: 1 }] }, ...c.enemies.slice(1)] })],
  ['a reward skill', (c: typeof content) => ({ ...c, scenarios: [{ ...c.scenarios[0], rewards: { coins: 1, skillId: 'ghost-item' } }] })],
  ['a contract gift', (c: typeof content) => ({ ...c, constellations: [{ ...c.constellations[0], contract: { ...c.constellations[0].contract, giftSkillId: 'ghost-item' } }] })],
  ['a reach zone', (c: typeof content) => ({ ...c, scenarios: [{ ...c.scenarios[0], goal: { kind: 'reach', zoneId: 'ghost-item' } } as ScenarioDef] })],
  ['a choice fight', (c: typeof content) => ({ ...c, scenarios: [{ ...c.scenarios[0], goal: { kind: 'choice', prompt: 'p', fallbackOptionId: 'a', options: [{ id: 'a', label: 'A', tags: [], outcome: { fight: 'ghost-item' } }] } } as ScenarioDef] })],
])('a dangling reference in %s is reported', (_, make) => {
  expect(validateContent(make(content))).toContainEqual(expect.stringContaining('ghost-item'));
});
test('borrowed names are reported', () => {
  const bad = { ...content, zones: [{ ...content.zones[0], blurb: 'Where Kim Dokja once stood.' }, ...content.zones.slice(1)] };
  expect(validateContent(bad)).toContainEqual(expect.stringMatching(/dokja/i));
});
test('ids must be kebab-case', () => {
  const bad = { ...content, skills: [...content.skills, { ...content.skills[0], id: 'Bad_Id' }] };
  expect(validateContent(bad)).toContainEqual(expect.stringContaining('Bad_Id'));
});
test('an attribute weighted for an unknown background is reported', () => {
  const bad = { ...content, attributes: [{ ...content.attributes[0], backgroundWeights: { 'ghost-job': 2 } }] };
  expect(validateContent(bad)).toContainEqual(expect.stringContaining('ghost-job'));
});
