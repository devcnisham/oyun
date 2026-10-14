import 'server-only';
import { createHash } from 'node:crypto';
import { createAdminClient, supabaseConfigured } from '@/utils/supabase/admin';
import { formatSlotRange } from './time';
import type { PitchPart, Slot } from './types';

/**
 * Deterministically turns any string key into a valid RFC 4122 v4-shaped UUID.
 * Ensures consistent IDs between mapped turfs/bookables and database v2 tables.
 */
export function stringToUuid(input: string): string {
  const hash = createHash('md5').update(input).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

/**
 * Derives the v2 bookable UUID for a given turf and pitch partition/size.
 */
export function turfBookableUuid(turfId: string, sizeOrPart: string = 'full'): string {
  const part = sizeOrPart === 'half_a' || sizeOrPart === 'A' ? 'ha' : sizeOrPart === 'half_b' || sizeOrPart === 'B' ? 'hb' : 'full';
  return stringToUuid(`bk_${turfId}_${part}`);
}

export interface V2SlotRow {
  starts_at: string;
  ends_at: string;
  price: number;
  state: 'available' | 'held' | 'booked' | 'blocked' | 'past';
}

/**
 * Checks if Database v2 RPC wrappers are available and enabled.
 */
export function isV2RpcEnabled(): boolean {
  if (process.env.NODE_ENV === 'test' && !process.env.TEST_V2_RPC) return false;
  return supabaseConfigured();
}

/**
 * Calls public.available_slots(p_bookable, p_date)
 */
export async function v2AvailableSlots(bookableUuid: string, date: string): Promise<V2SlotRow[] | null> {
  if (!isV2RpcEnabled()) return null;
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc('available_slots', {
      p_bookable: bookableUuid,
      p_date: date,
    });
    if (error) {
      console.warn('[v2-rpc] available_slots failed:', error.message);
      return null;
    }
    return (data as V2SlotRow[]) ?? [];
  } catch (err) {
    console.warn('[v2-rpc] available_slots error:', err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Calls public.hold_slots(p_holder, p_bookable, p_starts, p_player, p_ttl)
 */
export async function v2HoldSlots(
  holder: string,
  bookableUuid: string,
  startsAtIsoArray: string[],
  ttlMinutes: number = 8
): Promise<string | null> {
  if (!isV2RpcEnabled()) return null;
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc('hold_slots', {
      p_holder: holder,
      p_bookable: bookableUuid,
      p_starts: startsAtIsoArray,
      p_ttl: `${ttlMinutes} minutes`,
    });
    if (error) {
      console.warn('[v2-rpc] hold_slots failed:', error.message);
      return null;
    }
    return String(data);
  } catch (err) {
    console.warn('[v2-rpc] hold_slots error:', err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Calls public.confirm_hold(p_booking, p_holder, p_name, p_phone, p_pay_online)
 */
export async function v2ConfirmHold(
  bookingUuid: string,
  holder: string,
  name: string,
  phone: string,
  payOnline: boolean = false
): Promise<{ id: string; status: string } | null> {
  if (!isV2RpcEnabled()) return null;
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc('confirm_hold', {
      p_booking: bookingUuid,
      p_holder: holder,
      p_name: name,
      p_phone: phone,
      p_pay_online: payOnline,
    });
    if (error) {
      console.warn('[v2-rpc] confirm_hold failed:', error.message);
      return null;
    }
    return data as { id: string; status: string };
  } catch (err) {
    console.warn('[v2-rpc] confirm_hold error:', err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Calls public.cancel_booking(p_booking, p_reason)
 */
export async function v2CancelBooking(bookingUuid: string, reason: string): Promise<boolean> {
  if (!isV2RpcEnabled()) return false;
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.rpc('cancel_booking', {
      p_booking: bookingUuid,
      p_reason: reason,
    });
    if (error) {
      console.warn('[v2-rpc] cancel_booking failed:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[v2-rpc] cancel_booking error:', err instanceof Error ? err.message : err);
    return false;
  }
}

/**
 * Calls public.block_slot(p_bookable, p_during, p_reason)
 */
export async function v2BlockSlot(
  bookableUuid: string,
  startsAtIso: string,
  endsAtIso: string,
  reason: string
): Promise<string | null> {
  if (!isV2RpcEnabled()) return null;
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc('block_slot', {
      p_bookable: bookableUuid,
      p_during: `[${startsAtIso},${endsAtIso})`,
      p_reason: reason,
    });
    if (error) {
      console.warn('[v2-rpc] block_slot failed:', error.message);
      return null;
    }
    return String(data);
  } catch (err) {
    console.warn('[v2-rpc] block_slot error:', err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Calls public.expire_holds()
 */
export async function v2ExpireHolds(): Promise<number> {
  if (!isV2RpcEnabled()) return 0;
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc('expire_holds');
    if (error) {
      console.warn('[v2-rpc] expire_holds failed:', error.message);
      return 0;
    }
    return typeof data === 'number' ? data : 0;
  } catch (err) {
    console.warn('[v2-rpc] expire_holds error:', err instanceof Error ? err.message : err);
    return 0;
  }
}

/**
 * Maps raw v2 slot rows into the application's Slot[] structure.
 */
export function mapV2RowsToSlots(rows: V2SlotRow[], date: string, pitchPart?: PitchPart): Slot[] {
  return rows.map((row) => {
    const start = new Date(row.starts_at);
    const end = new Date(row.ends_at);
    const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
    // Parse IST hours from starts_at
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(start);
    const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
    const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');

    const available = row.state === 'available';
    return {
      date,
      hour,
      label: formatSlotRange(hour, durationMinutes, minute),
      basePrice: row.price,
      price: row.price,
      tags: [],
      available,
      reason: available ? null : (row.state as 'booked' | 'held' | 'blocked' | 'past'),
      heldByYou: false,
      pitch: pitchPart,
      durationMinutes,
    };
  });
}
