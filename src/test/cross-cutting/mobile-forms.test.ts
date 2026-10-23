// Mobile form and touch-target rules for the player-facing pages, checked against the source.
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

const read = (f: string) => readFileSync(f, 'utf8');
const checkout = read('src/modules/web/frontend/main/arenas/id/CheckoutSheet.tsx');
const flowCss = read('src/modules/web/frontend/main/arenas/id/BookingFlow.module.css');
const matches = read('src/modules/web/frontend/main/matches/MatchesClient.tsx');
const tournaments = read('src/modules/web/frontend/main/tournaments/TournamentsClient.tsx');
const listTurfCss = read('src/app/(main)/list-turf/page.module.css');
const listTurf = read('src/app/(main)/list-turf/page.tsx');

describe('checkout form', () => {
  test('phone is a tel field with the national autofill token', () => {
    expect(checkout).toMatch(/type="tel" aria-label="10-digit mobile number"[\s\S]{0,250}autoComplete="tel-national"/);
  });
  test('every text field has an accessible name', () => {
    for (const label of ['Full name', 'Promo or referral code']) expect(checkout).toContain(`aria-label="${label}"`);
  });
  test('promo code is not autofilled or autocapitalised wrongly', () => {
    expect(checkout).toContain('autoCapitalize="characters"');
  });
  test('inputs are 16px (no iOS zoom) and buttons 44px tall', () => {
    expect(flowCss).toMatch(/\.input \{[^}]*font-size: 16px[^}]*min-height: 44px/);
    expect(flowCss).toMatch(/\.secondary \{[^}]*min-height: 44px/);
  });
});

describe('list-turf form', () => {
  test('inputs are 16px and 44px tall', () => {
    expect(listTurfCss).toMatch(/\.input,\s*\.select,\s*\.textarea \{[^}]*font-size: 16px[^}]*min-height: 44px/);
  });
  test('whatsapp number gets a numeric keypad', () => {
    expect(listTurf).toMatch(/id="whatsapp"[\s\S]{0,120}type="tel"\s+inputMode="numeric"/);
  });
});

describe.each([['matches', matches], ['tournaments', tournaments]])('%s form', (_n, src) => {
  test('no 13px inputs (iOS zooms below 16px)', () => {
    expect(src).not.toMatch(/border: '1px solid var\(--border\)', marginBottom: '8px', fontSize: '13px'/);
  });
  test('phone fields use tel + numeric keypad + national autofill', () => {
    expect(src).toMatch(/type="tel"\s+inputMode="numeric"\s+autoComplete="tel-national"/);
  });
  test('every button is at least 44px tall', () => {
    const buttons = src.split('<button').slice(1).map((b) => b.slice(0, b.indexOf('</button>')));
    expect(buttons.length).toBeGreaterThan(0);
    for (const b of buttons) expect(b).toMatch(/minHeight: 44/);
  });
});

describe('matches host form', () => {
  test('every label is tied to its control', () => {
    const labels = [...matches.matchAll(/<label htmlFor="(host-[a-z]+)"/g)].map((m) => m[1]);
    expect(labels).toHaveLength(8);
    for (const id of labels) expect(matches).toContain(`id="${id}"`);
    expect(matches).not.toMatch(/<label style=/);
  });
});
