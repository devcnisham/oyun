import type {
  AddOn,
  BookingAddOn,
  Database,
  Offer,
  PriceBreakdown,
  PlatformSettings,
  PriceLine,
  PricingRules,
  PitchPart,
  PitchSize,
  PromoCode,
  Slot,
  PublicTurf,
  Turf,
} from './types';
import { formatHour, isWeekend, parseHour, type IstNow } from './time';
import { clerkEnabled } from './clerk';

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

export function turfHours(turf: PublicTurf) {
  const open = parseHour(turf.openTime);
  let close = parseHour(turf.closeTime);
  if (close <= open) close = 24; // e.g. open till midnight
  const hours: number[] = [];
  for (let h = open; h < close; h++) hours.push(h);
  return hours;
}

/* ---------- full or half pitch ---------- */

// A half costs halfPricePercent of the full pitch (50% unless the turf says otherwise), rounded to ₹10
export function hourlyRate(turf: PublicTurf, size: PitchSize) {
  if (size === 'full' || !turf.halfPitch) return turf.pricePerHour;
  return Math.round((turf.pricePerHour * (turf.halfPricePercent ?? 50)) / 1000) * 10;
}

// Which halves a booking, hold or block covers
const HALVES: Record<PitchPart, ('A' | 'B')[]> = { full: ['A', 'B'], A: ['A'], B: ['B'] };
const halvesOf = (part: PitchPart | undefined) => HALVES[part ?? 'full'];

// " · Half pitch (A)" for half-pitch bookings, nothing for the whole pitch
export const halfNote = (part: PitchPart | undefined) => (part === 'A' || part === 'B' ? ` · ${pitchLabel(part)}` : '');

function pitchLabel(part: PitchPart | undefined) {
  return part === 'A' ? 'Half pitch (A)' : part === 'B' ? 'Half pitch (B)' : 'Full pitch';
}

// Dynamic price of one slot: peak / weekend markups, then last-minute discount
export function slotPrice(turf: PublicTurf, rules: PricingRules, date: string, hour: number, now: IstNow, size: PitchSize = 'full') {
  const base = hourlyRate(turf, size);
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

// Halves of each hour already taken by live bookings, other devices' holds, or blocks (a block closes both halves)
function takenHalves(db: Database, turf: PublicTurf, date: string, holder: string | null) {
  const nowIso = new Date().toISOString();
  const booked = new Map<number, Set<string>>();
  const held = new Map<number, Set<string>>();
  const add = (map: Map<number, Set<string>>, hour: number, part: PitchPart | undefined) => {
    const set = map.get(hour) ?? new Set<string>();
    for (const h of halvesOf(part)) set.add(h);
    map.set(hour, set);
  };
  for (const b of db.bookings) if (b.turfId === turf.id && b.date === date && ACTIVE_BOOKING.has(b.status)) add(booked, b.hour, b.pitch);
  for (const h of db.holds ?? []) if (h.turfId === turf.id && h.date === date && h.expiresAt > nowIso && h.holder !== holder) add(held, h.hour, h.pitch);
  const blocked = new Set(db.blocks.filter((b) => b.turfId === turf.id && b.date === date).map((b) => b.hour));
  return { booked, held, blocked };
}

// The part of the pitch a new booking takes: the whole pitch, or the first free half. Null when none is free.
export function freePart(db: Database, turf: PublicTurf, date: string, hour: number, size: PitchSize, holder: string | null): PitchPart | null {
  const { booked, held, blocked } = takenHalves(db, turf, date, holder);
  if (blocked.has(hour)) return null;
  const taken = new Set([...(booked.get(hour) ?? []), ...(held.get(hour) ?? [])]);
  if (size === 'full' || !turf.halfPitch) return taken.size === 0 ? 'full' : null;
  return !taken.has('A') ? 'A' : !taken.has('B') ? 'B' : null;
}

// `holder` is the device checking out: its own holds count as available
// walkIn: the owner can still seat someone at the desk during the hour that has just started
// size: full pitch, or one half (any free half) on turfs that split
export function getSlots(db: Database, turf: PublicTurf, date: string, now: IstNow, holder: string | null = null, walkIn = false, size: PitchSize = 'full'): Slot[] {
  const rules = rulesFor(db, turf.id);
  const nowIso = new Date().toISOString();
  const half = size === 'half' && turf.halfPitch;
  const { booked, held, blocked } = takenHalves(db, turf, date, holder);
  const ownHolds = new Set((db.holds ?? []).filter((h) => h.turfId === turf.id && h.date === date && h.expiresAt > nowIso && h.holder === holder).map((h) => h.hour));
  const happyHours = db.offers.filter((o) => o.turfId === turf.id && o.active && o.type === 'happy_hour');

  return turfHours(turf).map((hour) => {
    const { basePrice, price, tags } = slotPrice(turf, rules, date, hour, now, half ? 'half' : 'full');
    const past = date < now.date || (date === now.date && (walkIn ? hour < now.hour : hour <= now.hour));
    const b = booked.get(hour) ?? new Set<string>();
    const h = held.get(hour) ?? new Set<string>();
    // Full pitch needs both halves free; a half needs one half that is neither booked nor held
    const free = (['A', 'B'] as const).filter((x) => !b.has(x) && !h.has(x));
    const fullyBooked = half ? b.size === 2 : b.size > 0;
    const reason = past ? 'past' : fullyBooked ? 'booked' : blocked.has(hour) ? 'blocked' : free.length >= (half ? 1 : 2) ? null : 'held';
    const heldByYou = ownHolds.has(hour);
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
      ...(heldByYou && reason === null ? { heldByYou: true } : {}),
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

// Limits an admin can put on a code: an end date, a total number of checkouts, and a cap per player.
// Returns the message to show, or null when the code may be used now by this phone number.
export function promoRestriction(promo: PromoCode, today: string, phone: string): string | null {
  if (promo.expiresOn && today > promo.expiresOn) return 'This promo code has expired';
  if (promo.maxUses != null && promo.uses >= promo.maxUses) return 'This promo code has been fully used';
  if (promo.perPlayerLimit != null) {
    if (phone.length !== 10) return 'Enter your phone number to use this code';
    if ((promo.redeemedBy?.[phone] ?? 0) >= promo.perPlayerLimit) return 'You have already used this promo code';
  }
  return null;
}

export interface QuoteInput {
  turfId: string;
  date: string;
  hour: number;
  promoCode?: string | null;
  addOns?: { id: string; qty: number }[];
  useWallet?: boolean;
  phone?: string | null;
  accountId?: string | null;
  source?: 'online' | 'walk_in';
  holder?: string | null;
  size?: PitchSize;
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

  const size = input.size === 'half' && turf.halfPitch ? 'half' : 'full';
  const slot = getSlots(db, turf, input.date, now, input.holder ?? null, input.source === 'walk_in', size).find((s) => s.hour === input.hour);
  const slotError = !slot ? 'This slot does not exist' : slot.available ? null : slot.reason === 'held' ? 'Someone else is checking out this slot right now' : `This slot is ${slot.reason === 'past' ? 'over' : 'not available'}`;

  const { basePrice, adjustments, price: slotPriceValue } = slotPrice(turf, rulesFor(db, turf.id), input.date, input.hour, now, size);

  const phone = input.phone ? normalizePhone(input.phone) : '';
  const player = input.accountId
    ? (db.players.find((p) => p.accountId === input.accountId) ?? (phone.length === 10 ? db.players.find((p) => p.phone === phone) : undefined))
    : phone.length === 10
      ? db.players.find((p) => p.phone === phone)
      : undefined;
  const firstTime =
    input.source !== 'walk_in' &&
    phone.length === 10 &&
    !db.bookings.some((b) => b.customerPhone === phone && b.status !== 'cancelled' && b.status !== 'refunded');

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
      const restriction = promoRestriction(found, now.date, phone);
      const result = restriction ? { amount: 0, error: restriction } : promoDiscount(found, running, input.date);
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
  const isOwner = Boolean(player && (!player.accountId || player.accountId === input.accountId));
  const canAccessWallet = Boolean(
    player &&
    player.status === 'active' &&
    isOwner &&
    (!clerkEnabled || Boolean(input.accountId && player.accountId === input.accountId))
  );
  const walletBalance = canAccessWallet ? player!.walletBalance : 0;
  const walletDeduction = input.useWallet && canAccessWallet ? Math.min(walletBalance, subtotal) : 0;
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
      advance: advanceDue(db.settings, total),
    },
    addOns,
    promoCode,
    promoError,
    walletBalance,
    firstTime,
    slotError,
  };
}

// Advance paid online for ONE hour of a booking: advancePercent of that hour's price, kept between
// minAdvance and maxAdvance, and never more than the price. With the defaults (10%, 150 to 150) it is a
// flat ₹150 per hour, so 3 hours is ₹450. Set the limits apart in Admin → Settings to let the percentage show.
export function advanceDue(settings: Pick<PlatformSettings, 'advancePercent' | 'minAdvance' | 'maxAdvance'>, total: number) {
  if (total <= 0) return 0;
  const min = settings.minAdvance ?? 0;
  const max = Math.max(min, settings.maxAdvance ?? Infinity);
  const byPercent = Math.round((total * settings.advancePercent) / 100);
  return Math.min(total, Math.min(max, Math.max(min, byPercent)));
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
