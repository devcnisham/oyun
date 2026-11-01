import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import { OyunLoader, ConfirmationMark } from './OyunMotion';

test('loading communicates the real pending action and renders the brand', () => {
  const html = renderToStaticMarkup(<OyunLoader compact label="Confirming booking…" />);
  expect(html).toContain('role="status"');
  expect(html).toContain('Confirming booking…');
  expect(html).toContain('data-oyun-wordmark');
  for (const letter of 'OYUN') expect(html).toContain(`>${letter}</span>`);
});
test('the animated confirmation is decorative, leaving ticket status as the accessible label', () => {
  const html = renderToStaticMarkup(<ConfirmationMark />);
  expect(html).toContain('aria-hidden="true"');
  expect(html).toContain('<path');
  expect(html).not.toContain('role="alert"');
});
