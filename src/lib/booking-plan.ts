// Server-side booking planner: finds a bookable turf and prices and books every chosen hour against a
// database copy. It imports the store and wallet, so only server code (booking-actions, tests) may use it.
// Client-safe request types, limits and cleaners live in booking-types.ts.
import { ValidationError } from './errors';
import { cleanHours, cleanSize, type BookingRequest, type SelectionQuote } from './booking-types';
import { buildQuote, freePart, normalizePhone } from './pricing';
import { newBookingCode, newId } from './store';
import { formatHour, istNow } from './time';
import type { Booking, BookingAddOn, Database, PriceLine } from './types';
import { createPlayer, findByReferralCode, walletTxn } from './wallet';

export function bookableTurf(db: Database, turfId: string) {
  const turf = db.turfs.find((t) => t.id === turfId);
  return turf && turf.status === 'active' ? turf : null;
}

/*
 * Books every chosen hour against `db` and returns the bookings plus the price summary.
 * The quote runs this on a throwaway copy, so the price shown is exactly what booking charges.
 * Add-ons are attached to the first hour only.
 */
export function planBooking(db: Database, req: BookingRequest, holder: string | null, strict: boolean) {
  const turf = bookableTurf(db, req.turfId);
  if (!turf) throw new ValidationError('This turf is not taking bookings right now');
  const hours = cleanHours(req.hours);
  const size = turf.halfPitch ? cleanSize(req.size) : 'full';
  const phone = normalizePhone(req.phone);
  const name = req.name.trim().slice(0, 80) || 'Player';
  const now = istNow();

  let player = phone.length === 10 ? db.players.find((p) => p.phone === phone) : undefined;
  if (player?.status === 'banned') throw new ValidationError('This number cannot make bookings. Contact support.');
  const walletBalance = player && player.status === 'active' ? player.walletBalance : 0;
  if (!player) {
    const referrer = db.settings.referralEnabled ? findByReferralCode(db, req.referralCode) : undefined;
    if (strict && req.referralCode?.trim() && !referrer) throw new ValidationError('That referral code is not valid');
    player = createPlayer(db, name, phone || '0000000000', referrer && referrer.status === 'active' ? referrer.id : null);
  }

  const bookings: Booking[] = [];
  const adjustments = new Map<string, number>();
  const addAdjustment = (line: PriceLine | null) => line && adjustments.set(line.label, (adjustments.get(line.label) ?? 0) + line.amount);
  let promoError: string | null = null;
  let promoCode: string | null = null;
  let slotError: string | null = null;
  let addOns: BookingAddOn[] = [];

  hours.forEach((hour, i) => {
    const quote = buildQuote(
      db,
      { turfId: turf.id, date: req.date, hour, promoCode: req.promoCode, addOns: i === 0 ? req.addOns : [], useWallet: req.useWallet, phone, source: 'online', holder, size },
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
    const heldPart = held && ((held.pitch ?? 'full') === 'full') === (size === 'full') ? (held.pitch ?? 'full') : null;
    const pitch = heldPart ?? freePart(db, turf, req.date, hour, size, holder) ?? (size === 'half' ? 'A' : 'full');

    const booking: Booking = {
      id: newId('bk'),
      code: newBookingCode(db),
      turfId: turf.id,
      date: req.date,
      hour,
      timeLabel: formatHour(hour),
      ...(pitch !== 'full' ? { pitch } : {}),
      customerName: name,
      customerPhone: phone,
      playerId: player.id,
      source: 'online',
      createdBy: null,
      addOns: quote.addOns,
      pricing: quote.breakdown,
      // Nothing is charged online. The advance (pricing.advance) and the balance are both paid at the turf,
      // so nothing counts as paid until check-in.
      paymentMode: 'venue',
      amountPaid: 0,
      status: 'confirmed',
      checkedInAt: null,
      createdAt: new Date().toISOString(),
    };
    db.bookings.push(booking);
    // Deducting as we go means the next hour's quote sees the remaining balance
    walletTxn(db, player, -quote.breakdown.walletDeduction, 'booking_payment', `Booking ${booking.code}`, booking.id);
    bookings.push(booking);
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

  // Each hour carries its own advance (so 3 hours at ₹150 an hour is ₹450)
  const sum = (f: (b: Booking) => number) => bookings.reduce((s, b) => s + f(b), 0);
  const total = sum((b) => b.pricing.total);
  const payNow = sum((b) => b.pricing.advance); // advance due at the turf
  const quote: SelectionQuote = {
    slots: bookings.map((b) => ({ hour: b.hour, label: b.timeLabel, price: b.pricing.slotPrice })),
    slotTotal: sum((b) => b.pricing.slotPrice),
    adjustments: [...adjustments].map(([label, amount]) => ({ label, amount })),
    addOns,
    addOnTotal: sum((b) => b.pricing.addOnTotal),
    walletBalance,
    walletDeduction: sum((b) => b.pricing.walletDeduction),
    total,
    advancePercent: total > 0 ? Math.round((payNow / total) * 1000) / 10 : 0, // what is actually asked, after the limits
    minAdvance: db.settings.minAdvance,
    maxAdvance: db.settings.maxAdvance,
    payNow,
    payAtVenue: total - payNow,
    promoCode,
    promoError: req.promoCode ? promoError : null,
    slotError,
  };
  return { bookings, quote };
}
