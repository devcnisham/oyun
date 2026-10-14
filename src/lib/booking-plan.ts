// Server-side booking planner: finds a bookable turf and prices and books every chosen hour against a
// database copy. It imports the store and wallet, so only server code (booking-actions, tests) may use it.
// Client-safe request types, limits and cleaners live in booking-types.ts.
import { ValidationError } from './errors';
import { cleanHours, cleanSize, type BookingRequest, type SelectionQuote } from './booking-types';
import { buildQuote, freePart, normalizePhone } from './pricing';
import { newBookingCode, newId } from './store';
import { formatHour, formatSlotRange, istNow } from './time';
import type { Booking, BookingAddOn, BookingItem, Database, PriceBreakdown, PriceLine } from './types';
import { createPlayer, findByReferralCode, walletTxn } from './wallet';
import { clerkEnabled } from './clerk';

export function bookableTurf(db: Database, turfId: string) {
  const turf = db.turfs.find((t) => t.id === turfId);
  return turf && turf.status === 'active' ? turf : null;
}

/*
 * Books every chosen hour against `db` and returns the bookings plus the price summary.
 * The quote runs this on a throwaway copy, so the price shown is exactly what booking charges.
 * Add-ons are attached to the first hour only.
 */
export function planBooking(db: Database, req: BookingRequest, holder: string | null, strict: boolean, accountId: string | null = null) {
  const turf = bookableTurf(db, req.turfId);
  if (!turf) throw new ValidationError('This turf is not taking bookings right now');
  const hours = cleanHours(req.hours);
  const size = turf.halfPitch ? cleanSize(req.size) : 'full';
  const phone = normalizePhone(req.phone);
  const name = req.name.trim().slice(0, 80) || 'Player';
  const now = istNow();

  let player = accountId ? db.players.find((p) => p.accountId === accountId) : undefined;
  if (!player && phone.length === 10) {
    const byPhone = db.players.find((p) => p.phone === phone);
    if (byPhone) {
      if (accountId) {
        if (!byPhone.accountId) {
          byPhone.accountId = accountId;
          player = byPhone;
        } else if (byPhone.accountId === accountId) {
          player = byPhone;
        } else {
          throw new ValidationError('This mobile number is linked to another account');
        }
      } else {
        player = byPhone;
      }
    }
  }

  if (player?.status === 'banned') throw new ValidationError('This number cannot make bookings. Contact support.');

  if (req.useWallet && player) {
    const isOwner = Boolean(!player.accountId || player.accountId === accountId);
    if (!isOwner || (clerkEnabled && (!accountId || player.accountId !== accountId))) {
      throw new ValidationError('Sign in to use your wallet balance');
    }
  }

  if (!player) {
    const referrer = db.settings.referralEnabled ? findByReferralCode(db, req.referralCode) : undefined;
    if (strict && req.referralCode?.trim() && !referrer) throw new ValidationError('That referral code is not valid');
    player = createPlayer(db, name, phone || '0000000000', referrer && referrer.status === 'active' ? referrer.id : null, accountId);
  } else if (accountId && !player.accountId) {
    player.accountId = accountId;
  }

  const isOwner = Boolean(player && (!player.accountId || player.accountId === accountId));
  const canAccessWallet = Boolean(
    player &&
    player.status === 'active' &&
    isOwner &&
    (!clerkEnabled || Boolean(accountId && player.accountId === accountId))
  );
  const walletBalance = canAccessWallet ? player.walletBalance : 0;

  const bookings: Booking[] = [];
  const adjustments = new Map<string, number>();
  const addAdjustment = (line: PriceLine | null) => line && adjustments.set(line.label, (adjustments.get(line.label) ?? 0) + line.amount);
  let promoError: string | null = null;
  let promoCode: string | null = null;
  let slotError: string | null = null;
  let addOns: BookingAddOn[] = [];

  const bookingId = newId('bk');
  const bookingCode = newBookingCode(db);
  const items: BookingItem[] = [];
  const slotQuotes: { hour: number; label: string; price: number }[] = [];
  let totalBasePrice = 0;
  let totalSlotPrice = 0;
  let totalAddOnTotal = 0;
  let totalSubtotal = 0;
  let totalWalletDeduction = 0;
  let totalTotal = 0;
  let totalAdvance = 0;
  let combinedOffer: PriceLine | null = null;
  let combinedPromo: PriceLine | null = null;
  const combinedAdjustments: PriceLine[] = [];

  hours.forEach((hour, i) => {
    const quote = buildQuote(
      db,
      { turfId: turf.id, date: req.date, hour, promoCode: req.promoCode, addOns: i === 0 ? req.addOns : [], useWallet: req.useWallet, phone, accountId, source: 'online', holder, size },
      now
    );
    if (!quote) throw new ValidationError('Turf not found');
    slotError ??= quote.slotError;
    promoError ??= quote.promoError;
    promoCode ??= quote.promoCode;
    if (i === 0) addOns = quote.addOns;
    addAdjustment(quote.breakdown.offer);
    addAdjustment(quote.breakdown.promo);

    if (quote.breakdown.offer) {
      combinedOffer = combinedOffer
        ? { label: 'Special offer', amount: combinedOffer.amount + quote.breakdown.offer.amount }
        : quote.breakdown.offer;
    }
    if (quote.breakdown.promo) {
      combinedPromo = combinedPromo
        ? { label: quote.breakdown.promo.label, amount: combinedPromo.amount + quote.breakdown.promo.amount }
        : quote.breakdown.promo;
    }
    for (const adj of quote.breakdown.adjustments) {
      combinedAdjustments.push(adj);
    }

    totalBasePrice += quote.breakdown.basePrice;
    totalSlotPrice += quote.breakdown.slotPrice;
    totalAddOnTotal += quote.breakdown.addOnTotal;
    totalSubtotal += quote.breakdown.subtotal;
    totalWalletDeduction += quote.breakdown.walletDeduction;
    totalTotal += quote.breakdown.total;
    totalAdvance += quote.breakdown.advance;

    // Land on the half this device is holding, else the first free one (the quote skips this check)
    const held = db.holds.find((h) => h.holder === holder && h.turfId === turf.id && h.date === req.date && h.hour === hour);
    const heldPart = held && ((held.pitch ?? 'full') === 'full') === (size === 'full') ? (held.pitch ?? 'full') : null;
    const pitch = heldPart ?? freePart(db, turf, req.date, hour, size, holder) ?? (size === 'half' ? 'A' : 'full');

    const item: BookingItem = {
      id: newId('bki'),
      bookingId,
      hour,
      timeLabel: formatHour(hour),
      durationMinutes: 60,
      ...(pitch !== 'full' ? { pitch } : {}),
      price: quote.breakdown.slotPrice,
    };
    items.push(item);
    slotQuotes.push({ hour, label: formatHour(hour), price: quote.breakdown.slotPrice });
  });

  // A code is used up once per checkout, however many hours it covered. Every hour above was checked
  // against the counts as they were before this checkout, so a 3-hour booking is not refused halfway.
  if (promoCode) {
    const used = db.promoCodes.find((p) => p.code === promoCode);
    if (used) {
      used.uses += 1;
      if (phone.length === 10) used.redeemedBy = { ...used.redeemedBy, [phone]: (used.redeemedBy?.[phone] ?? 0) + 1 };
    }
  }

  const totalDurationMinutes = hours.length * 60;
  const primaryPitch = items[0]?.pitch;
  const isUniformPitch = items.every((it) => it.pitch === primaryPitch);

  const combinedPricing: PriceBreakdown = {
    basePrice: totalBasePrice,
    adjustments: combinedAdjustments,
    slotPrice: totalSlotPrice,
    offer: combinedOffer,
    promo: combinedPromo,
    addOnTotal: totalAddOnTotal,
    subtotal: totalSubtotal,
    walletDeduction: totalWalletDeduction,
    total: totalTotal,
    advance: totalAdvance,
  };

  const booking: Booking = {
    id: bookingId,
    code: bookingCode,
    turfId: turf.id,
    date: req.date,
    hour: hours[0],
    hours,
    timeLabel: formatSlotRange(hours[0], totalDurationMinutes),
    durationMinutes: totalDurationMinutes,
    ...(isUniformPitch && primaryPitch && primaryPitch !== 'full' ? { pitch: primaryPitch } : {}),
    customerName: name,
    customerPhone: phone,
    playerId: player.id,
    accountId: accountId ?? null,
    source: 'online',
    createdBy: null,
    addOns,
    items,
    pricing: combinedPricing,
    paymentMode: 'venue',
    amountPaid: 0,
    status: 'confirmed',
    checkedInAt: null,
    createdAt: new Date().toISOString(),
  };

  db.bookings.push(booking);
  if (totalWalletDeduction > 0) {
    walletTxn(db, player, -totalWalletDeduction, 'booking_payment', `Booking ${booking.code}`, booking.id);
  }
  bookings.push(booking);

  const payNow = totalAdvance;
  const quote: SelectionQuote = {
    slots: slotQuotes,
    slotTotal: totalSlotPrice,
    adjustments: [...adjustments].map(([label, amount]) => ({ label, amount })),
    addOns,
    addOnTotal: totalAddOnTotal,
    walletBalance,
    walletDeduction: totalWalletDeduction,
    total: totalTotal,
    advancePercent: totalTotal > 0 ? Math.round((payNow / totalTotal) * 1000) / 10 : 0, // what is actually asked, after the limits
    minAdvance: db.settings.minAdvance,
    maxAdvance: db.settings.maxAdvance,
    payNow,
    payAtVenue: totalTotal - payNow,
    promoCode,
    promoError: req.promoCode ? promoError : null,
    slotError,
  };
  return { bookings, quote };
}
