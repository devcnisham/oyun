import { createAdminClient, supabaseConfigured } from '@/utils/supabase/admin';
import type { SupabaseClient } from '@supabase/supabase-js';
import { broadcastSlotChanges } from './realtime';
import { formatSlotRange, istNow, slotTimestamp } from './time';
import type { PitchSize, Slot, SlotUnavailableReason } from './types';
import { getDb, storageInfo, v2SlotsEnabled } from './store';

export interface V2BookableInfo {
  id: string;
  venueId: string;
  name: string;
  sport: string;
  slotMinutes: number;
  basePrice: number;
  active: boolean;
  sort: number;
}

export interface V2AvailableSlotRow {
  starts_at: string;
  ends_at: string;
  price: number;
  state: string;
}

export function isV2SlotsActive(): boolean {
  try {
    return v2SlotsEnabled() && supabaseConfigured() && storageInfo().backend === 'supabase';
  } catch {
    return false;
  }
}

/**
 * Resolves the relational bookable row in oyun.bookables for a given venue slug (turfId) and court/pitch size.
 */
export async function resolveBookable(
  client: SupabaseClient,
  turfId: string,
  size: PitchSize = 'full',
  courtId?: string
): Promise<V2BookableInfo | null> {
  // A turf that splits into halves is booked through the main store, which tracks Right and Left;
  // the relational model has one court for it, so a half there would lock the whole pitch
  try {
    if ((await getDb()).turfs.find((t) => t.id === turfId)?.halfPitch) return null;
  } catch {
    // fall through to the relational lookup
  }

  // 1. Look up venue by slug
  const { data: venue } = await client
    .schema('oyun')
    .from('venues')
    .select('id, status')
    .eq('slug', turfId)
    .maybeSingle();

  let venueId = venue?.id;

  // Auto-sync venue if not yet populated in relational model
  if (!venueId) {
    try {
      const db = await getDb();
      const turf = db.turfs.find((t) => t.id === turfId);
      if (turf) {
        const { data: syncedId } = await client.rpc('sync_turf_to_venue', { turf_data: turf });
        venueId = syncedId;
      }
    } catch (err) {
      console.warn('[v2-slots] auto-sync venue failed:', err);
    }
  }

  if (!venueId) return null;

  // 2. Query active bookables for this venue
  const { data: bookables, error: bError } = await client
    .schema('oyun')
    .from('bookables')
    .select('id, venue_id, name, sport, slot_minutes, base_price, active, sort')
    .eq('venue_id', venueId)
    .eq('active', true)
    .order('sort', { ascending: true });

  if (bError || !bookables || bookables.length === 0) return null;

  // If courtId is explicitly provided, match by ID, sort index or name
  if (courtId) {
    const match = bookables.find(
      (b) => b.id === courtId || String(b.sort) === courtId || b.name.toLowerCase().includes(courtId.toLowerCase())
    );
    if (match) {
      return {
        id: match.id,
        venueId: match.venue_id,
        name: match.name,
        sport: match.sport,
        slotMinutes: match.slot_minutes,
        basePrice: match.base_price,
        active: match.active,
        sort: match.sort,
      };
    }
  }

  // If size is 'half': select Half Pitch A (sort 1) or B (sort 2)
  if (size === 'half') {
    const half = bookables.find((b) => b.sort === 1) ?? bookables.find((b) => b.sort === 2);
    if (half) {
      return {
        id: half.id,
        venueId: half.venue_id,
        name: half.name,
        sport: half.sport,
        slotMinutes: half.slot_minutes,
        basePrice: half.base_price,
        active: half.active,
        sort: half.sort,
      };
    }
  }

  // Default to full pitch (sort 0) or the primary bookable
  const primary = bookables.find((b) => b.sort === 0) ?? bookables[0];
  return {
    id: primary.id,
    venueId: primary.venue_id,
    name: primary.name,
    sport: primary.sport,
    slotMinutes: primary.slot_minutes,
    basePrice: primary.base_price,
    active: primary.active,
    sort: primary.sort,
  };
}

/**
 * Reads slot availability from public.available_slots(p_bookable, p_date)
 */
export async function v2GetSlotsForDate(
  turfId: string,
  date: string,
  size: PitchSize = 'full',
  courtId?: string,
  holder?: string | null,
  clientOverride?: SupabaseClient
): Promise<Slot[] | null> {
  if (!isV2SlotsActive() && !clientOverride) return null;
  const client = clientOverride ?? createAdminClient();

  try {
    const bookable = await resolveBookable(client, turfId, size, courtId);
    if (!bookable) return null;

    const { data: rows, error } = await client.rpc('available_slots', {
      p_bookable: bookable.id,
      p_date: date,
    });

    if (error || !Array.isArray(rows)) {
      console.warn('[v2-slots] available_slots RPC error:', error);
      return null;
    }

    // Check if the current device holds any active slots for this venue/date
    const heldStarts = new Set<string>();
    if (holder) {
      try {
        const { data: userHolds } = await client
          .schema('oyun')
          .from('bookings')
          .select('id, booking_items(during)')
          .eq('holder', holder)
          .in('status', ['held', 'pending_payment'])
          .gt('hold_expires_at', new Date().toISOString());

        if (userHolds) {
          for (const uh of userHolds as Array<{ booking_items?: Array<{ during?: string }> }>) {
            for (const item of uh.booking_items ?? []) {
              if (item.during) heldStarts.add(item.during);
            }
          }
        }
      } catch (err) {
        console.warn('[v2-slots] check user holds error:', err);
      }
    }

    const slots: Slot[] = [];
    for (const row of rows as V2AvailableSlotRow[]) {
      const startUtc = new Date(row.starts_at);
      const endUtc = new Date(row.ends_at);
      const startIst = istNow(startUtc);
      const duration = Math.round((endUtc.getTime() - startUtc.getTime()) / 60_000);
      const isPast = row.state === 'past';
      const isBlocked = row.state === 'blocked';
      const isBooked = row.state === 'booked';
      const isHeld = row.state === 'held';

      const heldByYou = isHeld && Boolean(holder) && (heldStarts.has(row.starts_at) || heldStarts.size > 0);
      const available = row.state === 'available' || Boolean(heldByYou);

      let reason: SlotUnavailableReason | null = null;
      if (!available) {
        if (isPast) reason = 'past';
        else if (isBlocked) reason = 'blocked';
        else if (isHeld) reason = 'held';
        else if (isBooked) reason = 'booked';
      }

      const tags: string[] = [];
      if (row.price > bookable.basePrice) {
        tags.push('Peak');
      } else if (row.price < bookable.basePrice) {
        const discountPct = Math.round(((bookable.basePrice - row.price) / bookable.basePrice) * 100);
        tags.push(`-${discountPct}%`);
      }

      slots.push({
        date: startIst.date,
        hour: startIst.hour,
        minute: startIst.minute,
        durationMinutes: duration,
        label: formatSlotRange(startIst.hour, duration, startIst.minute),
        basePrice: bookable.basePrice,
        price: row.price,
        tags,
        available,
        reason,
        heldByYou: Boolean(heldByYou),
      });
    }

    return slots;
  } catch (err) {
    console.warn('[v2-slots] v2GetSlotsForDate failed:', err);
    return null;
  }
}

/**
 * Holds slots via public.hold_slots, announces slot changes via Realtime, and returns expiry.
 */
export async function v2HoldSlots(
  turfId: string,
  date: string,
  hours: number[],
  holder: string,
  size: PitchSize = 'full',
  courtId?: string,
  clientOverride?: SupabaseClient
): Promise<{ ok: true; expiresInMs: number; bookingId: string } | { ok: false; error: string } | null> {
  if (!isV2SlotsActive() && !clientOverride) return null;
  const client = clientOverride ?? createAdminClient();

  try {
    const bookable = await resolveBookable(client, turfId, size, courtId);
    if (!bookable) return null;

    const db = await getDb();
    const turf = db.turfs.find((t) => t.id === turfId);
    const openHour = turf?.openTime ? parseInt(turf.openTime.split(':')[0], 10) : 0;

    const starts = hours.map((h) => slotTimestamp(date, h, openHour, 0));

    const { data: bookingId, error } = await client.rpc('hold_slots', {
      p_holder: holder,
      p_bookable: bookable.id,
      p_starts: starts,
    });

    if (error) {
      if (error.message?.includes('slot_taken') || error.code === '23P01') {
        return { ok: false, error: 'Someone else is checking out this slot right now. Please pick another slot.' };
      }
      if (error.message?.includes('outside_booking_window')) {
        return { ok: false, error: 'Pick a date within the next week' };
      }
      if (error.message?.includes('slot_in_past')) {
        return { ok: false, error: 'That slot has already passed' };
      }
      return { ok: false, error: error.message || 'Could not hold slots' };
    }

    // Broadcast live update to all open slot maps
    await broadcastSlotChanges([{ turfId, date }]);

    return { ok: true, expiresInMs: 8 * 60_000, bookingId: String(bookingId) };
  } catch (err) {
    console.warn('[v2-slots] v2HoldSlots error:', err);
    return null;
  }
}

/**
 * Releases all active holds for this holder and broadcasts realtime update.
 */
export async function v2ReleaseHolds(
  holder: string,
  turfId?: string,
  date?: string,
  clientOverride?: SupabaseClient
): Promise<void> {
  if (!isV2SlotsActive() && !clientOverride) return;
  const client = clientOverride ?? createAdminClient();

  try {
    await client
      .schema('oyun')
      .from('bookings')
      .update({ status: 'expired' })
      .eq('holder', holder)
      .eq('status', 'held');

    if (turfId && date) {
      await broadcastSlotChanges([{ turfId, date }]);
    }
  } catch (err) {
    console.warn('[v2-slots] v2ReleaseHolds error:', err);
  }
}

/**
 * Confirms a held booking via public.confirm_hold.
 */
export async function v2ConfirmHold(
  bookingId: string,
  holder: string,
  name: string,
  phone: string,
  payOnline: boolean = false,
  turfId?: string,
  date?: string,
  clientOverride?: SupabaseClient
): Promise<{ ok: true; booking: unknown } | { ok: false; error: string } | null> {
  if (!isV2SlotsActive() && !clientOverride) return null;
  const client = clientOverride ?? createAdminClient();

  try {
    const { data: booking, error } = await client.rpc('confirm_hold', {
      p_booking: bookingId,
      p_holder: holder,
      p_name: name,
      p_phone: phone,
      p_pay_online: payOnline,
    });

    if (error) {
      return { ok: false, error: error.message || 'Hold expired or booking not found' };
    }

    if (turfId && date) {
      await broadcastSlotChanges([{ turfId, date }]);
    }

    return { ok: true, booking };
  } catch (err) {
    console.warn('[v2-slots] v2ConfirmHold error:', err);
    return null;
  }
}

/**
 * Cancels a booking via public.cancel_booking and notifies real-time subscribers.
 */
export async function v2CancelBooking(
  bookingId: string,
  reason: string,
  turfId?: string,
  date?: string,
  clientOverride?: SupabaseClient
): Promise<{ ok: true } | { ok: false; error: string } | null> {
  if (!isV2SlotsActive() && !clientOverride) return null;
  const client = clientOverride ?? createAdminClient();

  try {
    const { error } = await client.rpc('cancel_booking', {
      p_booking: bookingId,
      p_reason: reason,
    });

    if (error) {
      return { ok: false, error: error.message || 'Could not cancel booking' };
    }

    if (turfId && date) {
      await broadcastSlotChanges([{ turfId, date }]);
    }

    return { ok: true };
  } catch (err) {
    console.warn('[v2-slots] v2CancelBooking error:', err);
    return null;
  }
}

/**
 * Blocks a slot via public.block_slot and broadcasts realtime update.
 */
export async function v2BlockSlot(
  turfId: string,
  date: string,
  hour: number,
  reason: string,
  durationMinutes: number = 60,
  minute: number = 0,
  courtId?: string,
  clientOverride?: SupabaseClient
): Promise<{ ok: true; blockId: string } | { ok: false; error: string } | null> {
  if (!isV2SlotsActive() && !clientOverride) return null;
  const client = clientOverride ?? createAdminClient();

  try {
    const bookable = await resolveBookable(client, turfId, 'full', courtId);
    if (!bookable) return null;

    const db = await getDb();
    const turf = db.turfs.find((t) => t.id === turfId);
    const openHour = turf?.openTime ? parseInt(turf.openTime.split(':')[0], 10) : 0;

    const startIso = slotTimestamp(date, hour, openHour, minute);
    const startDate = new Date(startIso);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60_000);
    const endIso = endDate.toISOString();

    const during = `[${startIso},${endIso})`;

    const { data: blockId, error } = await client.rpc('block_slot', {
      p_bookable: bookable.id,
      p_during: during,
      p_reason: reason,
    });

    if (error) {
      if (error.message?.includes('slot_taken') || error.code === '23P01') {
        return { ok: false, error: 'This slot already has a booking or hold' };
      }
      return { ok: false, error: error.message || 'Could not block slot' };
    }

    await broadcastSlotChanges([{ turfId, date }]);
    return { ok: true, blockId: String(blockId) };
  } catch (err) {
    console.warn('[v2-slots] v2BlockSlot error:', err);
    return null;
  }
}
