import { describe, expect, test } from 'vitest';
import { clusterPins } from './map-cluster';

const p = (id: string, x: number, y: number) => ({ id, x, y });

describe('clusterPins', () => {
  test('no pins, no clusters', () => {
    expect(clusterPins([], 100, 40)).toEqual([]);
  });

  test('pins far apart stay on their own', () => {
    const out = clusterPins([p('a', 0, 0), p('b', 500, 0), p('c', 0, 300)], 100, 40);
    expect(out.map((c) => c.ids)).toEqual([['a'], ['c'], ['b']]);
  });

  test('pins whose boxes overlap become one cluster at their average position', () => {
    const [c] = clusterPins([p('a', 0, 0), p('b', 60, 10)], 100, 40);
    expect(c).toEqual({ ids: ['a', 'b'], x: 30, y: 5 });
  });

  test('close in one direction only is not enough', () => {
    expect(clusterPins([p('a', 0, 0), p('b', 10, 80)], 100, 40)).toHaveLength(2);
    expect(clusterPins([p('a', 0, 0), p('b', 150, 5)], 100, 40)).toHaveLength(2);
  });

  test('pins at the very same spot always cluster', () => {
    expect(clusterPins([p('a', 5, 5), p('b', 5, 5), p('c', 5, 5)], 1, 1)[0].ids).toEqual(['a', 'b', 'c']);
  });

  test('every pin ends up in exactly one cluster', () => {
    const points = Array.from({ length: 30 }, (_, i) => p(`t${i}`, (i * 37) % 400, (i * 53) % 300));
    const ids = clusterPins(points, 120, 44).flatMap((c) => c.ids).sort();
    expect(ids).toEqual(points.map((q) => q.id).sort());
  });

  test('the result does not depend on the order the pins come in', () => {
    const points = [p('a', 0, 0), p('b', 50, 5), p('c', 400, 400), p('d', 430, 410)];
    expect(clusterPins([...points].reverse(), 100, 40)).toEqual(clusterPins(points, 100, 40));
  });
});
