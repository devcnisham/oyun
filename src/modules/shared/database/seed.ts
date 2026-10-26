import { DEFAULT_PLATFORM_OFFERS } from '@/modules/shared/lib/platform-offers';
import { draftTurfDescriptions, lateTurfSeeds, turfSeeds } from '@/modules/shared/database/data/turfs';
import { randomBytes } from 'node:crypto';
import { DEFAULT_PRICING } from '@/modules/shared/lib/pricing';
import { hashPassword, verifyPassword } from '@/modules/shared/backend/password';
import type { Database, PlatformSettings } from '@/modules/shared/database/types';
import { newReferralCode } from '@/modules/shared/lib/wallet';

export const DB_VERSION = 2;

// A photo of one of our own turfs, so the launch card cannot break when a stock photo is removed
const LAUNCH_PROMO_IMAGE = '/turfs/turf_0.jpg';
// The stock photo the launch card first used; Unsplash removed it (404)
const DEAD_LAUNCH_PROMO_IMAGE = 'https://images.unsplash.com/photo-1529900965798-eb5043b428d0?q=80&w=2000&auto=format&fit=crop';

const DEFAULT_SETTINGS: PlatformSettings = {
  platformOffers: DEFAULT_PLATFORM_OFFERS, // both off until an admin switches them on
  commissionPercent: 0,
  advancePercent: 10,
  minAdvance: 150,
  maxAdvance: 150,
  gstPercent: 18,
  supportEmail: 'hello@oyun.in',
  supportPhone: '',
  // Wallet rewards cost real money, so they start off; switch them on in Admin → Settings
  cashbackEnabled: false,
  cashbackPercent: 5,
  cashbackMax: 100,
  referralEnabled: false,
  referrerReward: 100,
  refereeReward: 100,
};

const OLD_HERO_TITLE = "Book Mangalore's best football turfs in seconds";
const NEW_HERO_TITLE = 'Book turfs and courts in Mangalore in seconds';

// Fill in fields added after the database was first created, so older data keeps working
const LEGACY_PARTNER_PASSWORD = '@123partner';
const REMOVED_PADEL_VENUE = 'padel-club-mangalore';
// Hashes already checked, so the (deliberately slow) password check does not repeat on every read
const checkedHashes = new Set<string>();

const OPS_PARTNER_ID = 'partner_oyun';
// The one venue the OYUN operations login manages (the testing venue); every other launch venue has its own owner account
const TEST_TURF_ID = 'oyun-club-test';

// An unclaimed owner account for one launch venue, so each owner gets their own partner dashboard.
// The password hash is not a valid hash, so nobody can sign in until an admin sets a password
// (Admin → Partners → reset password) and the real email (Admin → Partners → edit).
function ownerPartnerFor(data: Database, t: { id: string; name: string; location: string; ownerName?: string }, createdAt: string): string {
  const id = `partner_${t.id}`;
  if (!data.partners.some((p) => p.id === id)) {
    data.partners.push({
      id,
      name: t.ownerName || t.name,
      email: `${t.id}@owners.oyun.in`,
      phone: '',
      passwordHash: '!unclaimed',
      status: 'active',
      business: { legalName: t.name, gstin: '', address: t.location },
      createdAt,
    });
  }
  return id;
}

export function migrate(data: Database): Database {
  data.settings = { ...DEFAULT_SETTINGS, ...data.settings };
  data.walletTxns ??= [];
  data.holds ??= [];
  data.waitlist ??= [];
  data.payouts ??= [];
  data.openMatches ??= [];
  data.tournaments ??= [];
  data.activity ??= [];
  if (data.site) data.site.ads ??= [];
  // The old football-only default headline becomes the multi-sport one; a headline the admin wrote is kept
  if (data.site?.heroTitle === OLD_HERO_TITLE) data.site.heroTitle = NEW_HERO_TITLE;
  // Databases seeded before the default was removed hold a hash of the old well-known partner password.
  // Replace it with a random one so that password stops working (PARTNER_PASSWORD still signs in).
  for (const p of data.partners) {
    if (p.id !== 'partner_oyun' || checkedHashes.has(p.passwordHash)) continue;
    if (verifyPassword(LEGACY_PARTNER_PASSWORD, p.passwordHash)) p.passwordHash = hashPassword(randomBytes(24).toString('hex'));
    checkedHashes.add(p.passwordHash);
  }
  // Padel is no longer offered. A venue seeded for it earlier is suspended, not deleted, so its bookings stay on record.
  for (const t of data.turfs) {
    if (t.id === REMOVED_PADEL_VENUE && t.status !== 'suspended') t.status = 'suspended';
  }
  // Venues added after launch show up in databases that were created before them
  const opsPartner = data.partners.find((p) => p.id === 'partner_oyun') ?? data.partners[0];
  if (opsPartner) {
    for (const t of lateTurfSeeds) {
      const stored = data.turfs.find((x) => x.id === t.id);
      if (stored) {
        // Fill in real venue details over the first draft and make live
        if (draftTurfDescriptions.includes(stored.description) || stored.status === 'pending') {
          Object.assign(stored, { ...t, status: 'active' });
        }
        continue;
      }
      data.turfs.push({ ...t, city: 'Mangalore', status: t.status ?? 'active', partnerId: opsPartner.id, commissionPercent: null, createdAt: new Date().toISOString() });
      data.pricing[t.id] ??= { ...DEFAULT_PRICING };
    }
  }
  // Each launch venue belongs to its own owner account; only the testing venue stays under OYUN operations.
  // A venue an admin already handed to a real partner is left alone.
  for (const t of [...turfSeeds, ...lateTurfSeeds]) {
    if (t.id === TEST_TURF_ID) continue;
    const stored = data.turfs.find((x) => x.id === t.id);
    if (stored && stored.partnerId === OPS_PARTNER_ID) {
      stored.partnerId = ownerPartnerFor(data, t, stored.createdAt ?? new Date().toISOString());
    }
  }
  // Heal databases created with the removed stock photo (the phone shows a black card with a broken image)
  for (const promo of data.site?.promos ?? []) {
    if (promo.image === DEAD_LAUNCH_PROMO_IMAGE) promo.image = LAUNCH_PROMO_IMAGE;
  }
  for (const p of data.players) {
    p.referralCode ??= newReferralCode(data, p.name);
    p.referredBy ??= null;
    p.referralRewarded ??= false;
  }
  return data;
}

/* ---------------- seed ---------------- */

// What a brand-new database starts with: the launch turfs and nothing else. No sample players,
// bookings, reviews, promo codes or giveaways; everything else is real data entered on the site.
export function seed(): Database {
  const createdAt = new Date().toISOString();

  const data: Database = {
    version: DB_VERSION,
    turfs: [],
    partners: [],
    staff: [],
    players: [],
    bookings: [],
    blocks: [],
    offers: [],
    addOns: [],
    pricing: {},
    promoCodes: [],
    settings: { ...DEFAULT_SETTINGS },
    site: {
      heroTitle: NEW_HERO_TITLE,
      announcement: '',
      announcementActive: false,
      promos: [
        {
          id: 'promo_launch',
          title: 'OYUN is live in Mangalore',
          subtitle: 'Pick your slot, reserve it in seconds and pay at the turf.',
          image: LAUNCH_PROMO_IMAGE,
        },
      ],
      ads: [],
    },
    applications: [],
    walletTxns: [],
    holds: [],
    waitlist: [],
    payouts: [],
    openMatches: [],
    tournaments: [],
  };

  // One OYUN operations account manages the launch turfs until each owner joins. It can sign in to
  // the partner dashboard only when PARTNER_EMAIL and PARTNER_PASSWORD are set.
  const partnerId = OPS_PARTNER_ID;
  data.partners.push({
    id: partnerId,
    name: 'OYUN Operations',
    email: (process.env.PARTNER_EMAIL || 'partners@oyun.in').toLowerCase(),
    phone: '',
    // With no PARTNER_PASSWORD the account gets a random password nobody knows, never a shared default
    passwordHash: hashPassword(process.env.PARTNER_PASSWORD || randomBytes(24).toString('hex')),
    status: 'active',
    business: { legalName: 'OYUN', gstin: '', address: 'Mangalore, Karnataka' },
    createdAt,
  });

  for (const t of [...turfSeeds, ...lateTurfSeeds]) {
    const ownerId = t.id === TEST_TURF_ID ? partnerId : ownerPartnerFor(data, t, createdAt);
    data.turfs.push({ ...t, city: 'Mangalore', status: t.status ?? 'active', partnerId: ownerId, commissionPercent: null, createdAt });
    data.pricing[t.id] = { ...DEFAULT_PRICING };
  }

  return data;
}
