import { draftTurfDescriptions, lateTurfSeeds, turfSeeds } from '@/data/turfs';
import { DEFAULT_PRICING } from './pricing';
import { generateTempPassword, hashPassword } from './password';
import type { Database, PlatformSettings } from './types';
import { newReferralCode } from './wallet';

export const DB_VERSION = 2;

// A photo of one of our own turfs, so the launch card cannot break when a stock photo is removed
const LAUNCH_PROMO_IMAGE = '/turfs/turf_0.jpg';
// The stock photo the launch card first used; Unsplash removed it (404)
const DEAD_LAUNCH_PROMO_IMAGE = 'https://images.unsplash.com/photo-1529900965798-eb5043b428d0?q=80&w=2000&auto=format&fit=crop';

const DEFAULT_SETTINGS: PlatformSettings = {
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

// Fill in fields added after the database was first created, so older data keeps working
export function migrate(data: Database): Database {
  data.settings = { ...DEFAULT_SETTINGS, ...data.settings };
  data.walletTxns ??= [];
  data.holds ??= [];
  if (data.site) data.site.ads ??= [];
  // Venues added after launch show up in databases that were created before them
  const opsPartner = data.partners.find((p) => p.id === 'partner_oyun') ?? data.partners[0];
  if (opsPartner) {
    for (const t of lateTurfSeeds) {
      const stored = data.turfs.find((x) => x.id === t.id);
      if (stored) {
        // Fill in real venue details over the first draft, keeping status, owner and anything an admin set
        if (draftTurfDescriptions.includes(stored.description)) {
          Object.assign(stored, { ...t, status: stored.status });
        }
        continue;
      }
      data.turfs.push({ ...t, city: 'Mangalore', status: t.status ?? 'active', partnerId: opsPartner.id, commissionPercent: null, createdAt: new Date().toISOString() });
      data.pricing[t.id] ??= { ...DEFAULT_PRICING };
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
      heroTitle: "Book Mangalore's best football turfs in seconds",
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
  };

  // One OYUN operations account manages the launch turfs until each owner joins. It can sign in to
  // the partner dashboard only when PARTNER_EMAIL and PARTNER_PASSWORD are set.
  const partnerId = 'partner_oyun';
  data.partners.push({
    id: partnerId,
    name: 'OYUN Operations',
    email: (process.env.PARTNER_EMAIL || 'partners@oyun.in').toLowerCase(),
    phone: '',
    passwordHash: hashPassword(process.env.PARTNER_PASSWORD || '@123partner'),
    status: 'active',
    business: { legalName: 'OYUN', gstin: '', address: 'Mangalore, Karnataka' },
    createdAt,
  });

  for (const t of [...turfSeeds, ...lateTurfSeeds]) {
    data.turfs.push({ ...t, city: 'Mangalore', status: t.status ?? 'active', partnerId, commissionPercent: null, createdAt });
    data.pricing[t.id] = { ...DEFAULT_PRICING };
  }

  return data;
}
