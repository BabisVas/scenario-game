import { createRng } from './rng'

test('same seed gives same sequence', () => {
  const a = createRng(42), b = createRng(42);
  expect([a.next(), a.next(), a.int(1, 6)]).toEqual([b.next(), b.next(), b.int(1, 6)]);
});
test('getState resumes the sequence', () => {
  const a = createRng(7); a.next();
  const b = createRng(a.getState());
  expect(b.next()).toBe(a.next());
});
test('int is inclusive and in range', () => {
  const r = createRng(1);
  for (let i = 0; i < 1000; i++) { const v = r.int(2, 4); expect(v >= 2 && v <= 4).toBe(true); }
});
test('int reaches both ends of its range', () => {
  const r = createRng(5);
  const seen = new Set<number>();
  for (let i = 0; i < 1000; i++) seen.add(r.int(2, 4));
  expect([...seen].sort()).toEqual([2, 3, 4]);
});
test('different seeds give different sequences', () => {
  expect(createRng(1).next()).not.toBe(createRng(2).next());
});
