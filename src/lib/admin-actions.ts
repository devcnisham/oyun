'use server';

import { parseCoordinates, type Coords } from './geocode';
import { ValidationError, bool, int, parseTurfProfile, required, run, slugify, str } from './action-utils';
import { AccessError } from './partner-auth';
import { generateTempPassword, hashPassword } from './password';
import { DEFAULT_PRICING } from './pricing';
import { hasSession } from './session';
import { mutate, newId } from './store';
import type { ActionResult, Database, TurfStatus } from './types';
import { MAX_SPONSOR_ADS, isAllowedAdLink, isAllowedImage } from './validation/site-content';
import { createPlayer, refundDue, walletTxn } from './wallet';
import { recomputeTurfRating } from './reviews';
import { withDate, withoutDate } from './rain';
import { isValidDate, istNow } from './time';

async function requireAdmin() {
  if (!(await hasSession('admin'))) throw new AccessError('Your admin session has expired. Please log in again.');
}

function emailTaken(db: Database, email: string) {
  return db.partners.some((p) => p.email === email) || db.staff.some((s) => s.email === email);
}

/* ---------- listing applications ---------- */

export async function approveApplication(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    await requireAdmin();
    const now = new Date().toISOString();
    return await mutate((db) => {
      const app = db.applications.find((a) => a.id === str(fd, 'applicationId'));
      if (!app || app.status !== 'pending') throw new ValidationError('Application not found or already reviewed');

      const email = app.ownerEmail.toLowerCase();
      let partner = db.partners.find((p) => p.email === email);
      let loginNote = `Owner logs in with their existing account (${email}).`;
      if (partner && partner.status !== 'active') {
        throw new ValidationError(`${email} belongs to a suspended partner. Reactivate them on the Partners page first, then approve.`);
      }
      if (!partner) {
        if (db.staff.some((s) => s.email === email)) throw new ValidationError('Owner email belongs to a staff account');
        const password = generateTempPassword();
        partner = {
          id: newId('partner'),
          name: app.ownerName,
          email,
          phone: app.ownerPhone,
          passwordHash: hashPassword(password),
          status: 'active',
          business: { legalName: app.ownerName, gstin: '', address: app.address },
          createdAt: now,
        };
        db.partners.push(partner);
        loginNote = `Partner login: ${email} / temporary password ${password} — share it with the owner.`;
      }

      let id = slugify(`${app.turfName}-${app.area}`);
      while (db.turfs.some((t) => t.id === id)) id = `${id}-${Math.floor(Math.random() * 1000)}`;
      db.turfs.push({
        id,
        name: app.turfName,
        location: app.address,
        area: app.area,
        city: 'Mangalore',
        rating: 0,
        reviewCount: 0,
        pricePerHour: app.weekdayPrice,
        sports: [app.sport],
        amenities: app.amenities,
        size: app.size,
        formats: [app.size],
        surface: app.surface,
        openTime: app.openTime,
        closeTime: app.closeTime,
        images: ['/turfs/turf_0.jpg'],
        isVerified: true,
        isFeatured: false,
        description: app.description || `${app.size} ${app.sport.toLowerCase()} turf in ${app.area}.`,
        ownerName: app.ownerName,
        phone: app.ownerPhone,
        status: 'active',
        partnerId: partner.id,
        commissionPercent: null,
        createdAt: now,
      });
      // Turn the evening and weekend prices the owner quoted into markups on their weekday price
      const markup = (quoted: number | undefined) =>
        quoted && app.weekdayPrice > 0 ? Math.min(200, Math.max(0, Math.round(((quoted - app.weekdayPrice) / app.weekdayPrice) * 100))) : null;
      const peak = markup(app.eveningPrice);
      const weekend = markup(app.weekendPrice);
      db.pricing[id] = {
        ...DEFAULT_PRICING,
        ...(peak !== null ? { peakEnabled: peak > 0, peakPercent: peak } : {}),
        ...(weekend !== null ? { weekendEnabled: weekend > 0, weekendPercent: weekend } : {}),
      };

      app.status = 'approved';
      app.turfId = id;
      app.reviewedAt = now;
      return { ok: `${app.turfName} is live. ${loginNote}` };
    });
  });
}

export async function rejectApplication(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    await requireAdmin();
    return await mutate((db) => {
      const app = db.applications.find((a) => a.id === str(fd, 'applicationId'));
      if (!app || app.status !== 'pending') throw new ValidationError('Application not found or already reviewed');
      app.status = 'rejected';
      app.note = str(fd, 'note', 300);
      app.reviewedAt = new Date().toISOString();
      return { ok: `${app.turfName} rejected` };
    });
  });
}

/* ---------- turfs ---------- */

const TURF_STATUSES: TurfStatus[] = ['active', 'pending', 'maintenance', 'suspended'];

export async function updateTurfAdmin(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    await requireAdmin();
    const profile = parseTurfProfile(fd, { phoneOptional: true });
    const status = str(fd, 'status') as TurfStatus;
    if (!TURF_STATUSES.includes(status)) throw new ValidationError('Invalid status');
    const commissionRaw = str(fd, 'commissionPercent');
    const commissionPercent = commissionRaw === '' ? null : int(fd, 'commissionPercent', { min: 0, max: 50, label: 'Commission' });
    const rating = Number(str(fd, 'rating'));
    if (!Number.isFinite(rating) || rating < 0 || rating > 5) throw new ValidationError('Rating must be between 0 and 5');
    let coords: Coords | null;
    try {
      coords = parseCoordinates(str(fd, 'lat'), str(fd, 'lng'));
    } catch (err) {
      throw new ValidationError((err as Error).message);
    }
    const halfA = str(fd, 'halfNameA', 60);
    const halfB = str(fd, 'halfNameB', 60);
    if (Boolean(halfA) !== Boolean(halfB)) throw new ValidationError('Name both halves, or leave both blank');
    const partnerId = str(fd, 'partnerId') || null;
    const halfPitch = bool(fd, 'halfPitch');
    const halfPricePercent = halfPitch ? int(fd, 'halfPricePercent', { min: 30, max: 80, label: 'Half pitch price' }) : undefined;

    return await mutate((db) => {
      const turf = db.turfs.find((t) => t.id === str(fd, 'turfId'));
      if (!turf) throw new ValidationError('Turf not found');
      if (partnerId && !db.partners.some((p) => p.id === partnerId)) throw new ValidationError('Partner not found');
      Object.assign(turf, profile, {
        status,
        commissionPercent,
        rating: Math.round(rating * 10) / 10,
        isVerified: bool(fd, 'isVerified'),
        isFeatured: bool(fd, 'isFeatured'),
        partnerId,
        halfPitch,
        halfPricePercent: halfPricePercent ?? turf.halfPricePercent,
      });
      if (halfA && halfB) turf.halfNames = { A: halfA, B: halfB };
      else delete turf.halfNames;
      if (coords) {
        turf.lat = coords.lat;
        turf.lng = coords.lng;
      } else {
        delete turf.lat;
        delete turf.lng;
      }
      return { ok: `${turf.name} saved` };
    });
  });
}

export async function quickUpdateTurf(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    await requireAdmin();
    return await mutate((db) => {
      const turf = db.turfs.find((t) => t.id === str(fd, 'turfId'));
      if (!turf) throw new ValidationError('Turf not found');
      const field = str(fd, 'field');
      if (field === 'isVerified') turf.isVerified = !turf.isVerified;
      else if (field === 'isFeatured') turf.isFeatured = !turf.isFeatured;
      else if (field === 'status') {
        const status = str(fd, 'value') as TurfStatus;
        if (!TURF_STATUSES.includes(status)) throw new ValidationError('Invalid status');
        turf.status = status;
      } else throw new ValidationError('Unknown field');
      return { ok: 'Saved' };
    });
  });
}

/* ---------- reviews ---------- */

// Hide or show a player review (e.g. abusive or off-topic); the turf's rating follows
export async function toggleReviewHidden(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    await requireAdmin();
    return await mutate((db) => {
      const booking = db.bookings.find((b) => b.id === str(fd, 'bookingId'));
      if (!booking?.review) throw new ValidationError('Review not found');
      booking.review.hidden = !booking.review.hidden;
      recomputeTurfRating(db, booking.turfId);
      return { ok: booking.review.hidden ? 'Review hidden' : 'Review visible again' };
    });
  });
}

// Ban the user who posted an abusive review and hide the review
export async function banReviewAuthor(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    await requireAdmin();
    return await mutate((db) => {
      const booking = db.bookings.find((b) => b.id === str(fd, 'bookingId'));
      if (!booking?.review) throw new ValidationError('Review not found');
      booking.review.hidden = true;
      recomputeTurfRating(db, booking.turfId);

      let player = db.players.find((p) => (booking.playerId && p.id === booking.playerId) || (booking.customerPhone && p.phone === booking.customerPhone));
      if (!player && booking.customerPhone) {
        player = createPlayer(db, booking.customerName || 'Anonymous', booking.customerPhone);
      }
      if (player) {
        player.status = 'banned';
      }

      return { ok: `${booking.customerName || 'User'} banned and review hidden` };
    });
  });
}

/* ---------- players ---------- */

export async function togglePlayerBan(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    await requireAdmin();
    return await mutate((db) => {
      const player = db.players.find((p) => p.id === str(fd, 'playerId'));
      if (!player) throw new ValidationError('Player not found');
      player.status = player.status === 'active' ? 'banned' : 'active';
      return { ok: `${player.name} ${player.status === 'banned' ? 'banned' : 'reactivated'}` };
    });
  });
}

export async function adjustWallet(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    await requireAdmin();
    const amount = int(fd, 'amount', { min: -100000, max: 100000, label: 'Amount' });
    if (amount === 0) throw new ValidationError('Enter an amount to add (e.g. 200) or remove (e.g. -200)');
    return await mutate((db) => {
      const player = db.players.find((p) => p.id === str(fd, 'playerId'));
      if (!player) throw new ValidationError('Player not found');
      if (player.walletBalance + amount < 0) throw new ValidationError('Wallet balance cannot go below ₹0');
      walletTxn(db, player, amount, 'admin_adjust', str(fd, 'note', 120) || 'Adjustment by OYUN');
      return { ok: `${player.name}'s wallet is now ₹${player.walletBalance}` };
    });
  });
}

/* ---------- partners ---------- */

export async function togglePartnerStatus(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    await requireAdmin();
    return await mutate((db) => {
      const partner = db.partners.find((p) => p.id === str(fd, 'partnerId'));
      if (!partner) throw new ValidationError('Partner not found');
      partner.status = partner.status === 'active' ? 'suspended' : 'active';
      return { ok: `${partner.name} ${partner.status}` };
    });
  });
}

export async function resetPartnerPassword(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    await requireAdmin();
    const password = generateTempPassword();
    return await mutate((db) => {
      const partner = db.partners.find((p) => p.id === str(fd, 'partnerId'));
      if (!partner) throw new ValidationError('Partner not found');
      partner.passwordHash = hashPassword(password);
      return { ok: `New password for ${partner.email}: ${password}` };
    });
  });
}

export async function updatePartner(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    await requireAdmin();
    const email = required(fd, 'email', 'Email', 120).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ValidationError('Enter a valid email');
    const phone = str(fd, 'phone', 20);
    if (phone && phone.replace(/\D/g, '').length < 10) throw new ValidationError('Phone number needs 10 digits');
    return await mutate((db) => {
      const partner = db.partners.find((p) => p.id === str(fd, 'partnerId'));
      if (!partner) throw new ValidationError('Partner not found');
      if (email !== partner.email && emailTaken(db, email)) throw new ValidationError('This email is already in use');
      partner.name = required(fd, 'name', 'Name', 80);
      partner.email = email;
      partner.phone = phone;
      return { ok: 'Partner saved' };
    });
  });
}

/* ---------- bookings ---------- */

export async function refundBooking(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    await requireAdmin();
    return await mutate((db) => {
      const booking = db.bookings.find((b) => b.id === str(fd, 'bookingId'));
      if (!booking) throw new ValidationError('Booking not found');
      if (booking.status === 'refunded' || booking.status === 'cancelled') throw new ValidationError('Already cancelled or refunded');
      const player = booking.playerId ? db.players.find((p) => p.id === booking.playerId) : undefined;
      const wasCheckedIn = booking.status === 'checked_in';
      booking.status = 'refunded';
      const notes: string[] = [];
      // Online money (the advance, and anything paid from the wallet) goes back to the wallet.
      // A walk-in was paid in cash or UPI at the desk, so there is nothing of ours to credit.
      const refund = refundDue(booking);
      if (player && booking.source === 'online' && refund > 0) {
        walletTxn(db, player, refund, 'refund', `Refund for booking ${booking.code}`, booking.id);
        notes.push(`Refunded ₹${refund} to ${player.name}'s wallet`);
      } else if (booking.source === 'walk_in') {
        notes.push('Walk-in was paid at the desk, so nothing was credited to a wallet');
      }
      // Take back the cashback paid at check-in (never below zero)
      if (player && wasCheckedIn && booking.cashback) {
        const back = Math.min(booking.cashback, Math.max(0, player.walletBalance));
        walletTxn(db, player, -back, 'admin_adjust', `Cashback reversed for refunded booking ${booking.code}`, booking.id);
        booking.cashback = 0;
        notes.push(`Cashback of ₹${back} taken back`);
      }
      return { ok: notes.length ? `${notes.join('. ')}.` : 'Booking marked as refunded' };
    });
  });
}

/* ---------- platform settings ---------- */

export async function saveSettings(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    await requireAdmin();
    const supportEmail = required(fd, 'supportEmail', 'Support email', 120).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail)) throw new ValidationError('Enter a valid support email address');
    const supportPhone = required(fd, 'supportPhone', 'Support phone', 20);
    if (supportPhone.replace(/\D/g, '').length < 7) throw new ValidationError('Support phone number needs at least 7 digits');
    const minAdvance = int(fd, 'minAdvance', { min: 0, max: 5000, label: 'Minimum advance' });
    const maxAdvance = int(fd, 'maxAdvance', { min: 0, max: 5000, label: 'Maximum advance' });
    if (maxAdvance < minAdvance) throw new ValidationError('Maximum advance must be at least the minimum advance');
    const settings = {
      commissionPercent: int(fd, 'commissionPercent', { min: 0, max: 50, label: 'Commission' }),
      advancePercent: int(fd, 'advancePercent', { min: 10, max: 100, label: 'Advance' }),
      minAdvance,
      maxAdvance,
      gstPercent: int(fd, 'gstPercent', { min: 0, max: 28, label: 'GST' }),
      supportEmail,
      supportPhone,
      cashbackEnabled: bool(fd, 'cashbackEnabled'),
      cashbackPercent: int(fd, 'cashbackPercent', { min: 0, max: 50, label: 'Cashback %' }),
      cashbackMax: int(fd, 'cashbackMax', { min: 0, max: 5000, label: 'Max cashback' }),
      referralEnabled: bool(fd, 'referralEnabled'),
      referrerReward: int(fd, 'referrerReward', { min: 0, max: 5000, label: 'Referrer reward' }),
      refereeReward: int(fd, 'refereeReward', { min: 0, max: 5000, label: 'New player reward' }),
    };
    await mutate((db) => {
      // Keep fields this form does not edit (like declared rain days)
      db.settings = { ...db.settings, ...settings };
    });
    return { ok: 'Platform settings saved' };
  });
}

// City-wide rain day: every outdoor turf is treated as rained out on that date (see isRainDisruption)
export async function setRainDay(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    await requireAdmin();
    const date = required(fd, 'date', 'Date', 10);
    if (!isValidDate(date)) throw new ValidationError('Pick a valid date');
    const clear = str(fd, 'mode') === 'clear';
    const today = istNow().date;
    if (!clear && date < today) throw new ValidationError('That date has already passed');
    await mutate((db) => {
      db.settings.rainDays = clear ? withoutDate(db.settings.rainDays, date) : withDate(db.settings.rainDays, date, today);
    });
    return { ok: clear ? `Rain day cleared for ${date}` : `Rain day declared for ${date}. Players at outdoor turfs can cancel for a full wallet refund.` };
  });
}

export async function savePromoCode(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    await requireAdmin();
    const code = required(fd, 'code', 'Code', 20).toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length < 3) throw new ValidationError('Code needs at least 3 letters or numbers');
    const kind = str(fd, 'kind') === 'flat' ? 'flat' : 'percent';
    const value = int(fd, 'value', { min: 1, max: kind === 'percent' ? 100 : 10000, label: 'Discount' });
    const maxRaw = str(fd, 'maxDiscount');
    const maxDiscount = maxRaw === '' ? null : int(fd, 'maxDiscount', { min: 1, max: 10000, label: 'Max discount' });
    const expiresOn = str(fd, 'expiresOn', 10);
    if (expiresOn !== '' && !/^\d{4}-\d{2}-\d{2}$/.test(expiresOn)) throw new ValidationError('Last day must be a date');
    const optionalInt = (name: string, max: number, label: string) => (str(fd, name) === '' ? null : int(fd, name, { min: 1, max, label }));
    const limits = {
      expiresOn: expiresOn === '' ? null : expiresOn,
      maxUses: optionalInt('maxUses', 1_000_000, 'Total uses'),
      perPlayerLimit: optionalInt('perPlayerLimit', 100, 'Uses per player'),
    };
    const isEdit = str(fd, 'mode') === 'edit';
    return await mutate((db) => {
      const existing = db.promoCodes.find((p) => p.code === code);
      if (existing && !isEdit) throw new ValidationError(`${code} already exists`);
      if (!existing && isEdit) throw new ValidationError(`${code} no longer exists. Refresh the page.`);
      if (existing) {
        Object.assign(existing, { kind, value, maxDiscount, weekendOnly: bool(fd, 'weekendOnly'), ...limits });
        return { ok: `${code} updated` };
      }
      db.promoCodes.push({ code, kind, value, maxDiscount, weekendOnly: bool(fd, 'weekendOnly'), active: true, uses: 0, ...limits });
      return { ok: `${code} created` };
    });
  });
}

export async function togglePromoCode(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    await requireAdmin();
    return await mutate((db) => {
      const promo = db.promoCodes.find((p) => p.code === str(fd, 'code'));
      if (!promo) throw new ValidationError('Promo code not found');
      promo.active = !promo.active;
      return { ok: `${promo.code} ${promo.active ? 'activated' : 'paused'}` };
    });
  });
}

export async function deletePromoCode(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    await requireAdmin();
    await mutate((db) => {
      db.promoCodes = db.promoCodes.filter((p) => p.code !== str(fd, 'code'));
    });
    return { ok: 'Promo code deleted' };
  });
}

/* ---------- site customization ---------- */

export async function saveSiteContent(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    await requireAdmin();
    await mutate((db) => {
      db.site.heroTitle = required(fd, 'heroTitle', 'Hero title', 120);
      db.site.announcement = str(fd, 'announcement', 160);
      db.site.announcementActive = bool(fd, 'announcementActive') && db.site.announcement !== '';
    });
    return { ok: 'Homepage updated' };
  });
}

function imageLink(fd: FormData) {
  const image = required(fd, 'image', 'Image link', 500);
  if (!isAllowedImage(image)) throw new ValidationError('Use an image from /public (e.g. /turfs/turf_1.jpg) or an images.unsplash.com link');
  return image;
}

export async function savePromoCard(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    await requireAdmin();
    const id = str(fd, 'promoId');
    const image = imageLink(fd);
    const card = { title: required(fd, 'title', 'Title', 60), subtitle: required(fd, 'subtitle', 'Subtitle', 120), image };
    return await mutate((db) => {
      if (id) {
        const existing = db.site.promos.find((p) => p.id === id);
        if (!existing) throw new ValidationError('Promo card not found');
        Object.assign(existing, card);
        return { ok: 'Promo card saved' };
      }
      db.site.promos.push({ id: newId('promo'), ...card });
      return { ok: 'Promo card added' };
    });
  });
}

export async function deletePromoCard(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    await requireAdmin();
    await mutate((db) => {
      db.site.promos = db.site.promos.filter((p) => p.id !== str(fd, 'promoId'));
    });
    return { ok: 'Promo card removed' };
  });
}

/* ---------- sponsor ads (home page strip) ---------- */

export async function saveSponsorAd(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    await requireAdmin();
    const id = str(fd, 'adId');
    const link = str(fd, 'link', 500);
    if (link && !isAllowedAdLink(link)) throw new ValidationError('Link must be an https:// address or a path on this site, e.g. /arenas');
    const ad = {
      brand: required(fd, 'brand', 'Sponsor name', 40),
      title: required(fd, 'title', 'Headline', 60),
      subtitle: required(fd, 'subtitle', 'Text', 120),
      image: imageLink(fd),
      link,
    };
    return await mutate((db) => {
      if (id) {
        const existing = db.site.ads.find((a) => a.id === id);
        if (!existing) throw new ValidationError('Ad not found');
        Object.assign(existing, ad);
        return { ok: 'Ad saved' };
      }
      if (db.site.ads.length >= MAX_SPONSOR_ADS) throw new ValidationError(`At most ${MAX_SPONSOR_ADS} ads. Remove one first.`);
      db.site.ads.push({ id: newId('ad'), ...ad });
      return { ok: 'Ad added' };
    });
  });
}

export async function deleteSponsorAd(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  return run(async () => {
    await requireAdmin();
    await mutate((db) => {
      db.site.ads = db.site.ads.filter((a) => a.id !== str(fd, 'adId'));
    });
    return { ok: 'Ad removed' };
  });
}
