import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import BlogPage, { metadata } from './page';
import { GUIDES } from '@/modules/web/lib/guides-content';

test('blog links to every real article without category filters or invented stories', () => {
  const html = renderToStaticMarkup(<BlogPage />);
  for (const guide of GUIDES) expect(html).toContain(`href="/guides/${guide.slug}"`);
  expect(html).not.toContain('Blog categories');
  expect(html).toContain('Advertisement · Demo');
  expect(metadata.alternates).toEqual({ canonical: '/blog' });
  expect(metadata.openGraph).toMatchObject({ url: '/blog', type: 'website' });
});
