import { describe, expect, test, vi } from 'vitest';
import {
  isV2SlotsActive,
  resolveBookable,
  v2BlockSlot,
  v2CancelBooking,
  v2ConfirmHold,
  v2GetSlotsForDate,
  v2HoldSlots,
  v2ReleaseHolds,
} from '@/modules/shared/database/v2-slots';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock realtime broadcast so we can verify notifications
vi.mock('@/modules/shared/backend/realtime', () => ({
  broadcastSlotChanges: vi.fn().mockResolvedValue(true),
}));

describe('v2-slots integration', () => {
  test('isV2SlotsActive returns false in standard test/local file environment', () => {
    expect(isV2SlotsActive()).toBe(false);
  });

  test('resolveBookable returns bookable by sort for full pitch and half pitch', async () => {
    const mockBookables = [
      { id: 'b_full', venue_id: 'v_1', name: 'Full Pitch (7-a-side)', sport: 'football', slot_minutes: 60, base_price: 1000, active: true, sort: 0 },
      { id: 'b_half_a', venue_id: 'v_1', name: 'Half Pitch A (5-a-side)', sport: 'football', slot_minutes: 60, base_price: 500, active: true, sort: 1 },
      { id: 'b_half_b', venue_id: 'v_1', name: 'Half Pitch B (5-a-side)', sport: 'football', slot_minutes: 60, base_price: 500, active: true, sort: 2 },
    ];

    const mockClient = {
      schema: vi.fn().mockReturnValue({
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'venues') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'v_1', status: 'active' }, error: null }),
                }),
              }),
            };
          }
          if (table === 'bookables') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({ data: mockBookables, error: null }),
                  }),
                }),
              }),
            };
          }
          return {};
        }),
      }),
      rpc: vi.fn(),
    } as unknown as SupabaseClient;

    const fullBookable = await resolveBookable(mockClient, 'turf_sarjapur', 'full');
    expect(fullBookable).not.toBeNull();
    expect(fullBookable?.id).toBe('b_full');
    expect(fullBookable?.basePrice).toBe(1000);

    const halfBookable = await resolveBookable(mockClient, 'turf_sarjapur', 'half');
    expect(halfBookable).not.toBeNull();
    expect(halfBookable?.id).toBe('b_half_a');
    expect(halfBookable?.basePrice).toBe(500);

    const customCourt = await resolveBookable(mockClient, 'turf_sarjapur', 'full', 'Half Pitch B');
    expect(customCourt?.id).toBe('b_half_b');
  });

  test('v2GetSlotsForDate parses available_slots RPC output into Slot models', async () => {
    const mockBookables = [
      { id: 'b_full', venue_id: 'v_1', name: 'Standard Court', sport: 'football', slot_minutes: 60, base_price: 1000, active: true, sort: 0 },
    ];

    const mockRpcRows = [
      { starts_at: '2026-10-15T06:00:00+05:30', ends_at: '2026-10-15T07:00:00+05:30', price: 1000, state: 'available' },
      { starts_at: '2026-10-15T07:00:00+05:30', ends_at: '2026-10-15T08:00:00+05:30', price: 1200, state: 'held' },
      { starts_at: '2026-10-15T08:00:00+05:30', ends_at: '2026-10-15T09:00:00+05:30', price: 1000, state: 'booked' },
      { starts_at: '2026-10-15T09:00:00+05:30', ends_at: '2026-10-15T10:00:00+05:30', price: 1000, state: 'blocked' },
    ];

    const mockClient = {
      schema: vi.fn().mockReturnValue({
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'venues') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'v_1', status: 'active' }, error: null }),
                }),
              }),
            };
          }
          if (table === 'bookables') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({ data: mockBookables, error: null }),
                  }),
                }),
              }),
            };
          }
          if (table === 'bookings') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  in: vi.fn().mockReturnValue({
                    gt: vi.fn().mockResolvedValue({ data: [], error: null }),
                  }),
                }),
              }),
            };
          }
          return {};
        }),
      }),
      rpc: vi.fn().mockImplementation((fn: string) => {
        if (fn === 'available_slots') {
          return Promise.resolve({ data: mockRpcRows, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      }),
    } as unknown as SupabaseClient;

    const slots = await v2GetSlotsForDate('turf_test', '2026-10-15', 'full', undefined, 'dev_holder', mockClient);
    expect(slots).not.toBeNull();
    expect(slots).toHaveLength(4);

    expect(slots![0].hour).toBe(6);
    expect(slots![0].available).toBe(true);
    expect(slots![0].reason).toBeNull();
    expect(slots![0].durationMinutes).toBe(60);

    expect(slots![1].hour).toBe(7);
    expect(slots![1].available).toBe(false);
    expect(slots![1].reason).toBe('held');
    expect(slots![1].tags).toContain('Peak');

    expect(slots![2].hour).toBe(8);
    expect(slots![2].available).toBe(false);
    expect(slots![2].reason).toBe('booked');

    expect(slots![3].hour).toBe(9);
    expect(slots![3].available).toBe(false);
    expect(slots![3].reason).toBe('blocked');
  });

  test('v2HoldSlots invokes public.hold_slots and broadcasts realtime notification', async () => {
    const { broadcastSlotChanges } = await import('@/modules/shared/backend/realtime');
    const mockBookables = [
      { id: 'b_001', venue_id: 'v_1', name: 'Standard Court', sport: 'football', slot_minutes: 60, base_price: 1000, active: true, sort: 0 },
    ];

    const mockClient = {
      schema: vi.fn().mockReturnValue({
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'venues') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'v_1', status: 'active' }, error: null }),
                }),
              }),
            };
          }
          if (table === 'bookables') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({ data: mockBookables, error: null }),
                  }),
                }),
              }),
            };
          }
          return {};
        }),
      }),
      rpc: vi.fn().mockResolvedValue({ data: 'bk_held_123', error: null }),
    } as unknown as SupabaseClient;

    const res = await v2HoldSlots('turf_test', '2026-10-15', [18, 19], 'holder_abc', 'full', undefined, mockClient);
    expect(res).not.toBeNull();
    expect(res?.ok).toBe(true);
    if (res?.ok) {
      expect(res.bookingId).toBe('bk_held_123');
      expect(res.expiresInMs).toBe(8 * 60_000);
    }

    expect(broadcastSlotChanges).toHaveBeenCalledWith([{ turfId: 'turf_test', date: '2026-10-15' }]);
  });

  test('v2HoldSlots returns friendly error when slot is already taken', async () => {
    const mockBookables = [
      { id: 'b_001', venue_id: 'v_1', name: 'Standard Court', sport: 'football', slot_minutes: 60, base_price: 1000, active: true, sort: 0 },
    ];

    const mockClient = {
      schema: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'v_1', status: 'active' }, error: null }),
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mockBookables, error: null }),
              }),
            }),
          }),
        }),
      }),
      rpc: vi.fn().mockResolvedValue({ data: null, error: { message: 'slot_taken', code: '23P01' } }),
    } as unknown as SupabaseClient;

    const res = await v2HoldSlots('turf_test', '2026-10-15', [18], 'holder_abc', 'full', undefined, mockClient);
    expect(res).not.toBeNull();
    expect(res?.ok).toBe(false);
    if (res && !res.ok) {
      expect(res.error).toContain('Someone else is checking out this slot');
    }
  });

  test('v2ConfirmHold, v2CancelBooking, and v2BlockSlot broadcast realtime update on success', async () => {
    const { broadcastSlotChanges } = await import('@/modules/shared/backend/realtime');
    const mockBookables = [
      { id: 'b_001', venue_id: 'v_1', name: 'Standard Court', sport: 'football', slot_minutes: 60, base_price: 1000, active: true, sort: 0 },
    ];

    const mockClient = {
      schema: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'v_1', status: 'active' }, error: null }),
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mockBookables, error: null }),
              }),
            }),
          }),
        }),
      }),
      rpc: vi.fn().mockImplementation((fn: string) => {
        if (fn === 'confirm_hold') return Promise.resolve({ data: { id: 'bk_1', status: 'confirmed' }, error: null });
        if (fn === 'cancel_booking') return Promise.resolve({ data: null, error: null });
        if (fn === 'block_slot') return Promise.resolve({ data: 'blk_1', error: null });
        return Promise.resolve({ data: null, error: null });
      }),
    } as unknown as SupabaseClient;

    const confirmRes = await v2ConfirmHold('bk_1', 'holder_1', 'Rahul', '9876543210', false, 'turf_test', '2026-10-15', mockClient);
    expect(confirmRes?.ok).toBe(true);
    expect(broadcastSlotChanges).toHaveBeenCalledWith([{ turfId: 'turf_test', date: '2026-10-15' }]);

    const cancelRes = await v2CancelBooking('bk_1', 'Rain disruption', 'turf_test', '2026-10-15', mockClient);
    expect(cancelRes?.ok).toBe(true);
    expect(broadcastSlotChanges).toHaveBeenCalledWith([{ turfId: 'turf_test', date: '2026-10-15' }]);

    const blockRes = await v2BlockSlot('turf_test', '2026-10-15', 18, 'Maintenance', 60, 0, undefined, mockClient);
    expect(blockRes?.ok).toBe(true);
    expect(broadcastSlotChanges).toHaveBeenCalledWith([{ turfId: 'turf_test', date: '2026-10-15' }]);

    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });
    const releaseClient = {
      schema: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          update: updateMock,
        }),
      }),
    } as unknown as SupabaseClient;

    await v2ReleaseHolds('holder_1', 'turf_test', '2026-10-15', releaseClient);
    expect(updateMock).toHaveBeenCalledWith({ status: 'expired' });
    expect(broadcastSlotChanges).toHaveBeenCalledWith([{ turfId: 'turf_test', date: '2026-10-15' }]);
  });
});
