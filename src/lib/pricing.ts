import type {
  AddOn,
  BookingAddOn,
  Database,
  Offer,
  PriceBreakdown,
  PriceLine,
  PricingRules,
  PromoCode,
  Slot,
  Turf,
} from './types';
import { formatHour, isWeekend, parseHour, type IstNow } from './time';

export const DEFAULT_PRICING: PricingRules = {
  peakEnabled: true,
  peakStartHour: 17,
  peakEndHour: 22,
  peakPercent: 30,
  weekendEnabled: true,
  weekendPercent: 15,
  lastMinuteEnabled: true,
  lastMinuteHours: 2,
  lastMinutePercent: 25,
};

const pct = (amount: number, percent: number) => Math.round((amount * percent) / 100);

export function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export function turfHours(turf: Turf) {
  const open = parseHour(turf.openTime);
  let close = parseHour(turf.closeTime);
  if (close <= open) close = 24; // e.g. open till midnight
  const hours: number[] = [];
  for (let h = open; h < close; h++) hours.push(h);
  return hours;
}

// Dynamic price of one slot: peak / weekend markups, then last-minute discount
export function slotPrice(turf: Turf, rules: PricingRules, date: string, hour: number, now: IstNow) {
  const base = turf.pricePerHour;
  const adjustments: PriceLine[] = [];
  const tags: string[] = [];

  if (rules.peakEnabled && hour >= rules.peakStartHour && hour < rules.peakEndHour && rules.peakPercent) {
    adjustments.push({ label: `Peak hours (+${rules.peakPercent}%)`, amount: pct(base, rules.peakPercent) });
    tags.push('Peak');
  }
  if (rules.weekendEnabled && isWeekend(date) && rules.weekendPercent) {
    adjustments.push({ label: `Weekend (+${rules.weekendPercent}%)`, amount: pct(base, rules.weekendPercent) });
    tags.push('Weekend');
  }

  const marked = base + adjustments.reduce((s, a) => s + a.amount, 0);
  const hoursUntil = date === now.date ? hour - now.hour - now.minute / 60 : Infinity;
  if (rules.lastMinuteEnabled && rules.lastMinutePercent && hoursUntil > 0 && hoursUntil <= rules.lastMinuteHours) {
    adjustments.push({ label: `Last-minute deal (-${rules.lastMinutePercent}%)`, amount: -pct(marked, rules.lastMinutePercent) });
    tags.push(`-${rules.lastMinutePercent}% last minute`);
  }

  const price = Math.max(0, base + adjustments.reduce((s, a) => s + a.amount, 0));
  return { basePrice: base, adjustments, price, tags };
}

export function rulesFor(db: Database, turfId: string) {
  return db.pricing[turfId] ?? DEFAULT_PRICING;
}

const ACTIVE_BOOKING = new Set(['confirmed', 'checked_in', 'no_show']);

export function getSlots(db: Database, turf: Turf, date: string, now: IstNow): Slot[] {
  const rules = rulesFor(db, turf.id);
  const booked = new Set(
    db.bookings.filter((b) => b.turfId === turf.id && b.date === date && ACTIVE_BOOKING.has(b.status)).map((b) => b.hour)
  );
  const blocked = new Set(db.blocks.filter((b) => b.turfId === turf.id && b.date === date).map((b) => b.hour));
  const happyHours = db.offers.filter((o) => o.turfId === turf.id && o.active && o.type === 'happy_hour');

  return turfHours(turf).map((hour) => {
    const { basePrice, price, tags } = slotPrice(turf, rules, date, hour, now);
    const past = date < now.date || (date === now.date && hour <= now.hour);
    const reason = past ? 'past' : booked.has(hour) ? 'booked' : blocked.has(hour) ? 'blocked' : null;
    const happy = happyHours.find((o) => hour >= o.startHour && hour < o.endHour);
    return {
      date,
      hour,
      label: formatHour(hour),
      basePrice,
      price,
      tags: happy ? [...tags, `${happy.title} -${happy.percentOff}%`] : tags,
      available: reason === null,
      reason,
    };
  });
}

// Best single owner offer for this booking (offers don't stack)
export function bestOffer(offers: Offer[], hour: number, firstTime: boolean, price: number): PriceLine | null {
  let best: PriceLine | null = null;
  for (const o of offers) {
    if (!o.active) continue;
    if (o.type === 'happy_hour' && !(hour >= o.startHour && hour < o.endHour)) continue;
    if (o.type === 'first_time' && !firstTime) continue;
    const amount = pct(price, o.percentOff);
    if (!best || amount > -best.amount) best = { label: `${o.title} (-${o.percentOff}%)`, amount: -amount };
  }
  return best;
}

export function promoDiscount(promo: PromoCode, price: number, date: string): { amount: number; error: string | null } {
  if (!promo.active) return { amount: 0, error: 'This promo code has expired' };
  if (promo.weekendOnly && !isWeekend(date)) return { amount: 0, error: 'This code is valid on weekends only' };
  let amount = promo.kind === 'percent' ? pct(price, promo.value) : promo.value;
  if (promo.maxDiscount !== null) amount = Math.min(amount, promo.maxDiscount);
  return { amount: Math.min(amount, price), error: null };
}

export interface QuoteInput {
  turfId: string;
  date: string;
  hour: number;
  promoCode?: string | null;
  addOns?: { id: string; qty: number }[];
  useWallet?: boolean;
  phone?: string | null;
  source?: 'online' | 'walk_in';
}

export interface Quote {
  breakdown: PriceBreakdown;
  addOns: BookingAddOn[];
  promoCode: string | null;
  promoError: string | null;
  walletBalance: number;
  firstTime: boolean;
  slotError: string | null;
}

export function buildQuote(db: Database, input: QuoteInput, now: IstNow): Quote | null {
  const turf = db.turfs.find((t) => t.id === input.turfId);
  if (!turf) return null;

  const slot = getSlots(db, turf, input.date, now).find((s) => s.hour === input.hour);
  const slotError = !slot ? 'This slot does not exist' : slot.available ? null : `This slot is ${slot.reason === 'past' ? 'over' : 'not available'}`;

  const { basePrice, adjustments, price: slotPriceValue } = slotPrice(turf, rulesFor(db, turf.id), input.date, input.hour, now);

  const phone = input.phone ? normalizePhone(input.phone) : '';
  const player = phone.length === 10 ? db.players.find((p) => p.phone === phone) : undefined;
  const firstTime =
    input.source !== 'walk_in' &&
    phone.length === 10 &&
    !db.bookings.some((b) => b.customerPhone === phone && b.status !== 'cancelled');

  const turfOffers = db.offers.filter((o) => o.turfId === turf.id);
  const offer = input.source === 'walk_in' ? null : bestOffer(turfOffers, input.hour, firstTime, slotPriceValue);
  let running = slotPriceValue + (offer?.amount ?? 0);

  let promo: PriceLine | null = null;
  let promoError: string | null = null;
  let promoCode: string | null = null;
  const code = input.promoCode?.trim().toUpperCase();
  if (code) {
    const found = db.promoCodes.find((p) => p.code === code);
    if (!found) {
      promoError = 'Invalid promo code';
    } else {
      const result = promoDiscount(found, running, input.date);
      promoError = result.error;
      if (!result.error && result.amount > 0) {
        promo = { label: `Promo ${code}`, amount: -result.amount };
        promoCode = code;
        running -= result.amount;
      }
    }
  }

  const activeAddOns = new Map<string, AddOn>(db.addOns.filter((a) => a.turfId === turf.id && a.active).map((a) => [a.id, a]));
  const addOns: BookingAddOn[] = [];
  for (const { id, qty } of input.addOns ?? []) {
    const a = activeAddOns.get(id);
    const n = Math.min(20, Math.max(0, Math.floor(qty)));
    if (a && n > 0) addOns.push({ id: a.id, name: a.name, price: a.price, qty: n });
  }
  const addOnTotal = addOns.reduce((s, a) => s + a.price * a.qty, 0);

  const subtotal = Math.max(0, running) + addOnTotal;
  const walletBalance = player && player.status === 'active' ? player.walletBalance : 0;
  const walletDeduction = input.useWallet ? Math.min(walletBalance, subtotal) : 0;
  const total = subtotal - walletDeduction;

  return {
    breakdown: {
      basePrice,
      adjustments,
      slotPrice: slotPriceValue,
      offer,
      promo,
      addOnTotal,
      subtotal,
      walletDeduction,
      total,
      advance: Math.round((total * db.settings.advancePercent) / 100),
    },
    addOns,
    promoCode,
    promoError,
    walletBalance,
    firstTime,
    slotError,
  };
}

// GST is included in the booking price; split it out for invoices
export function gstSplit(total: number, gstPercent: number) {
  const taxable = Math.round((total * 100) / (100 + gstPercent));
  const tax = total - taxable;
  const cgst = Math.floor(tax / 2);
  return { taxable, tax, cgst, sgst: tax - cgst };
}

export function commissionFor(db: Database, turf: Turf) {
  return turf.commissionPercent ?? db.settings.commissionPercent;
}
