import { describe, expect, test, vi, beforeEach } from 'vitest';
import { getDb, storageInfo } from '@/modules/shared/database/store';
import { createBookings } from '@/modules/web/backend/booking-actions';
import * as v2Slots from '@/modules/shared/database/v2-slots';
import * as adminUtil from '@/modules/shared/database/supabase/admin';
import type { SupabaseClient } from '@supabase/supabase-js';
import { addDays, istNow } from '@/modules/shared/lib/time';

vi.mock('@/modules/web/lib/device-holder', () => ({
  deviceHolder: vi.fn().mockResolvedValue('test_holder_token_hash'),
}));

vi.mock('@/modules/shared/backend/action-utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/modules/shared/backend/action-utils')>();
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

  test('createBookings prices the order and confirms the v2 hold with it when v2 is active', async () => {
    vi.spyOn(v2Slots, 'isV2SlotsActive').mockReturnValue(true);

    const mockConfirm = vi.spyOn(v2Slots, 'v2ConfirmHoldPriced').mockResolvedValue({
      ok: true,
      booking: { id: 'bk_v2_1234567890ab', code: 'AB12CD34' },
    });

    const mockClient = {
      schema: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          upsert: vi.fn().mockResolvedValue({ error: null }),
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
      turfId: 'squad-x-kankanady',
      date: addDays(istNow().date, 3), // always in the future, so the slot is never "past"
      name: 'Rohan Kumar',
      phone: '9876543210',
      hours: [18],
      promoCode: null,
      addOns: [],
      useWallet: false,
    });

    expect(res.error).toBeUndefined();
    expect(res.ids).toHaveLength(1);
    expect(mockConfirm).toHaveBeenCalledTimes(1);
    const [heldId, , name, phone, quote] = mockConfirm.mock.calls[0];
    expect(heldId).toBe('bk_v2_1234567890ab');
    expect([name, phone]).toEqual(['Rohan Kumar', '9876543210']);
    expect(quote).toMatchObject({ legacyId: res.ids![0], amountPaid: 0 });
    expect(quote.total).toBeGreaterThan(0);
  });

  test('storageInfo reports local-file by default in test environment', () => {
    const info = storageInfo();
    expect(info.backend).toBe('local-file');
  });
});
