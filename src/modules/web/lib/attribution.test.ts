import { describe, expect, test } from 'vitest';
import { decodeAttribution, encodeAttribution, parseAttribution } from '@/modules/web/lib/attribution';

const q = (s: string) => new URLSearchParams(s);

describe('parseAttribution', () => {
  test('UTM tags win over the referrer', () => {
    expect(parseAttribution('/arenas?utm_source=Instagram', q('utm_source=Instagram&utm_medium=Social&utm_campaign=Launch'), 'https://google.com/', 'www.oyun.co.in')).toEqual({
      source: 'instagram', medium: 'social', campaign: 'launch', landing: '/arenas',
    });
  });
  test('search engines are organic, other sites are referrals', () => {
    expect(parseAttribution('/', q(''), 'https://www.google.com/search?q=turf', 'www.oyun.co.in')).toMatchObject({ source: 'google.com', medium: 'organic' });
    expect(parseAttribution('/', q(''), 'https://blog.example.in/post', 'www.oyun.co.in')).toMatchObject({ source: 'blog.example.in', medium: 'referral' });
  });
  test('no referrer or our own site is direct', () => {
    expect(parseAttribution('/', q(''), '', 'www.oyun.co.in')).toMatchObject({ source: 'direct', medium: 'none' });
    expect(parseAttribution('/', q(''), 'https://www.oyun.co.in/arenas', 'www.oyun.co.in')).toMatchObject({ source: 'direct' });
  });
  test('strips unsafe characters and long values', () => {
    const a = parseAttribution('/', q('utm_source=<script>alert(1)</script>' + 'x'.repeat(200)), '', 'www.oyun.co.in');
    expect(a.source).not.toMatch(/[<>()]/);
    expect(a.source.length).toBeLessThanOrEqual(60);
  });
});

describe('cookie round trip', () => {
  test('encodes and decodes, and ignores junk', () => {
    const a = { source: 'google.com', medium: 'organic', landing: '/turfs/kodialbail' };
    expect(decodeAttribution(encodeAttribution(a))).toEqual(a);
    expect(decodeAttribution(undefined)).toBeNull();
    expect(decodeAttribution('%7Bnot json')).toBeNull();
    expect(decodeAttribution(encodeURIComponent('{"source":1}'))).toBeNull();
  });
});
