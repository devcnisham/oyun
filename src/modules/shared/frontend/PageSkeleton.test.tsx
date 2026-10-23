import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import PageSkeleton from '@/modules/shared/frontend/PageSkeleton';

describe('PageSkeleton', () => {
  test('announces itself as a busy status for screen readers', () => {
    const html = renderToStaticMarkup(<PageSkeleton />);
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('Loading…');
  });

  test('the cards variant draws six cards and the rows variant six rows', () => {
    const blocks = (html: string) => (html.match(/class="[^"]*block[^"]*"/g) ?? []).length;
    expect(blocks(renderToStaticMarkup(<PageSkeleton variant="cards" />))).toBe(3 + 6);
    expect(blocks(renderToStaticMarkup(<PageSkeleton variant="rows" />))).toBe(3 + 6);
  });
});
