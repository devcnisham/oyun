import { describe, expect, test } from 'vitest';
import { paginate } from '@/modules/shared/lib/paginate';

const rows = Array.from({ length: 25 }, (_, i) => i + 1);

describe('paginate', () => {
  test('first page by default', () => {
    const p = paginate(rows, undefined, 10);
    expect(p).toMatchObject({ page: 1, pages: 3, total: 25, from: 1, to: 10 });
    expect(p.items[0]).toBe(1);
  });
  test('last page holds the remainder', () => {
    const p = paginate(rows, '3', 10);
    expect(p.items).toEqual([21, 22, 23, 24, 25]);
    expect(p).toMatchObject({ from: 21, to: 25 });
  });
  test('out-of-range and junk page numbers are clamped', () => {
    expect(paginate(rows, '99', 10).page).toBe(3);
    expect(paginate(rows, '0', 10).page).toBe(1);
    expect(paginate(rows, '-4', 10).page).toBe(1);
    expect(paginate(rows, 'abc', 10).page).toBe(1);
  });
  test('empty list is one empty page', () => {
    expect(paginate([], '2', 10)).toMatchObject({ page: 1, pages: 1, total: 0, from: 0, to: 0, items: [] });
  });
});
