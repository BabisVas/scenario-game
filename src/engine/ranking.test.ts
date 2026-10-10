import { rankingRows } from './ranking'
import { baseStateWithSurvivors, killSurvivor } from '../test/fixtures'

test('no ranking rows before the first clear', () => {
  expect(rankingRows(baseStateWithSurvivors())).toEqual([]);
});
test('ranking lists the living before the dead', () => {
  const s = { ...killSurvivor(baseStateWithSurvivors(), 's-2'), rankingOpen: true };
  const rows = rankingRows(s);
  expect(rows.at(-1)).toMatchObject({ alive: false });
});
test('ranking orders by points within the living and within the dead, with the player included', () => {
  const s = baseStateWithSurvivors();
  const scored = {
    ...s,
    rankingOpen: true,
    player: { ...s.player, points: 15 },
    survivors: s.survivors.slice(0, 4).map((v, i) => ({ ...v, points: [5, 30, 10, 99][i], alive: i !== 3 && i !== 2 })),
  };
  expect(rankingRows(scored).map(r => [r.points, r.alive, r.isPlayer])).toEqual([
    [30, true, false], [15, true, true], [5, true, false], [99, false, false], [10, false, false],
  ]);
});
