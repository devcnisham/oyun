import type { SupabaseClient } from '@supabase/supabase-js';
import { addDays, formatSlotRange, istNow } from './time';
import type { V2Quote } from './v2-slots';
import type { Booking, BookingItem, BookingStatus, PaymentMode, PitchPart, PriceBreakdown, SlotBlock, SlotHold } from './types';

/*
 * Read layer for the oyun schema (docs/V2-INTEGRATION-PLAN.md, phase 2). The pages and dashboards work
 * on the app's Booking, SlotHold and SlotBlock shapes; these functions build them from oyun rows so
 * nothing above the store needs to know which schema a booking lives in.
 */

export interface V2ItemRow {
  id: string;
  during: string; // tstzrange text: ["2026-10-20 12:30:00+00","2026-10-20 13:30:00+00")
  price: number;
  bookables?: { name?: string } | null;
}

export interface V2BookingRow {
  id: string;
  legacy_id: string | null;
  code: string;
  holder: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  source: string;
  status: string;
  hold_expires_at: string | null;
  subtotal: number;
  discount: number;
  wallet_used: number;
  total: number;
  advance_due: number;
  amount_paid: number;
  price_breakdown: Record<string, unknown> | null;
  meta: Record<string, unknown> | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  checked_in_at: string | null;
  created_at: string;
  venues?: { slug?: string } | null;
  players?: { legacy_id?: string | null } | null;
  booking_items?: V2ItemRow[] | null;
}

export interface V2BlockRow {
  id: string;
  reason: string;
  created_at: string;
  during: string;
  venues?: { slug?: string } | null;
  bookables?: { name?: string } | null;
}

/** Opening hour of a turf (0 when unknown). Slots before it belong to the previous day's session. */
type OpenHourOf = (turfId: string) => number;

export function parseRange(during: string): { start: Date; end: Date } | null {
  const m = /^[[(]"?([^",]+)"?,\s*"?([^",)\]]+)"?[)\]]$/.exec(during.trim());
  if (!m) return null;
  // Postgres writes the offset as +00 or +05:30; JavaScript only reads the second form
  const iso = (t: string) => new Date(t.replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00'));
  const start = iso(m[1]);
  const end = iso(m[2]);
  return Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) ? null : { start, end };
}

// A slot after midnight belongs to the day the venue opened, with hours 24 and up (see R009)
function slotStart(range: { start: Date }, openHour: number) {
  const ist = istNow(range.start);
  return openHour > 0 && ist.hour < openHour
    ? { date: addDays(ist.date, -1), hour: ist.hour + 24, minute: ist.minute }
    : ist;
}

function pitchOf(bookableName?: string): PitchPart | undefined {
  if (!bookableName) return undefined;
  if (/half\s*pitch\s*a\b/i.test(bookableName)) return 'A';
  if (/half\s*pitch\s*b\b/i.test(bookableName)) return 'B';
  return undefined;
}

const STATUS: Record<string, BookingStatus> = {
  confirmed: 'confirmed',
  checked_in: 'checked_in',
  completed: 'checked_in',
  no_show: 'no_show',
  cancelled: 'cancelled',
};

function items(row: V2BookingRow, openHourOf: OpenHourOf) {
  const turfId = row.venues?.slug ?? '';
  const out: { date: string; item: BookingItem }[] = [];
  for (const it of row.booking_items ?? []) {
    const range = parseRange(it.during);
    if (!range) continue;
    const start = slotStart(range, openHourOf(turfId));
    const durationMinutes = Math.round((range.end.getTime() - range.start.getTime()) / 60_000);
    out.push({
      date: start.date,
      item: {
        id: it.id,
        hour: start.hour,
        timeLabel: formatSlotRange(start.hour, durationMinutes, start.minute),
        durationMinutes,
        startMinute: start.minute,
        pitch: pitchOf(it.bookables?.name),
        price: it.price,
      },
    });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date) || a.item.hour - b.item.hour || (a.item.startMinute ?? 0) - (b.item.startMinute ?? 0));
}

function pricingOf(row: V2BookingRow): PriceBreakdown {
  const saved = row.price_breakdown as Partial<PriceBreakdown> | null;
  if (saved && typeof saved.total === 'number') return saved as PriceBreakdown;
  return {
    basePrice: row.subtotal,
    adjustments: [],
    slotPrice: row.subtotal,
    offer: null,
    promo: row.discount > 0 ? { label: 'Discount', amount: -row.discount } : null,
    addOnTotal: 0,
    subtotal: row.subtotal - row.discount,
    walletDeduction: row.wallet_used,
    total: row.total,
    advance: row.advance_due,
  };
}

/** A confirmed, checked-in, cancelled or no-show booking. Holds and expired holds are not bookings. */
export function mapV2Booking(row: V2BookingRow, openHourOf: OpenHourOf = () => 0): Booking | null {
  const status = STATUS[row.status];
  if (!status) return null;
  const slots = items(row, openHourOf);
  if (slots.length === 0 || !row.venues?.slug) return null;
  const meta = (row.meta ?? {}) as Record<string, unknown>;
  const first = slots[0];
  const refunded = status === 'cancelled' && meta.refunded === true;
  return {
    id: row.legacy_id ?? row.id,
    code: row.code,
    turfId: row.venues.slug,
    date: first.date,
    hour: first.item.hour,
    hours: slots.map((s) => s.item.hour),
    items: slots.map((s) => s.item),
    timeLabel: first.item.timeLabel,
    durationMinutes: first.item.durationMinutes,
    startMinute: first.item.startMinute,
    pitch: first.item.pitch,
    customerName: row.customer_name ?? '',
    customerPhone: row.customer_phone ?? '',
    playerId: row.players?.legacy_id ?? null,
    source: row.source === 'online' ? 'online' : 'walk_in',
    createdBy: typeof meta.createdBy === 'string' ? meta.createdBy : null,
    addOns: Array.isArray(meta.addOns) ? (meta.addOns as Booking['addOns']) : [],
    pricing: pricingOf(row),
    paymentMode: (typeof meta.paymentMode === 'string' ? meta.paymentMode : 'venue') as PaymentMode,
    amountPaid: row.amount_paid,
    status: refunded ? 'refunded' : status,
    checkedInAt: row.checked_in_at,
    cashback: typeof meta.cashback === 'number' ? meta.cashback : undefined,
    cashCollected: meta.cashCollected as Booking['cashCollected'],
    accountId: typeof meta.accountId === 'string' ? meta.accountId : null,
    review: (meta.review as Booking['review']) ?? null,
    cancelledAt: row.cancelled_at,
    cancelReason: row.cancel_reason,
    rescheduledAt: typeof meta.rescheduledAt === 'string' ? meta.rescheduledAt : null,
    originalSlot: (meta.originalSlot as Booking['originalSlot']) ?? null,
    recurringGroupId: typeof meta.recurringGroupId === 'string' ? meta.recurringGroupId : null,
    recurringWeek: typeof meta.recurringWeek === 'number' ? meta.recurringWeek : null,
    createdAt: row.created_at,
  };
}

/** One SlotHold per held slot, for bookings still being checked out (held, or awaiting payment). */
export function mapV2Holds(row: V2BookingRow, openHourOf: OpenHourOf = () => 0): SlotHold[] {
  if ((row.status !== 'held' && row.status !== 'pending_payment') || !row.holder || !row.hold_expires_at || !row.venues?.slug) return [];
  return items(row, openHourOf).map((s) => ({
    id: s.item.id,
    turfId: row.venues!.slug!,
    date: s.date,
    hour: s.item.hour,
    holder: row.holder!,
    pitch: s.item.pitch,
    expiresAt: row.hold_expires_at!,
  }));
}

export function mapV2Block(row: V2BlockRow, openHourOf: OpenHourOf = () => 0): SlotBlock | null {
  const range = parseRange(row.during);
  const turfId = row.venues?.slug;
  if (!range || !turfId) return null;
  const start = slotStart(range, openHourOf(turfId));
  return { id: row.id, turfId, date: start.date, hour: start.hour, reason: row.reason, createdBy: 'owner', createdAt: row.created_at };
}

const BOOKING_COLUMNS =
  'id, legacy_id, code, holder, customer_name, customer_phone, source, status, hold_expires_at, subtotal, discount, wallet_used, total, advance_due, amount_paid, price_breakdown, meta, cancelled_at, cancel_reason, checked_in_at, created_at, venues(slug), players(legacy_id), booking_items(id, during, price, bookables(name))';

export interface V2Snapshot {
  bookings: Booking[];
  holds: SlotHold[];
  blocks: SlotBlock[];
}

/**
 * Bookings created in the last `historyDays` days (and everything after), live holds and upcoming blocks.
 * Older history is not loaded per request; reports that need it should query by range.
 */
export async function loadV2Snapshot(client: SupabaseClient, openHourOf: OpenHourOf, historyDays = 90): Promise<V2Snapshot> {
  const since = new Date(Date.now() - historyDays * 86_400_000).toISOString();
  const [bookings, blocks] = await Promise.all([
    client.schema('oyun').from('bookings').select(BOOKING_COLUMNS).gte('created_at', since).order('created_at', { ascending: true }).limit(20_000),
    client.schema('oyun').from('blocks').select('id, reason, created_at, during, venues(slug), bookables(name)').gte('created_at', since).limit(5_000),
  ]);
  if (bookings.error) throw new Error(`[v2-bookings] ${bookings.error.message}`);
  if (blocks.error) throw new Error(`[v2-bookings] ${blocks.error.message}`);
  const rows = (bookings.data ?? []) as unknown as V2BookingRow[];
  const now = Date.now();
  return {
    bookings: rows.flatMap((r) => mapV2Booking(r, openHourOf) ?? []),
    holds: rows.flatMap((r) => mapV2Holds(r, openHourOf)).filter((h) => new Date(h.expiresAt).getTime() > now),
    blocks: ((blocks.data ?? []) as unknown as V2BlockRow[]).flatMap((r) => mapV2Block(r, openHourOf) ?? []),
  };
}

/* ---------- writes ---------- */

/** One edit for apply_booking_updates: the fields of a booking the app changes after it exists. */
export function bookingUpdate(b: Booking) {
  return {
    id: b.id,
    status: b.status === 'refunded' ? 'cancelled' : b.status,
    amountPaid: b.amountPaid,
    checkedInAt: b.checkedInAt,
    cancelledAt: b.cancelledAt ?? null,
    cancelReason: b.cancelReason ?? null,
    customerName: b.customerName,
    customerPhone: b.customerPhone,
    meta: {
      addOns: b.addOns,
      paymentMode: b.paymentMode,
      cashback: b.cashback,
      cashCollected: b.cashCollected,
      accountId: b.accountId,
      review: b.review,
      rescheduledAt: b.rescheduledAt,
      originalSlot: b.originalSlot,
      recurringGroupId: b.recurringGroupId,
      recurringWeek: b.recurringWeek,
      createdBy: b.createdBy,
      refunded: b.status === 'refunded',
    },
  };
}

const slotKey = (b: Booking) => `${b.turfId}|${b.date}|${[...(b.hours ?? [b.hour])].sort((x, y) => x - y).join(',')}|${b.pitch ?? 'full'}`;

/**
 * What a mutate() callback did to bookings: edits to existing ones, ids it added and bookings it moved to another slot. New bookings cannot
 * be created by editing the list (slots and claims come from the v2 functions), so the store refuses them.
 */
export function diffV2Bookings(before: Booking[], after: Booking[]) {
  const old = new Map(before.map((b) => [b.id, b]));
  const updates: ReturnType<typeof bookingUpdate>[] = [];
  const created: string[] = [];
  const moved: string[] = [];
  for (const b of after) {
    const prev = old.get(b.id);
    if (!prev) created.push(b.id);
    else if (JSON.stringify(prev) !== JSON.stringify(b)) {
      // The slot is held by claims in oyun; changing the date or hour here would leave the claims behind
      if (slotKey(prev) !== slotKey(b)) moved.push(b.id);
      else updates.push(bookingUpdate(b));
    }
  }
  return { updates, created, moved };
}

/** The quote stored with a v2 booking, from the booking the planner priced. Amounts in whole rupees. */
export function v2QuoteOf(b: Booking): V2Quote {
  const p = b.pricing;
  const discount = [p.offer, p.promo].reduce((sum, line) => sum + (line && line.amount < 0 ? -line.amount : 0), 0);
  return {
    subtotal: p.subtotal,
    discount,
    walletUsed: p.walletDeduction,
    total: p.total,
    advanceDue: p.advance,
    amountPaid: b.amountPaid,
    priceBreakdown: p as unknown as Record<string, unknown>,
    meta: bookingUpdate(b).meta,
    legacyId: b.id,
    source: b.source === 'walk_in' ? 'walk_in' : 'online',
  };
}
