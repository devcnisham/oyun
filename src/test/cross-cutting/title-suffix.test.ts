// The root layout adds " | OYUN" to every title (template "%s | OYUN"), so a page must not add it again.
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

describe('page titles', () => {
  test.each(['src/app/(main)/guides/page.tsx', 'src/app/(main)/guides/[slug]/page.tsx', 'src/app/(main)/curated/[slug]/page.tsx'])('%s does not repeat the site name', (file) => {
    const titles = readFileSync(file, 'utf8').split('\n').filter((l) => /^\s*title:/.test(l));
    expect(titles.length).toBeGreaterThan(0);
    for (const l of titles) expect(l).not.toMatch(/\|\s*OYUN/);
  });
});
