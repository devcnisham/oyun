import { describe, expect, test, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { v2BookRanges, v2MoveBooking, v2Range, type V2Quote } from '@/modules/shared/database/v2-slots';

vi.mock('@/modules/shared/backend/realtime', () => ({ broadcastSlotChanges: vi.fn().mockResolvedValue(true) }));

const QUOTE: V2Quote = { subtotal: 1000, discount: 0, walletUsed: 0, total: 1000, advanceDue: 100, amountPaid: 0, priceBreakdown: {}, meta: {}, legacyId: 'bk_1' };

// A client that finds one venue with one full-pitch bookable and answers rpc() with `reply`
function client(reply: { data?: unknown; error?: { message: string } | null }) {
  const rpc = vi.fn().mockResolvedValue({ data: reply.data ?? null, error: reply.error ?? null });
  const c = {
    schema: () => ({
      from: (table: string) =>
        table === 'venues'
          ? { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: 'v_1', status: 'active' }, error: null }) }) }) }
          : { select: () => ({ eq: () => ({ eq: () => ({ order: async () => ({ data: [{ id: 'b_full', venue_id: 'v_1', name: 'Full', sport: 'football', slot_minutes: 60, base_price: 1000, active: true, sort: 0 }], error: null }) }) }) }) },
    }),
    rpc,
  } as unknown as SupabaseClient;
  return { c, rpc };
}

describe('v2Range', () => {
  test('writes a half-open range in IST from a start and length', () => {
    expect(v2Range('2026-10-20', 17, 15, 90, 0)).toBe('[2026-10-20T17:15:00+05:30,2026-10-20T13:15:00.000Z)');
  });
  test('a slot before opening time belongs to the next calendar day', () => {
    expect(v2Range('2026-10-20', 1, 0, 60, 6).startsWith('[2026-10-21T01:00:00+05:30,')).toBe(true);
  });
});

describe('v2BookRanges', () => {
  test('sends the ranges, quote and bookable, and returns the booking id and code', async () => {
    const { c, rpc } = client({ data: { id: 'uuid-1', code: 'AB12CD34' } });
    const r = await v2BookRanges({ turfId: 't', ranges: ['[a,b)'], name: 'Asha', phone: '9876543210', quote: QUOTE, clientOverride: c });
    expect(r).toEqual({ ok: true, id: 'uuid-1', code: 'AB12CD34' });
    expect(rpc).toHaveBeenCalledWith('book_ranges', expect.objectContaining({ p_bookable: 'b_full', p_ranges: ['[a,b)'], p_quote: QUOTE, p_allow_past: false }));
  });
  test('turns database errors into messages a person can act on', async () => {
    const taken = await v2BookRanges({ turfId: 't', ranges: ['[a,b)'], name: 'A', phone: '9', quote: QUOTE, clientOverride: client({ error: { message: 'slot_taken' } }).c });
    expect(taken).toEqual({ ok: false, error: 'That slot was just taken. Please pick another time.' });
    const closed = await v2BookRanges({ turfId: 't', ranges: ['[a,b)'], name: 'A', phone: '9', quote: QUOTE, clientOverride: client({ error: { message: 'venue_closed' } }).c });
    expect(closed).toEqual({ ok: false, error: 'The venue is closed at that time' });
  });
});

describe('v2MoveBooking', () => {
  test('moves and reports ok', async () => {
    const { c, rpc } = client({ data: {} });
    expect(await v2MoveBooking('bk_1', '2026-10-20T18:00:00+05:30', 't', ['2026-10-20', '2026-10-21'], c)).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith('move_booking', { p_booking: 'bk_1', p_start: '2026-10-20T18:00:00+05:30' });
  });
  test('a taken slot is an error, not a crash', async () => {
    const r = await v2MoveBooking('bk_1', 'x', 't', [], client({ error: { message: 'slot_taken' } }).c);
    expect(r).toEqual({ ok: false, error: 'That slot was just taken. Please pick another time.' });
  });
  test('a booking that is not confirmed cannot move', async () => {
    const r = await v2MoveBooking('bk_1', 'x', 't', [], client({ error: { message: 'not_movable' } }).c);
    expect(r).toEqual({ ok: false, error: 'Only confirmed bookings can be rescheduled' });
  });
});
