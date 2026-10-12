export interface Page<T> {
  items: T[];
  page: number; // 1-based, clamped into range
  pages: number;
  total: number;
  from: number; // 1-based index of the first shown row, 0 when empty
  to: number;
}

// Server-side paging for dashboard lists. `raw` is the ?page= query value.
export function paginate<T>(list: T[], raw: string | undefined, size: number): Page<T> {
  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / size));
  const asked = Number.parseInt(raw ?? '1', 10);
  const page = Math.min(pages, Math.max(1, Number.isFinite(asked) ? asked : 1));
  const start = (page - 1) * size;
  const items = list.slice(start, start + size);
  return { items, page, pages, total, from: items.length ? start + 1 : 0, to: start + items.length };
}
