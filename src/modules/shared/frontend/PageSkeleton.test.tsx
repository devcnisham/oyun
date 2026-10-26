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

  test('card placeholders include an image, title and action rather than a featureless block', () => {
    const html = renderToStaticMarkup(<PageSkeleton variant="cards" />);
    expect((html.match(/data-skeleton-card/g) ?? []).length).toBe(8);
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain('href=');
  });

  test('supports the home, venue, ticket and auth loading boundaries', () => {
    for (const variant of ['home', 'venue', 'ticket', 'auth'] as const) {
      const html = renderToStaticMarkup(<PageSkeleton variant={variant} />);
      expect(html).toContain('aria-busy="true"');
      expect(html).toContain('Loading…');
    }
  });
});
