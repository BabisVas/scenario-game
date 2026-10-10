import { buyStat, recordSkillUse, statCost } from './growth'
import { baseState, withCoins, withSkill } from '../test/fixtures'

test('stat cost rises each point', () => {
  expect([statCost(5), statCost(6), statCost(9)]).toEqual([10, 20, 50]);
});
test('cannot buy a stat without coins', () => {
  const s = withCoins(baseState(), 5);
  const r = buyStat(s, 'strength');
  expect(r.state.player.stats.strength).toBe(5);
  expect(r.events[0].text).toMatch(/not enough coins/i);
});
test('buying a stat spends its cost and raises it by one', () => {
  const r = buyStat(withCoins(baseState(), 25), 'strength');
  expect(r.state.player.stats.strength).toBe(6);
  expect(r.state.player.coins).toBe(15);
});
test('buying endurance raises current hp by 10', () => {
  const s = withCoins({ ...baseState(), player: { ...baseState().player, hp: 40 } }, 100);
  expect(buyStat(s, 'endurance').state.player.hp).toBe(50);
});
test('skill levels up after 5 uses at level 1', () => {
  let s = withSkill(baseState(), 'quick-strike');
  for (let i = 0; i < 5; i++) s = recordSkillUse(s, 'quick-strike').state;
  expect(s.player.skills[0]).toMatchObject({ level: 2, uses: 0 });
});
test('a level 2 skill needs 10 uses, and only the level-up use emits an event', () => {
  let s = withSkill(baseState(), 'quick-strike', 2);
  const events = [];
  for (let i = 0; i < 9; i++) { const r = recordSkillUse(s, 'quick-strike'); s = r.state; events.push(...r.events); }
  expect(s.player.skills[0]).toMatchObject({ level: 2, uses: 9 });
  expect(events).toEqual([]);
  const r = recordSkillUse(s, 'quick-strike');
  expect(r.state.player.skills[0]).toMatchObject({ level: 3, uses: 0 });
  expect(r.events).toHaveLength(1);
});
test('using a skill the player does not own changes nothing', () => {
  const s = baseState();
  expect(recordSkillUse(s, 'quick-strike').state).toEqual(s);
});
