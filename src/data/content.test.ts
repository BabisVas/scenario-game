import { content } from './index'
import { validateContent } from './validate'
import type { HiddenScenarioDef, ScenarioDef } from './schema'

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
  ['a contract stigma', (c: typeof content) => ({ ...c, constellations: [{ ...c.constellations[0], contract: { ...c.constellations[0].contract, stigmaId: 'ghost-item' } }] })],
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
test.each([
  ['an unknown zone', { kind: 'repeat-action', zoneId: 'ghost-zone', action: 'rest', count: 2 }, 'ghost-zone'],
  ['an unknown item', { kind: 'carry-item', itemId: 'ghost-item', zoneId: 'old-market' }, 'ghost-item'],
  ['an unknown scenario number', { kind: 'zone-during-scenario', zoneId: 'old-market', scenarioNumber: 99 }, '99'],
  ['an unknown scenario', { kind: 'choose-option', scenarioId: 'ghost-scenario', optionId: 'a' }, 'ghost-scenario'],
  ['an option the scenario does not have', { kind: 'choose-option', scenarioId: 's01', optionId: 'ghost-option' }, 'ghost-option'],
] as const)('a hidden trigger pointing at %s is reported', (_, trigger, needle) => {
  const def = { id: 'hidden-x', title: 'X', announcement: 'x', trigger, goal: { kind: 'survive' }, hours: 4, rewards: { coins: 1 }, rumor: 'r' } as HiddenScenarioDef;
  expect(validateContent({ ...content, hiddenScenarios: [def] })).toContainEqual(expect.stringContaining(needle));
});
test('a Final Wave naming an unknown enemy is reported', () => {
  const bad = { ...content, scenarios: [{ ...content.scenarios[0], finalWave: 'ghost-enemy' }] };
  expect(validateContent(bad)).toContainEqual(expect.stringContaining('ghost-enemy'));
});
describe('choice outcomes the engine cannot run are rejected', () => {
  const withOption = (option: object) => ({
    ...content,
    scenarios: [{ ...content.scenarios[0], goal: { kind: 'choice', prompt: 'p', fallbackOptionId: 'ok',
      options: [{ id: 'ok', label: 'OK', tags: [], outcome: {} }, { id: 'odd', label: 'Odd', tags: [], ...option }] } } as ScenarioDef],
  });
  test.each([
    ['an unknown outcome field', { outcome: { teleport: true } }, 'teleport'],
    ['kill without a target', { outcome: { kill: true } }, 'kill'],
    ['a negative spare count', { outcome: { spareCount: -1 } }, 'spareCount'],
    ['a fractional spare count', { outcome: { spareCount: 1.5 } }, 'spareCount'],
    ['a spare count with a target', { target: 'met-survivor', outcome: { spareCount: 1, kill: true } }, 'spareCount'],
    ['a city attitude out of range', { outcome: { cityAttitude: -500 } }, 'cityAttitude'],
    ['an empty announcement', { outcome: { announce: '' } }, 'announce'],
  ])('%s', (_, option, needle) => {
    expect(validateContent(withOption(option))).toContainEqual(expect.stringContaining(needle));
  });
  test('every outcome the engine can run passes', () => {
    expect(validateContent(withOption({ target: 'met-survivor', outcome: { kill: true, coins: 5 } }))).toEqual([]);
    expect(validateContent(withOption({ outcome: { spareCount: 0, cityAttitude: -25, announce: 'x', coins: 150 } }))).toEqual([]);
  });
});
