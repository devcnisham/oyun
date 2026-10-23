import { describe, expect, test } from 'vitest';
import { DRAFT_TTL_MS, parseDraft, type BookingDraft } from '@/modules/web/frontend/hooks/booking-draft';

const NOW = 1_800_000_000_000;
const draft = (over: Partial<BookingDraft> = {}): BookingDraft => ({
  turfId: 't1', date: '2026-11-02', hours: [18, 19], size: 'full', holdUntil: null, name: 'Asha', phone: '9876500001', code: '', promo: null, useWallet: false, addOns: [], savedAt: NOW - 1000, ...over,
});
const raw = (d: unknown) => JSON.stringify(d);

describe('parseDraft', () => {
  test('a fresh draft for this venue comes back as saved', () => {
    expect(parseDraft(raw(draft()), 't1', NOW)).toEqual(draft());
  });

  test('nothing, garbage and another venue give no draft', () => {
    expect(parseDraft(null, 't1', NOW)).toBeNull();
    expect(parseDraft('{not json', 't1', NOW)).toBeNull();
    expect(parseDraft(raw(draft()), 't2', NOW)).toBeNull();
  });

  test('a draft older than the time limit, or dated in the future, is dropped', () => {
    expect(parseDraft(raw(draft({ savedAt: NOW - DRAFT_TTL_MS - 1 })), 't1', NOW)).toBeNull();
    expect(parseDraft(raw(draft({ savedAt: NOW - DRAFT_TTL_MS + 1000 })), 't1', NOW)).not.toBeNull();
    expect(parseDraft(raw(draft({ savedAt: NOW + 10 * 60_000 })), 't1', NOW)).toBeNull();
  });

  test('bad dates, hours, sizes and sides are refused', () => {
    expect(parseDraft(raw(draft({ date: 'tomorrow' })), 't1', NOW)).toBeNull();
    expect(parseDraft(raw(draft({ hours: [25] })), 't1', NOW)).toBeNull();
    expect(parseDraft(raw(draft({ hours: Array.from({ length: 13 }, (_, i) => i) })), 't1', NOW)).toBeNull();
    expect(parseDraft(raw({ ...draft(), size: 'third' }), 't1', NOW)).toBeNull();
    expect(parseDraft(raw({ ...draft(), side: 'C' }), 't1', NOW)).toBeNull();
    expect(parseDraft(raw(draft({ size: 'half', side: 'B' })), 't1', NOW)?.side).toBe('B');
  });

  test('odd extra fields are cleaned instead of trusted', () => {
    const d = parseDraft(raw({ ...draft(), holdUntil: 'soon', name: 5, addOns: [{ id: 'a', qty: 2 }, { id: 'b', qty: 99 }, { id: 3, qty: 1 }, null], promo: 7 }), 't1', NOW)!;
    expect(d.holdUntil).toBeNull();
    expect(d.name).toBe('');
    expect(d.promo).toBeNull();
    expect(d.addOns).toEqual([{ id: 'a', qty: 2 }]);
  });
});
