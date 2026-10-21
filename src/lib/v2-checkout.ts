import 'server-only';
import type { BookingRequest } from './booking-types';
import { planBooking } from './booking-plan';
import { ValidationError } from './errors';
import { getDb, mutate } from './store';
import { v2QuoteOf } from './v2-bookings';
import { legacyToUuid } from './v2-ids';
import { v2CancelBooking, v2ConfirmHoldPriced } from './v2-slots';
import { createAdminClient } from '@/utils/supabase/admin';

/*
 * Checkout with v2 slots (docs/V2-INTEGRATION-PLAN.md, phase 3). The slots were held in the oyun schema
 * while the player filled in the form; this prices the order, confirms the hold with that price, and then
 * applies what the order does to the rest of the store (wallet debit, promo use, new player, referral).
 *
 *   1. price the order on a copy, so a bad promo code or a changed price stops here with nothing written
 *   2. confirm the hold with the quote (atomic: refused if the hold expired or belongs to someone else)
 *   3. apply the wallet, promo and player changes; if that fails, give the slots back
 */

const HELD = 'id, venue_id, venues(slug)';

/** The oyun player row a booking points at. A number v2 rejects leaves the booking unlinked rather than failing it. */
export async function ensureV2Player(playerId: string | null, name: string, phone: string, accountId: string | null): Promise<string | undefined> {
  if (!playerId) return undefined;
  const id = legacyToUuid('player', playerId);
  const { error } = await createAdminClient()
    .schema('oyun')
    .from('players')
    .upsert({ id, legacy_id: playerId, clerk_user_id: accountId, name, phone }, { onConflict: 'id' });
  if (error) {
    console.warn('[v2-checkout] could not link the player:', error.message);
    return undefined;
  }
  return id;
}

export async function v2Checkout(req: BookingRequest, holder: string | null, accountId: string | null): Promise<{ ids: string[] }> {
  if (!holder) throw new ValidationError('Your hold expired. Please pick your slots again.');
  const client = createAdminClient();

  const { data: held } = await client
    .schema('oyun')
    .from('bookings')
    .select(HELD)
    .eq('holder', holder)
    .eq('status', 'held')
    .gt('hold_expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!held) throw new ValidationError('Your hold expired. Please pick your slots again.');

  // 1. Price it
  const planned = planBooking(structuredClone(await getDb()), req, holder, true, accountId);
  if (planned.quote.slotError) throw new ValidationError(planned.quote.slotError);
  if (planned.quote.promoError) throw new ValidationError(planned.quote.promoError);
  const booking = planned.bookings[0];

  const playerUuid = await ensureV2Player(booking.playerId, booking.customerName, booking.customerPhone, accountId);

  // 2. Confirm the hold with the price
  const confirmed = await v2ConfirmHoldPriced(held.id, holder, booking.customerName, booking.customerPhone, v2QuoteOf(booking), {
    playerId: playerUuid,
    turfId: booking.turfId,
    date: booking.date,
  });
  if (!confirmed) throw new Error('[v2-checkout] could not reach the booking service');
  if (!confirmed.ok) throw new ValidationError(confirmed.error);
  const code = (confirmed.booking as { code?: string } | null)?.code ?? booking.code;

  // 3. Wallet, promo, player and referral changes. The booking already exists in oyun, so the planner runs
  // against a view without it: it is counted as neither a clash for the slot nor the player's earlier booking.
  try {
    await mutate((db) => {
      const view = new Proxy(db, { get: (target, key) => (key === 'bookings' ? [] : Reflect.get(target, key)) });
      const applied = planBooking(view, req, holder, true, accountId, { id: booking.id, code });
      if (applied.quote.slotError || applied.bookings[0].pricing.total !== booking.pricing.total || applied.bookings[0].pricing.walletDeduction !== booking.pricing.walletDeduction) {
        throw new ValidationError('The price changed while you were booking. Please review it and try again.');
      }
    });
  } catch (err) {
    await v2CancelBooking(held.id, 'checkout could not be completed', booking.turfId, booking.date);
    throw err;
  }
  return { ids: [booking.id] };
}
