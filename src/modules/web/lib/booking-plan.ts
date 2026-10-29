import { paymentAmounts } from './payment-options';
// Server-side booking planner: finds a bookable turf and prices and books every chosen hour against a
// database copy. It imports the store and wallet, so only server code (booking-actions, tests) may use it.
// Client-safe request types, limits and cleaners live in booking-types.ts.
import { ValidationError } from '@/modules/shared/backend/errors';
import { cleanHours, cleanSide, cleanSize, type BookingRequest, type SelectionQuote } from '@/modules/web/lib/booking-types';
import { buildQuote, freePart, normalizePhone } from '@/modules/shared/lib/pricing';
import { newBookingCode, newId } from '@/modules/shared/database/store';
import { formatSlotRange, istNow } from '@/modules/shared/lib/time';
import type { Booking, BookingAddOn, BookingItem, Database, PriceBreakdown, PriceLine } from '@/modules/shared/database/types';
import { createPlayer, findByReferralCode, walletTxn } from '@/modules/shared/lib/wallet';

export function bookableTurf(db: Database, turfId: string) {
  const turf = db.turfs.find((t) => t.id === turfId);
  return turf && turf.status === 'active' ? turf : null;
}

/*
 * Books every chosen hour against `db` and returns the bookings plus the price summary.
 * The quote runs this on a throwaway copy, so the price shown is exactly what booking charges.
 * Add-ons are attached to the first hour only.
 */
export function planBooking(
  db: Database,
  req: BookingRequest,
  holder: string | null,
  strict: boolean,
  accountId: string | null = null,
  // The id and code the booking already has when its record was made elsewhere (the v2 checkout)
  fixed?: { id: string; code: string }
) {
  const turf = bookableTurf(db, req.turfId);
  if (!turf) throw new ValidationError('This turf is not taking bookings right now');
  const hours = cleanHours(req.hours);
  const size = turf.halfPitch ? cleanSize(req.size) : 'full';
  const side = size === 'half' ? cleanSide(req.side) : undefined;
  const phone = normalizePhone(req.phone);
  const name = req.name.trim().slice(0, 80) || 'Player';
  const now = istNow();

  // Lookup player by Clerk accountId first (P9-03), falling back to phone
  let player = accountId
    ? db.players.find((p) => p.accountId === accountId)
    : undefined;

  if (!player && phone.length === 10) {
    const existing = db.players.find((p) => p.phone === phone);
    if (existing) {
      if (accountId && existing.accountId && existing.accountId !== accountId) {
        throw new ValidationError('This mobile number belongs to another registered account.');
      }
      if (accountId && !existing.accountId) {
        existing.accountId = accountId;
      }
      player = existing;
    }
  }

  if (player?.status === 'banned') throw new ValidationError('This number cannot make bookings. Contact support.');

  if (!player) {
    const referrer = db.settings.referralEnabled ? findByReferralCode(db, req.referralCode) : undefined;
    if (strict && req.referralCode?.trim() && !referrer) throw new ValidationError('That referral code is not valid');
    player = createPlayer(db, name, phone || '0000000000', referrer && referrer.status === 'active' ? referrer.id : null, accountId);
  }

  const walletAllowed = !player.accountId || player.accountId === accountId;
  const walletBalance = player.status === 'active' && walletAllowed ? player.walletBalance : 0;

  const items: BookingItem[] = [];
  const adjustments = new Map<string, number>();
  const addAdjustment = (line: PriceLine | null) => line && adjustments.set(line.label, (adjustments.get(line.label) ?? 0) + line.amount);
  let promoError: string | null = null;
  let promoCode: string | null = null;
  let slotError: string | null = null;
  let addOns: BookingAddOn[] = [];

  let totalBasePrice = 0;
  let totalSlotPrice = 0;
  let totalWalletDeduction = 0;
  let totalSubtotal = 0;
  let totalOrder = 0;
  let totalAdvance = 0;

  hours.forEach((hour, i) => {
    const quote = buildQuote(
      db,
      { turfId: turf.id, date: req.date, hour, promoCode: req.promoCode, addOns: i === 0 ? req.addOns : [], useWallet: req.useWallet, phone, accountId, source: 'online', holder, size, side },
      now
    );
    if (!quote) throw new ValidationError('Turf not found');
    slotError ??= quote.slotError;
    promoError ??= quote.promoError;
    promoCode ??= quote.promoCode;
    if (i === 0) addOns = quote.addOns;
    addAdjustment(quote.breakdown.offer);
    addAdjustment(quote.breakdown.promo);

    // Land on the half this device is holding, else the first free one (the quote skips this check)
    const held = db.holds.find((h) => h.holder === holder && h.turfId === turf.id && h.date === req.date && h.hour === hour);
    const heldPart = held && ((held.pitch ?? 'full') === 'full') === (size === 'full') && (!side || held.pitch === side) ? (held.pitch ?? 'full') : null;
    const pitch = heldPart ?? freePart(db, turf, req.date, hour, size, holder, side) ?? side ?? (size === 'half' ? 'A' : 'full');

    const item: BookingItem = {
      id: newId('item'),
      hour,
      timeLabel: formatSlotRange(hour, 60, 0),
      durationMinutes: 60,
      startMinute: 0,
      ...(pitch !== 'full' ? { pitch } : {}),
      price: quote.breakdown.slotPrice,
    };
    items.push(item);

    totalBasePrice += quote.breakdown.basePrice;
    totalSlotPrice += quote.breakdown.slotPrice;
    totalWalletDeduction += quote.breakdown.walletDeduction;
    totalSubtotal += quote.breakdown.subtotal;
    totalOrder += quote.breakdown.total;

  });

  const payment = paymentAmounts(totalOrder, req.paymentOption);
  totalAdvance = payment.due;

  // A code is used up once per checkout, however many hours it covered.
  if (promoCode) {
    const used = db.promoCodes.find((p) => p.code === promoCode);
    if (used) {
      used.uses += 1;
      if (phone.length === 10) used.redeemedBy = { ...used.redeemedBy, [phone]: (used.redeemedBy?.[phone] ?? 0) + 1 };
    }
  }

  const sortedHours = [...hours].sort((a, b) => a - b);
  const minHour = sortedHours[0] ?? 0;
  const durationTotalMinutes = Math.max(60, hours.length * 60);
  const timeLabel = hours.length > 1 ? formatSlotRange(minHour, durationTotalMinutes, 0) : formatSlotRange(minHour, 60, 0);

  const combinedPricing: PriceBreakdown = {
    basePrice: totalBasePrice,
    adjustments: [...adjustments].map(([label, amount]) => ({ label, amount })),
    slotPrice: totalSlotPrice,
    offer: adjustments.get('Offer') ? { label: 'Offer', amount: adjustments.get('Offer')! } : null,
    promo: adjustments.get('Promo') ? { label: 'Promo', amount: adjustments.get('Promo')! } : null,
    addOnTotal: addOns.reduce((s, a) => s + a.price * a.qty, 0),
    subtotal: totalSubtotal,
    walletDeduction: totalWalletDeduction,
    total: totalOrder,
    advance: totalAdvance,
  };

  const bookingId = fixed?.id ?? newId('bk');
  const code = fixed?.code ?? newBookingCode(db);

  const singleBooking: Booking = {
    id: bookingId,
    code,
    turfId: turf.id,
    date: req.date,
    hour: minHour,
    hours: sortedHours,
    items,
    timeLabel,
    durationMinutes: durationTotalMinutes,
    startMinute: 0,
    ...(items[0]?.pitch && items[0].pitch !== 'full' ? { pitch: items[0].pitch } : {}),
    customerName: name,
    customerPhone: phone,
    playerId: player.id,
    source: 'online',
    createdBy: null,
    addOns,
    pricing: combinedPricing,
    paymentMode: 'venue',
    amountPaid: 0,
    status: 'confirmed',
    checkedInAt: null,
    accountId: accountId ?? null,
    createdAt: new Date().toISOString(),
  };

  db.bookings.push(singleBooking);
  if (totalWalletDeduction > 0) {
    walletTxn(db, player, -totalWalletDeduction, 'booking_payment', `Booking ${code}`, singleBooking.id);
  }

  const quote: SelectionQuote = {
    slots: items.map((item) => ({ hour: item.hour, label: item.timeLabel, price: item.price })),
    slotTotal: totalSlotPrice,
    adjustments: [...adjustments].map(([label, amount]) => ({ label, amount })),
    addOns,
    addOnTotal: combinedPricing.addOnTotal,
    walletBalance,
    walletDeduction: totalWalletDeduction,
    total: totalOrder,
    advancePercent: payment.percent,
    minAdvance: 0,
    maxAdvance: totalOrder,
    payNow: totalAdvance,
    payAtVenue: totalOrder - totalAdvance,
    promoCode,
    promoError: req.promoCode ? promoError : null,
    slotError,
  };

  return { bookings: [singleBooking], quote };
}
