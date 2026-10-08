import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isAllowedAdLink, isAllowedImage } from './site-content.ts';

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
