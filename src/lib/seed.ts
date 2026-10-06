import { turfSeeds } from '@/data/turfs';
import { newBookingCode, newId } from './ids';
import { buildQuote, DEFAULT_PRICING, turfHours } from './pricing';
import { generateTempPassword, hashPassword } from './password';
import { addDays, formatHour, istNow } from './time';
import type { Booking, BookingStatus, Database, PaymentMode, Player, PlatformSettings } from './types';
import { createPlayer, newReferralCode, walletTxn } from './wallet';

export const DB_VERSION = 1;

const DEFAULT_SETTINGS: PlatformSettings = {
  commissionPercent: 0,
  advancePercent: 30,
  gstPercent: 18,
  supportEmail: 'hello@oyun.in',
  supportPhone: '+91 98765 00000',
  cashbackEnabled: true,
  cashbackPercent: 5,
  cashbackMax: 100,
  referralEnabled: true,
  referrerReward: 100,
  refereeReward: 100,
};

// Fill in fields added after a db.json was first created, so existing demo data keeps working
export function migrate(data: Database): Database {
  data.settings = { ...DEFAULT_SETTINGS, ...data.settings };
  data.walletTxns ??= [];
  data.holds ??= [];
  for (const p of data.players) {
    p.referralCode ??= newReferralCode(data, p.name);
    p.referredBy ??= null;
    p.referralRewarded ??= false;
  }
  return data;
}

/* ---------------- seed ---------------- */

// Deterministic PRNG so the demo data looks the same on every reseed
function prng(seedValue: number) {
  let a = seedValue;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PLAYER_NAMES = [
  'Rahul Shetty', 'Kiran Pai', 'Vikram Rao', 'Sandeep Kamath', 'Arjun Nayak', 'Mohammed Irfan',
  'Prajwal Gowda', 'Nikhil D\'Souza', 'Akash Bhat', 'Rohit Kini', 'Sameer Khan', 'Deepak Hegde',
  'Varun Acharya', 'Joel Pinto', 'Ashwin Poojary', 'Faizal Ahmed',
];

export function seed(): Database {
  const rand = prng(42);
  const now = istNow();
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
    promoCodes: [
      { code: 'ARENA10', kind: 'percent', value: 10, maxDiscount: null, weekendOnly: false, active: true, uses: 0 },
      { code: 'ARENA60', kind: 'percent', value: 60, maxDiscount: 300, weekendOnly: false, active: true, uses: 0 },
      { code: 'NIGHTOWL', kind: 'flat', value: 300, maxDiscount: null, weekendOnly: false, active: true, uses: 0 },
      { code: 'WEEKEND20', kind: 'percent', value: 20, maxDiscount: null, weekendOnly: true, active: true, uses: 0 },
    ],
    settings: { ...DEFAULT_SETTINGS },
    site: {
      heroTitle: 'Over 100,000 sports turfs and arenas across 500 cities',
      announcement: 'Beta launch: zero booking fees in Mangalore this month!',
      announcementActive: false,
      promos: [
        { id: 'promo_1', title: 'Win an iPhone 18 Pro!', subtitle: 'Book any turf this month to enter the massive giveaway. 1 Booking = 1 Entry.', image: '/iphone18.jpg' },
        { id: 'promo_2', title: 'Midnight Madness', subtitle: 'Flat ₹300 off. Code: NIGHTOWL', image: 'https://images.unsplash.com/photo-1551280857-2b9bbe5204eb?q=80&w=2000&auto=format&fit=crop' },
        { id: 'promo_3', title: 'Weekend Warrior', subtitle: 'Get 20% off weekend slots. Code: WEEKEND20', image: 'https://images.unsplash.com/photo-1529900965798-eb5043b428d0?q=80&w=2000&auto=format&fit=crop' },
      ],
    },
    applications: [],
    walletTxns: [],
    holds: [],
  };

  // Demo partner owns the first and the seventh turf; every other turf gets its own partner
  const demoPartnerId = 'partner_demo';
  data.partners.push({
    id: demoPartnerId,
    name: 'Rohan Shetty',
    email: (process.env.PARTNER_EMAIL || 'partner@oyun.in').toLowerCase(),
    phone: '9876512345',
    passwordHash: hashPassword(process.env.PARTNER_PASSWORD || generateTempPassword()),
    status: 'active',
    business: { legalName: 'Shetty Sports LLP', gstin: '29ABCDE1234F1Z5', address: 'Kodialbail, Mangalore, Karnataka 575003' },
    createdAt,
  });

  turfSeeds.forEach((t, i) => {
    let partnerId = demoPartnerId;
    if (i !== 0 && i !== 6) {
      partnerId = `partner_${t.id}`;
      data.partners.push({
        id: partnerId,
        name: t.ownerName,
        email: `${t.id}@partners.oyun.in`,
        phone: t.phone.replace(/\D/g, '').slice(-10),
        passwordHash: hashPassword(generateTempPassword()),
        status: 'active',
        business: { legalName: t.ownerName, gstin: '', address: t.location },
        createdAt,
      });
    }
    data.turfs.push({ ...t, city: 'Mangalore', status: 'active', partnerId, commissionPercent: null, createdAt });
    data.pricing[t.id] = { ...DEFAULT_PRICING };
    data.addOns.push(
      { id: newId('addon'), turfId: t.id, name: 'Bibs set (10)', price: 100, active: true },
      { id: newId('addon'), turfId: t.id, name: 'Match football', price: 150, active: true },
      { id: newId('addon'), turfId: t.id, name: 'Football shoes (pair)', price: 80, active: true },
      { id: newId('addon'), turfId: t.id, name: 'Water bottle (1L)', price: 20, active: true },
      { id: newId('addon'), turfId: t.id, name: 'Energy drink', price: 60, active: true },
    );
  });

  const demoTurf = data.turfs[0].id;
  data.offers.push(
    { id: newId('offer'), turfId: demoTurf, type: 'happy_hour', title: 'Early Bird', percentOff: 20, startHour: 6, endHour: 9, active: true, createdAt },
    { id: newId('offer'), turfId: demoTurf, type: 'first_time', title: 'First game', percentOff: 15, startHour: 0, endHour: 24, active: true, createdAt },
  );

  data.staff.push(
    { id: 'staff_demo_manager', partnerId: demoPartnerId, name: 'Kiran Rao', email: 'kiran@perfectpass.in', phone: '9845011122', role: 'manager', passwordHash: hashPassword(generateTempPassword()), createdAt },
    { id: 'staff_demo_desk', partnerId: demoPartnerId, name: 'Anil Kumar', email: 'anil@perfectpass.in', phone: '9845033344', role: 'front_desk', passwordHash: hashPassword(generateTempPassword()), createdAt },
  );

  PLAYER_NAMES.forEach((name, i) => {
    const player = createPlayer(data, name, `98${String(45000000 + i * 137171).padStart(8, '0')}`);
    walletTxn(data, player, [0, 250, 100, 0, 500, 50][i % 6], 'admin_adjust', 'Launch welcome credit');
  });

  data.applications.push(
    { id: newId('app'), ownerName: 'Aditya Shenoy', ownerPhone: '9900112233', ownerEmail: 'aditya@greenfield.in', turfName: 'Greenfield Arena', area: 'Kankanady', address: 'Near Kankanady Market, Mangalore', sport: 'Football', size: '7-a-side', surface: 'Artificial Grass', openTime: '06:00', closeTime: '23:00', weekdayPrice: 1100, description: 'New 7-a-side turf with floodlights and parking.', whatsapp: '9900112233', amenities: ['Parking', 'Floodlights', 'Drinking Water'], status: 'pending', note: '', turfId: null, createdAt: new Date(Date.now() - 2 * 3600e3).toISOString(), reviewedAt: null },
    { id: newId('app'), ownerName: 'Mohammed Rafiq', ownerPhone: '9900445566', ownerEmail: 'rafiq@kickoff.in', turfName: 'Kickoff Turf', area: 'Surathkal', address: 'NH 66, Surathkal', sport: 'Football', size: '5-a-side', surface: 'Synthetic Turf', openTime: '07:00', closeTime: '22:00', weekdayPrice: 800, description: 'Compact 5-a-side turf close to NITK.', whatsapp: '9900445566', amenities: ['Floodlights', 'Restrooms'], status: 'pending', note: '', turfId: null, createdAt: new Date(Date.now() - 5 * 3600e3).toISOString(), reviewedAt: null },
    { id: newId('app'), ownerName: 'Vikram Prabhu', ownerPhone: '9900778899', ownerEmail: 'vikram@urbanplay.in', turfName: 'Urban Play', area: 'Bejai', address: 'Bejai Main Road, Mangalore', sport: 'Football', size: '6-a-side', surface: 'FIFA Pro Artificial Grass', openTime: '06:00', closeTime: '23:00', weekdayPrice: 1200, description: 'Rooftop turf with café and changing rooms.', whatsapp: '9900778899', amenities: ['Changing Rooms', 'Café', 'Parking', 'Floodlights'], status: 'pending', note: '', turfId: null, createdAt: new Date(Date.now() - 26 * 3600e3).toISOString(), reviewedAt: null },
  );

  // Bookings: last 14 days, today, and the next 3 days
  for (const turf of data.turfs) {
    const density = turf.id === demoTurf ? 0.5 : 0.3;
    for (let offset = -14; offset <= 3; offset++) {
      const date = addDays(now.date, offset);
      for (const hour of turfHours(turf)) {
        if (rand() > density) continue;
        const player: Player = data.players[Math.floor(rand() * data.players.length)];
        const walkIn = rand() < 0.2;
        const isPast = date < now.date || (date === now.date && hour <= now.hour);
        const addOnPick = rand() < 0.35 ? data.addOns.filter((a) => a.turfId === turf.id).slice(0, 2).map((a) => ({ id: a.id, qty: 1 })) : [];

        // Quote as if booked a week earlier so last-minute discounts don't apply
        const quote = buildQuote(data, { turfId: turf.id, date, hour, addOns: addOnPick, source: walkIn ? 'walk_in' : 'online' }, { date: addDays(date, -7), hour: 0, minute: 0 });
        if (!quote) continue;

        let status: BookingStatus = 'confirmed';
        if (isPast) {
          const r = rand();
          status = r < 0.82 ? 'checked_in' : r < 0.92 ? 'no_show' : r < 0.97 ? 'cancelled' : 'refunded';
        }
        const paymentMode: PaymentMode = walkIn ? (rand() < 0.5 ? 'cash' : 'upi') : rand() < 0.6 ? 'full' : 'advance';
        const booking: Booking = {
          id: newId('bk'),
          code: newBookingCode(data),
          turfId: turf.id,
          date,
          hour,
          timeLabel: formatHour(hour),
          customerName: player.name,
          customerPhone: player.phone,
          playerId: player.id,
          source: walkIn ? 'walk_in' : 'online',
          createdBy: walkIn ? 'Front desk' : null,
          addOns: quote.addOns,
          pricing: quote.breakdown,
          paymentMode,
          amountPaid: paymentMode === 'advance' ? quote.breakdown.advance : quote.breakdown.total,
          status,
          checkedInAt: status === 'checked_in' ? new Date(`${date}T${String(hour).padStart(2, '0')}:05:00+05:30`).toISOString() : null,
          createdAt: new Date(`${addDays(date, -2)}T10:00:00+05:30`).toISOString(),
        };
        data.bookings.push(booking);
      }
    }
  }

  // A player who joined with Rahul's referral code and has an upcoming game:
  // checking them in pays both referral rewards
  const referrer = data.players[0];
  const referred = createPlayer(data, 'Karthik Suvarna', '9845099999', referrer.id);
  const demo = data.turfs[0];
  const freeHour = turfHours(demo).find(
    (h) => h > now.hour && !data.bookings.some((b) => b.turfId === demo.id && b.date === now.date && b.hour === h)
  );
  const refDate = freeHour === undefined ? addDays(now.date, 1) : now.date;
  const refHour = freeHour ?? turfHours(demo).find((h) => !data.bookings.some((b) => b.turfId === demo.id && b.date === refDate && b.hour === h));
  if (refHour !== undefined) {
    const quote = buildQuote(data, { turfId: demo.id, date: refDate, hour: refHour, source: 'online' }, { date: addDays(refDate, -7), hour: 0, minute: 0 });
    if (quote) {
      data.bookings.push({
        id: newId('bk'), code: newBookingCode(data), turfId: demo.id, date: refDate, hour: refHour, timeLabel: formatHour(refHour),
        customerName: referred.name, customerPhone: referred.phone, playerId: referred.id, source: 'online', createdBy: null,
        addOns: [], pricing: quote.breakdown, paymentMode: 'full', amountPaid: quote.breakdown.total, status: 'confirmed',
        checkedInAt: null, createdAt,
      });
    }
  }

  // A maintenance block on the demo turf tomorrow morning
  data.blocks.push({ id: newId('block'), turfId: demoTurf, date: addDays(now.date, 1), hour: 7, reason: 'Turf maintenance', createdBy: 'Rohan Shetty', createdAt });

  return data;
}
