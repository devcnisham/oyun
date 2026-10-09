import assert from 'node:assert/strict';
import { test } from 'vitest';
import { isAllowedAdLink, isAllowedImage, isSafeTurfImage } from './site-content.ts';

test('images come from /public or Unsplash only', () => {
  assert.equal(isAllowedImage('/turfs/turf_1.jpg'), true);
  assert.equal(isAllowedImage('https://images.unsplash.com/photo-1?w=800'), true);
  for (const bad of ['//evil.example/x.jpg', 'https://evil.example/x.jpg', 'http://images.unsplash.com/x', 'javascript:alert(1)', '']) {
    assert.equal(isAllowedImage(bad), false, bad);
  }
});

test('ad links allow https pages and site paths', () => {
  assert.equal(isAllowedAdLink('https://sponsor.example/offer?x=1'), true);
  assert.equal(isAllowedAdLink('/arenas?sport=padel'), true);
});

test('ad links refuse script, data, plain http, protocol-relative and credential URLs', () => {
  for (const bad of [
    'javascript:alert(1)',
    'JavaScript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'http://sponsor.example',
    '//evil.example',
    '/\\evil.example',
    'https://user:pass@sponsor.example',
    'https://localhost',
    'not a url',
  ]) {
    assert.equal(isAllowedAdLink(bad), false, bad);
  }
});

test('turf images allow site files and plain public https links', () => {
  for (const ok of ['/turfs/turf_1.jpg', 'https://images.unsplash.com/photo-1?w=800', 'https://cdn.myturf.in/a/b.webp?v=2']) {
    assert.equal(isSafeTurfImage(ok), true, ok);
  }
});

test('turf images refuse protocol-relative, backslash, script, data, http, credential and internal-host links', () => {
  for (const bad of [
    '//evil.example/x.jpg',
    '/\\evil.example/x.jpg',
    'https://evil.example\\@good.example/x.jpg',
    'http://cdn.myturf.in/a.jpg',
    'javascript:alert(1)',
    'data:image/svg+xml;base64,AAAA',
    'https://user:pass@cdn.myturf.in/a.jpg',
    'https://localhost/a.jpg',
    'https://intranet/a.jpg',
    'https://cdn.myturf.in/a b.jpg',
    'https://cdn.myturf.in/' + 'a'.repeat(600),
    '',
  ]) {
    assert.equal(isSafeTurfImage(bad), false, bad);
  }
});
