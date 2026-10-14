'use server';

import { cookies } from 'next/headers';
import {
  ValidationError,
  bool,
  int,
  parseTurfProfile,
  phone10,
  required,
  run,
  str,
} from './action-utils';
import { generateTempPassword, hashPassword } from './password';
import { TURF_COOKIE, getPartnerContext, requirePartnerAction, type PartnerContext } from './partner-auth';
import { buildQuote, getSlots, turfHours } from './pricing';
import { getDb, mutate, newBookingCode, newId } from './store';
import { addDays, formatHour, formatSlotRange, isValidDate, istNow, parseHour } from './time';
import type { ActionResult, Booking, Database, OfferType, Slot, StaffRole } from './types';
import { checkInWindow } from './checkin-window';
import { mapTurfToResourcesAndBookables } from './venue-mapping';
import { withDate, withoutDate } from './rain';
import { isOutdoorTurf } from './weather';
import { createPlayer, refundDue, rewardCheckIn, walletTxn } from './wallet';

function bookingInTurf(db: Database, ctx: PartnerContext, bookingId: string) {
  const booking = db.bookings.find((b) => b.id === bookingId);
  if (!booking || booking.turfId !== ctx.turf.id) throw new ValidationError('Booking not found');
  return booking;
}

function upsertPlayer(db: Database, name: string, phone: string) {
  return db.players.find((p) => p.phone === phone) ?? createPlayer(db, name, phone);
}

/* ---------- turf switcher ---------- */

export async function switchTurf(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  const ctx = await getPartnerContext();
  const turfId = str(fd, 'turfId');
  if (!ctx || !ctx.turfs.some((t) => t.id === turfId)) return { error: 'Turf not found' };
  (await cookies()).set(TURF_COOKIE, turfId, { httpOnly: true, sameSite: 'lax', path: '/partner' });
  return run(() => ({ ok: 'Switched turf' }));
}

/* ---------- bookings ---------- */

export async function createWalkIn(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    const ctx = await requirePartnerAction('bookings');
    const name = required(fd, 'name', 'Customer name', 80);
    const phone = phone10(fd, 'phone');
    const date = required(fd, 'date', 'Date', 10);
    if (!isValidDate(date)) throw new ValidationError('Pick a valid date');
    const hour = int(fd, 'hour', { min: 0, max: 23, label: 'Slot' });
    const paymentMode = str(fd, 'paymentMode') === 'upi' ? 'upi' : 'cash';
    const addOns = [...fd.keys()]
      .filter((k) => k.startsWith('addon_'))
      .map((k) => ({ id: k.slice(6), qty: Number(fd.get(k)) || 0 }));

    return await mutate((db) => {
      const quote = buildQuote(db, { turfId: ctx.turf.id, date, hour, addOns, phone, source: 'walk_in' }, istNow());
      if (!quote) throw new ValidationError('Turf not found');
      if (quote.slotError) throw new ValidationError(quote.slotError);

      const player = upsertPlayer(db, name, phone);
      const durationMinutes = Math.max(15, Math.min(240, Number(fd.get('durationMinutes')) || 60));
      const startMinute = Math.max(0, Math.min(45, Number(fd.get('minute')) || 0));
      const booking: Booking = {
        id: newId('bk'),
        code: newBookingCode(db),
        turfId: ctx.turf.id,
        date,
        hour,
        timeLabel: formatSlotRange(hour, durationMinutes, startMinute),
        durationMinutes,
        startMinute,
        customerName: name,
        customerPhone: phone,
        playerId: player.id,
        source: 'walk_in',
        createdBy: ctx.userName,
        addOns: quote.addOns,
        pricing: quote.breakdown,
        paymentMode,
        amountPaid: quote.breakdown.total,
        status: 'confirmed',
        checkedInAt: null,
        createdAt: new Date().toISOString(),
      };
      db.bookings.push(booking);
      return { ok: `Walk-in booked: ${name}, ${booking.timeLabel} — collect ₹${quote.breakdown.total} by ${paymentMode.toUpperCase()}. Code ${booking.code}` };
    });
  });
}

export async function cancelBooking(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    const ctx = await requirePartnerAction('bookings');
    return await mutate((db) => {
      const booking = bookingInTurf(db, ctx, str(fd, 'bookingId'));
      if (booking.status !== 'confirmed') throw new ValidationError('Only upcoming bookings can be cancelled');
      // Online payments, and anything paid from the wallet, go back to the player's wallet
      const refund = refundDue(booking);
      if (booking.source === 'online' && refund > 0 && booking.playerId) {
        const player = db.players.find((p) => p.id === booking.playerId);
        if (player) walletTxn(db, player, refund, 'refund', `Booking ${booking.code} cancelled by the turf`, booking.id);
        booking.status = 'refunded';
        return { ok: `Cancelled. ₹${refund} refunded to ${booking.customerName}'s wallet.` };
      }
      booking.status = 'cancelled';
      return { ok: 'Booking cancelled' };
    });
  });
}

/* ---------- check-in ---------- */

export async function checkInBooking(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    const ctx = await requirePartnerAction('checkin');
    const raw = str(fd, 'code').toUpperCase().replace(/\s/g, '');
    const code = raw.startsWith('SA-') ? raw : `SA-${raw}`;
    const bookingId = str(fd, 'bookingId');
    const { date: today, hour, minute } = istNow();

    return await mutate((db) => {
      const booking = bookingId
        ? db.bookings.find((b) => b.id === bookingId)
        : db.bookings.find((b) => b.code === code);
      if (!booking) throw new ValidationError(`No booking found for ${code}`);
      if (booking.turfId !== ctx.turf.id) {
        const other = db.turfs.find((t) => t.id === booking.turfId);
        throw new ValidationError(`This booking is for ${other?.name ?? 'another turf'}`);
      }
      if (booking.status === 'checked_in') throw new ValidationError(`${booking.customerName} is already checked in`);
      if (booking.status !== 'confirmed') throw new ValidationError(`This booking is ${booking.status.replace('_', ' ')}`);
      const openHour = parseHour(ctx.turf.openTime);
      const isAfterMidnight = openHour > 0 && booking.hour < openHour;
      const expectedCalendarDate = isAfterMidnight ? addDays(booking.date, 1) : booking.date;
      if (today !== expectedCalendarDate && booking.date !== today) {
        throw new ValidationError(`This booking is for ${booking.date}, not today`);
      }
      const win = checkInWindow(
        booking.hour,
        { hour, minute },
        booking.durationMinutes ?? 60,
        booking.startMinute ?? 0,
        openHour
      );
      if (win === 'early') throw new ValidationError(`Check-in for ${booking.timeLabel} opens an hour before the slot`);
      if (win === 'late') throw new ValidationError(`The ${booking.timeLabel} slot has ended`);

      // Money owed at the venue is only counted once the desk says it took it
      const due = Math.max(0, booking.pricing.total - booking.amountPaid);
      if (due > 0 && !bool(fd, 'cashCollected')) {
        return { error: `₹${due} is due from ${booking.customerName}. Collect it, then confirm to check them in.`, data: { due: String(due), code: booking.code } };
      }

      booking.status = 'checked_in';
      booking.checkedInAt = new Date().toISOString();
      if (due > 0) booking.cashCollected = { amount: due, at: booking.checkedInAt, by: ctx.userName };
      const rewards = rewardCheckIn(db, booking);
      // Pay-at-venue bookings are settled at the desk on check-in
      if (booking.paymentMode === 'venue') booking.amountPaid = booking.pricing.total;
      return {
        ok: `✓ ${booking.customerName} checked in for ${booking.timeLabel}${due > 0 ? ` — ₹${due} collected` : ''}${rewards.length ? ` · ${rewards.join(', ')}` : ''}`,
      };
    });
  });
}

export async function markNoShow(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    const ctx = await requirePartnerAction('checkin');
    return await mutate((db) => {
      const booking = bookingInTurf(db, ctx, str(fd, 'bookingId'));
      if (booking.status !== 'confirmed') throw new ValidationError('Only confirmed bookings can be marked as no-show');
      const now = istNow();
      if (booking.date > now.date || (booking.date === now.date && booking.hour > now.hour)) {
        throw new ValidationError('You can mark a no-show once the slot has started');
      }
      booking.status = 'no_show';
      return { ok: 'Marked as no-show' };
    });
  });
}

/* ---------- slots ---------- */

// Free slots for the walk-in form: the owner's own turf, any status, and the hour that has just started
export async function getWalkInSlots(date: string): Promise<Slot[]> {
  const ctx = await requirePartnerAction('bookings');
  if (!isValidDate(String(date))) return [];
  return getSlots(await getDb(), ctx.turf, String(date), istNow(), null, true);
}

export async function blockSlot(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    const ctx = await requirePartnerAction('slots');
    const date = required(fd, 'date', 'Date', 10);
    if (!isValidDate(date)) throw new ValidationError('Pick a valid date');
    const hour = int(fd, 'hour', { min: 0, max: 23, label: 'Slot' });
    const reason = required(fd, 'reason', 'Reason', 120);
    if (date < istNow().date) throw new ValidationError('That date has already passed');
    if (!turfHours(ctx.turf).includes(hour)) throw new ValidationError(`${ctx.turf.name} is not open at ${formatHour(hour)}`);

    return await mutate((db) => {
      const taken = db.bookings.some(
        (b) => b.turfId === ctx.turf.id && b.date === date && b.hour === hour && ['confirmed', 'checked_in'].includes(b.status)
      );
      if (taken) throw new ValidationError('This slot already has a booking — cancel it first');
      if (db.blocks.some((b) => b.turfId === ctx.turf.id && b.date === date && b.hour === hour)) {
        throw new ValidationError('This slot is already blocked');
      }
      db.blocks.push({ id: newId('block'), turfId: ctx.turf.id, date, hour, reason, createdBy: ctx.userName, createdAt: new Date().toISOString() });
      return { ok: `Blocked ${formatHour(hour)} on ${date}` };
    });
  });
}

export async function unblockSlot(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    const ctx = await requirePartnerAction('slots');
    const id = str(fd, 'blockId');
    return await mutate((db) => {
      const before = db.blocks.length;
      db.blocks = db.blocks.filter((b) => !(b.id === id && b.turfId === ctx.turf.id));
      if (db.blocks.length === before) throw new ValidationError('Block not found');
      return { ok: 'Slot reopened' };
    });
  });
}

/* ---------- rain policy ---------- */

// The owner or desk marks their own outdoor turf as rained out for a date (or clears it). While it is on, players
// with a booking that day can cancel without the 2 hour cutoff and get a full wallet refund. Only ever the turf
// of the signed-in context: there is no turf id in the form.
export async function setRainOut(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    const ctx = await requirePartnerAction('slots');
    const date = required(fd, 'date', 'Date', 10);
    if (!isValidDate(date)) throw new ValidationError('Pick a valid date');
    const clear = str(fd, 'mode') === 'clear';
    const today = istNow().date;
    if (!clear && date < today) throw new ValidationError('That date has already passed');
    if (!clear && !isOutdoorTurf(ctx.turf)) throw new ValidationError('Rain policy only applies to outdoor turfs');
    return await mutate((db) => {
      const turf = db.turfs.find((t) => t.id === ctx.turf.id);
      if (!turf) throw new ValidationError('Turf not found');
      turf.rainOutDates = clear ? withoutDate(turf.rainOutDates, date) : withDate(turf.rainOutDates, date, today);
      return { ok: clear ? `Rain cleared for ${date}` : `Marked as rained out on ${date}. Players can cancel for a full wallet refund.` };
    });
  });
}

/* ---------- pricing ---------- */

export async function savePricing(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    const ctx = await requirePartnerAction('pricing');
    const peakStartHour = int(fd, 'peakStartHour', { min: 0, max: 23, label: 'Peak start' });
    const peakEndHour = int(fd, 'peakEndHour', { min: 1, max: 24, label: 'Peak end' });
    if (peakEndHour <= peakStartHour) throw new ValidationError('Peak end must be after peak start');
    const rules = {
      peakEnabled: bool(fd, 'peakEnabled'),
      peakStartHour,
      peakEndHour,
      peakPercent: int(fd, 'peakPercent', { min: 0, max: 200, label: 'Peak markup' }),
      weekendEnabled: bool(fd, 'weekendEnabled'),
      weekendPercent: int(fd, 'weekendPercent', { min: 0, max: 200, label: 'Weekend markup' }),
      lastMinuteEnabled: bool(fd, 'lastMinuteEnabled'),
      lastMinuteHours: int(fd, 'lastMinuteHours', { min: 1, max: 12, label: 'Last-minute window' }),
      lastMinutePercent: int(fd, 'lastMinutePercent', { min: 0, max: 90, label: 'Last-minute discount' }),
    };
    const pricePerHour = int(fd, 'pricePerHour', { min: 100, max: 20000, label: 'Base price' });
    await mutate((db) => {
      db.pricing[ctx.turf.id] = rules;
      const turf = db.turfs.find((t) => t.id === ctx.turf.id);
      if (turf) turf.pricePerHour = pricePerHour;
    });
    return { ok: 'Pricing saved. New prices apply to bookings from now on.' };
  });
}

/* ---------- offers ---------- */

export async function createOffer(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    const ctx = await requirePartnerAction('offers');
    const type: OfferType = str(fd, 'type') === 'first_time' ? 'first_time' : 'happy_hour';
    const title = required(fd, 'title', 'Offer name', 40);
    const percentOff = int(fd, 'percentOff', { min: 1, max: 90, label: 'Discount' });
    let startHour = 0;
    let endHour = 24;
    if (type === 'happy_hour') {
      startHour = int(fd, 'startHour', { min: 0, max: 23, label: 'Start hour' });
      endHour = int(fd, 'endHour', { min: 1, max: 24, label: 'End hour' });
      if (endHour <= startHour) throw new ValidationError('End hour must be after start hour');
    }
    await mutate((db) => {
      db.offers.push({ id: newId('offer'), turfId: ctx.turf.id, type, title, percentOff, startHour, endHour, active: true, createdAt: new Date().toISOString() });
    });
    return { ok: `Offer "${title}" is live` };
  });
}

export async function toggleOffer(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    const ctx = await requirePartnerAction('offers');
    return await mutate((db) => {
      const offer = db.offers.find((o) => o.id === str(fd, 'offerId') && o.turfId === ctx.turf.id);
      if (!offer) throw new ValidationError('Offer not found');
      offer.active = !offer.active;
      return { ok: offer.active ? 'Offer resumed' : 'Offer paused' };
    });
  });
}

export async function deleteOffer(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    const ctx = await requirePartnerAction('offers');
    await mutate((db) => {
      db.offers = db.offers.filter((o) => !(o.id === str(fd, 'offerId') && o.turfId === ctx.turf.id));
    });
    return { ok: 'Offer deleted' };
  });
}

/* ---------- add-ons ---------- */

export async function saveAddOn(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    const ctx = await requirePartnerAction('addons');
    const id = str(fd, 'addOnId');
    const name = required(fd, 'name', 'Name', 60);
    const price = int(fd, 'price', { min: 0, max: 10000, label: 'Price' });
    return await mutate((db) => {
      if (id) {
        const addOn = db.addOns.find((a) => a.id === id && a.turfId === ctx.turf.id);
        if (!addOn) throw new ValidationError('Add-on not found');
        addOn.name = name;
        addOn.price = price;
        return { ok: 'Add-on updated' };
      }
      db.addOns.push({ id: newId('addon'), turfId: ctx.turf.id, name, price, active: true });
      return { ok: `${name} added to checkout` };
    });
  });
}

export async function toggleAddOn(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    const ctx = await requirePartnerAction('addons');
    return await mutate((db) => {
      const addOn = db.addOns.find((a) => a.id === str(fd, 'addOnId') && a.turfId === ctx.turf.id);
      if (!addOn) throw new ValidationError('Add-on not found');
      addOn.active = !addOn.active;
      return { ok: addOn.active ? 'Shown at checkout' : 'Hidden from checkout' };
    });
  });
}

export async function deleteAddOn(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    const ctx = await requirePartnerAction('addons');
    await mutate((db) => {
      db.addOns = db.addOns.filter((a) => !(a.id === str(fd, 'addOnId') && a.turfId === ctx.turf.id));
    });
    return { ok: 'Add-on deleted' };
  });
}

/* ---------- staff ---------- */

function emailTaken(db: Database, email: string) {
  return db.partners.some((p) => p.email === email) || db.staff.some((s) => s.email === email);
}

export async function createStaff(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    const ctx = await requirePartnerAction('staff');
    const name = required(fd, 'name', 'Name', 80);
    const email = required(fd, 'email', 'Email', 120).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ValidationError('Enter a valid email');
    const phone = phone10(fd, 'phone');
    const role: StaffRole = str(fd, 'role') === 'manager' ? 'manager' : 'front_desk';
    const password = generateTempPassword();
    await mutate((db) => {
      if (emailTaken(db, email)) throw new ValidationError('This email is already in use');
      db.staff.push({ id: newId('staff'), partnerId: ctx.partner.id, name, email, phone, role, passwordHash: hashPassword(password), createdAt: new Date().toISOString() });
    });
    return { ok: `${name} can now log in at /partner/login with ${email} and temporary password: ${password}` };
  });
}

export async function resetStaffPassword(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    const ctx = await requirePartnerAction('staff');
    const password = generateTempPassword();
    return await mutate((db) => {
      const staff = db.staff.find((s) => s.id === str(fd, 'staffId') && s.partnerId === ctx.partner.id);
      if (!staff) throw new ValidationError('Staff member not found');
      staff.passwordHash = hashPassword(password);
      return { ok: `New password for ${staff.name}: ${password}` };
    });
  });
}

export async function deleteStaff(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    const ctx = await requirePartnerAction('staff');
    await mutate((db) => {
      db.staff = db.staff.filter((s) => !(s.id === str(fd, 'staffId') && s.partnerId === ctx.partner.id));
    });
    return { ok: 'Staff access removed' };
  });
}

/* ---------- turf profile & business ---------- */

export async function updateTurfProfile(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    const ctx = await requirePartnerAction('turf');
    const profile = parseTurfProfile(fd);
    await mutate((db) => {
      const turf = db.turfs.find((t) => t.id === ctx.turf.id);
      if (turf) Object.assign(turf, profile);
    });
    return { ok: 'Turf details saved — they are live on your public page' };
  });
}

export async function updateBusiness(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    const ctx = await requirePartnerAction('payouts');
    const gstin = str(fd, 'gstin', 15).toUpperCase();
    if (gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/.test(gstin)) throw new ValidationError('GSTIN format looks wrong (15 characters, e.g. 29ABCDE1234F1Z5)');
    await mutate((db) => {
      const partner = db.partners.find((p) => p.id === ctx.partner.id);
      if (partner) {
        partner.business = {
          legalName: required(fd, 'legalName', 'Legal name', 120),
          gstin,
          address: required(fd, 'address', 'Billing address', 300),
        };
      }
    });
    return { ok: 'Business details saved — used on all invoices' };
  });
}

/* ---------- courts, pitches & bookables (v2) ---------- */

export async function addCourtResource(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    const ctx = await requirePartnerAction('turf');
    const name = required(fd, 'name', 'Court / Resource name', 60);

    await mutate((db) => {
      const turf = db.turfs.find((t) => t.id === ctx.turf.id);
      if (!turf) throw new ValidationError('Turf not found');

      if (!turf.resources || turf.resources.length === 0) {
        const initial = mapTurfToResourcesAndBookables(turf);
        turf.resources = initial.resources;
        turf.bookables = initial.bookables;
      }

      const resourceId = `${turf.id}_res_${Date.now()}`;
      turf.resources.push({
        id: resourceId,
        venueId: turf.id,
        name,
        sort: turf.resources.length,
        active: true,
      });
    });

    return { ok: `Court "${name}" added` };
  });
}

export async function deleteCourtResource(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    const ctx = await requirePartnerAction('turf');
    const resourceId = required(fd, 'resourceId', 'Resource ID', 100);

    await mutate((db) => {
      const turf = db.turfs.find((t) => t.id === ctx.turf.id);
      if (!turf) throw new ValidationError('Turf not found');

      if (!turf.resources || turf.resources.length === 0) {
        const initial = mapTurfToResourcesAndBookables(turf);
        turf.resources = initial.resources;
        turf.bookables = initial.bookables;
      }

      if (turf.resources.length <= 1) {
        throw new ValidationError('A venue must retain at least one physical court or pitch');
      }

      turf.resources = turf.resources.filter((r) => r.id !== resourceId);
      // Clean up orphaned bookable resource references
      if (turf.bookables) {
        turf.bookables.forEach((b) => {
          b.resourceIds = b.resourceIds.filter((id) => id !== resourceId);
        });
      }
    });

    return { ok: 'Court removed' };
  });
}

export async function addBookableOffering(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    const ctx = await requirePartnerAction('turf');
    const name = required(fd, 'name', 'Bookable offering name', 80);
    const sport = required(fd, 'sport', 'Sport', 40).toLowerCase().replace(/\s+/g, '_');
    const slotMinutes = int(fd, 'slotMinutes', { min: 15, max: 240, label: 'Slot duration (minutes)' });
    const basePrice = int(fd, 'basePrice', { min: 50, max: 20000, label: 'Base price (₹)' });
    const resourceIds = fd.getAll('resourceIds').map(String).filter(Boolean);

    await mutate((db) => {
      const turf = db.turfs.find((t) => t.id === ctx.turf.id);
      if (!turf) throw new ValidationError('Turf not found');

      if (!turf.resources || turf.resources.length === 0) {
        const initial = mapTurfToResourcesAndBookables(turf);
        turf.resources = initial.resources;
        turf.bookables = initial.bookables;
      }

      const assignedResources = resourceIds.length > 0 ? resourceIds : turf.resources.map((r) => r.id);

      const bookableId = `${turf.id}_bk_${Date.now()}`;
      turf.bookables = turf.bookables ?? [];
      turf.bookables.push({
        id: bookableId,
        venueId: turf.id,
        sport,
        name,
        slotMinutes,
        maxSlots: 6,
        basePrice,
        active: true,
        sort: turf.bookables.length,
        resourceIds: assignedResources,
      });
    });

    return { ok: `Bookable offering "${name}" added` };
  });
}

export async function deleteBookableOffering(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    const ctx = await requirePartnerAction('turf');
    const bookableId = required(fd, 'bookableId', 'Bookable ID', 100);

    await mutate((db) => {
      const turf = db.turfs.find((t) => t.id === ctx.turf.id);
      if (!turf) throw new ValidationError('Turf not found');

      if (!turf.bookables || turf.bookables.length === 0) {
        const initial = mapTurfToResourcesAndBookables(turf);
        turf.resources = initial.resources;
        turf.bookables = initial.bookables;
      }

      if (turf.bookables.length <= 1) {
        throw new ValidationError('A venue must retain at least one bookable offering');
      }

      turf.bookables = turf.bookables.filter((b) => b.id !== bookableId);
    });

    return { ok: 'Bookable offering removed' };
  });
}


