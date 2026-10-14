import { describe, expect, test, vi, beforeEach } from 'vitest';
import { getDb, storageInfo } from './store';
import { createBookings } from './booking-actions';
import * as v2Slots from './v2-slots';
import * as adminUtil from '@/utils/supabase/admin';
import type { SupabaseClient } from '@supabase/supabase-js';

vi.mock('./device-holder', () => ({
  deviceHolder: vi.fn().mockResolvedValue('test_holder_token_hash'),
}));

vi.mock('./action-utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./action-utils')>();
  return {
    ...actual,
    refreshAll: vi.fn(),
  };
});

describe('R008: Retire jsonb store for bookings, holds, blocks, pricing', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('Local dev keeps in-memory state intact when Supabase is not active', async () => {
    const db = await getDb();
    expect(Array.isArray(db.bookings)).toBe(true);
    expect(Array.isArray(db.holds)).toBe(true);
    expect(Array.isArray(db.blocks)).toBe(true);
    expect(typeof db.pricing).toBe('object');
  });

  test('createBookings delegates to v2ConfirmHold when v2 is active', async () => {
    vi.spyOn(v2Slots, 'isV2SlotsActive').mockReturnValue(true);

    const mockConfirm = vi.spyOn(v2Slots, 'v2ConfirmHold').mockResolvedValue({
      ok: true,
      booking: { id: 'bk_v2_1234567890ab' },
    });

    const mockClient = {
      schema: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gt: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      maybeSingle: vi.fn().mockResolvedValue({
                        data: {
                          id: 'bk_v2_1234567890ab',
                          venue_id: 'v_1',
                          venues: { slug: 'turf_kankanady' },
                        },
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient;

    vi.spyOn(adminUtil, 'createAdminClient').mockReturnValue(mockClient);

    const res = await createBookings({
      turfId: 'turf_kankanady',
      date: '2026-10-15',
      name: 'Rohan Kumar',
      phone: '9876543210',
      hours: [18],
      promoCode: null,
      addOns: [],
      useWallet: false,
    });

    expect(res.ids).toEqual(['bk_v2_1234567890ab']);
    expect(mockConfirm).toHaveBeenCalled();
  });

  test('storageInfo reports local-file by default in test environment', () => {
    const info = storageInfo();
    expect(info.backend).toBe('local-file');
  });
});
