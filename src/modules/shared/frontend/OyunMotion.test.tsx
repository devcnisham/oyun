import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import { OyunLoader, ConfirmationMark } from './OyunMotion';

test('loading communicates the real pending action and renders the brand', () => {
  const html = renderToStaticMarkup(<OyunLoader compact label="Confirming booking…" />);
  expect(html).toContain('role="status"');
  expect(html).toContain('Confirming booking…');
  expect((html.match(/<path/g) ?? []).length).toBe(4);
  expect(html).toContain('viewBox="0 0 244 76"');
});
test('the animated confirmation is decorative, leaving ticket status as the accessible label', () => {
  const html = renderToStaticMarkup(<ConfirmationMark />);
  expect(html).toContain('aria-hidden="true"');
  expect(html).toContain('<path');
  expect(html).not.toContain('role="alert"');
});
