import { describe, expect, test } from 'vitest';
import { computePlatformAnalytics } from './analytics';
import type { Booking, Database, Turf } from './types';

describe('Admin platform analytics (P13-05)', () => {
  const mockTurfs: Turf[] = [
    {
      id: 'turf_a',
      name: 'Arena A',
      location: 'Kodialbail, Mangalore',
      area: 'Kodialbail',
      city: 'Mangalore',
      rating: 4.9,
      reviewCount: 30,
      pricePerHour: 1200,
      sports: ['Football'],
      amenities: ['Floodlights'],
      size: '6-a-side',
      formats: ['6-a-side'],
      surface: 'Grass',
      openTime: '06:00',
      closeTime: '23:00',
      images: [],
      isVerified: true,
      isFeatured: true,
      description: 'Arena A',
      ownerName: 'Owner A',
      phone: '9876543210',
      partnerId: 'partner_1',
      status: 'active',
      commissionPercent: 10,
      createdAt: '2026-10-01T00:00:00Z',
    },
    {
      id: 'turf_b',
      name: 'Arena B',
      location: 'Bejai, Mangalore',
      area: 'Bejai',
      city: 'Mangalore',
      rating: 4.5,
      reviewCount: 15,
      pricePerHour: 1000,
      sports: ['Box Cricket'],
      amenities: ['Parking'],
      size: 'Box Cricket',
      formats: ['6-a-side'],
      surface: 'Turf',
      openTime: '07:00',
      closeTime: '22:00',
      images: [],
      isVerified: true,
      isFeatured: false,
      description: 'Arena B',
      ownerName: 'Owner B',
      phone: '9876543211',
      partnerId: 'partner_2',
      status: 'active',
      commissionPercent: 12,
      createdAt: '2026-10-01T00:00:00Z',
    },
  ];

  const mockBookings: Booking[] = [
    {
      id: 'bk_1',
      code: 'SA-AN1',
      turfId: 'turf_a',
      date: '2026-10-14',
      hour: 18,
      timeLabel: '06:00 PM',
      customerName: 'Player 1',
      customerPhone: '9876500001',
      playerId: null,
      source: 'online',
      createdBy: null,
      addOns: [],
      pricing: {
        basePrice: 1200,
        slotPrice: 1200,
        adjustments: [],
        addOnTotal: 0,
        subtotal: 1200,
        offer: null,
        promo: null,
        advance: 150,
        walletDeduction: 0,
        total: 1200,
      },
      paymentMode: 'full',
      amountPaid: 1200,
      status: 'checked_in',
      checkedInAt: '2026-10-14T18:05:00Z',
      createdAt: '2026-10-14T10:00:00Z',
    },
    {
      id: 'bk_2',
      code: 'SA-AN2',
      turfId: 'turf_a',
      date: '2026-10-14',
      hour: 19,
      timeLabel: '07:00 PM',
      customerName: 'Player 2',
      customerPhone: '9876500002',
      playerId: null,
      source: 'online',
      createdBy: null,
      addOns: [],
      pricing: {
        basePrice: 1200,
        slotPrice: 1200,
        adjustments: [],
        addOnTotal: 0,
        subtotal: 1200,
        offer: null,
        promo: null,
        advance: 150,
        walletDeduction: 0,
        total: 1200,
      },
      paymentMode: 'venue',
      amountPaid: 0,
      status: 'confirmed',
      checkedInAt: null,
      createdAt: '2026-10-14T11:00:00Z',
    },
    {
      id: 'bk_3',
      code: 'SA-AN3',
      turfId: 'turf_b',
      date: '2026-10-14',
      hour: 18,
      timeLabel: '06:00 PM',
      customerName: 'Player 3',
      customerPhone: '9876500003',
      playerId: null,
      source: 'online',
      createdBy: null,
      addOns: [],
      pricing: {
        basePrice: 1000,
        slotPrice: 1000,
        adjustments: [],
        addOnTotal: 0,
        subtotal: 1000,
        offer: null,
        promo: null,
        advance: 150,
        walletDeduction: 0,
        total: 1000,
      },
      paymentMode: 'full',
      amountPaid: 1000,
      status: 'cancelled',
      checkedInAt: null,
      createdAt: '2026-10-14T12:00:00Z',
    },
    {
      id: 'bk_4',
      code: 'SA-AN4',
      turfId: 'turf_b',
      date: '2026-10-14',
      hour: 20,
      timeLabel: '08:00 PM',
      customerName: 'Player 4',
      customerPhone: '9876500004',
      playerId: null,
      source: 'online',
      createdBy: null,
      addOns: [],
      pricing: {
        basePrice: 1000,
        slotPrice: 1000,
        adjustments: [],
        addOnTotal: 0,
        subtotal: 1000,
        offer: null,
        promo: null,
        advance: 150,
        walletDeduction: 0,
        total: 1000,
      },
      paymentMode: 'venue',
      amountPaid: 150, // advance kept
      status: 'no_show',
      checkedInAt: null,
      createdAt: '2026-10-14T13:00:00Z',
    },
  ];

  const mockDb: Database = {
    version: 2,
    turfs: mockTurfs,
    partners: [],
    staff: [],
    players: [],
    bookings: mockBookings,
    blocks: [],
    offers: [],
    addOns: [],
    pricing: {},
    promoCodes: [],
    settings: {
      commissionPercent: 10,
      advancePercent: 10,
      minAdvance: 150,
      maxAdvance: 150,
      gstPercent: 18,
      supportEmail: 'hello@oyun.in',
      supportPhone: '',
      cashbackEnabled: false,
      cashbackPercent: 5,
      cashbackMax: 100,
      referralEnabled: false,
      referrerReward: 100,
      refereeReward: 100,
    },
    site: {
      heroTitle: 'OYUN',
      announcement: '',
      announcementActive: false,
      promos: [],
      ads: [],
    },
    applications: [],
    walletTxns: [],
    holds: [],
  };

  test('computes total bookings, active bookings, and conversion metrics', () => {
    const a = computePlatformAnalytics(mockDb);

    expect(a.totalBookings).toBe(4);
    expect(a.activeBookings).toBe(2); // 1 checked_in + 1 confirmed
    expect(a.cancelledBookings).toBe(1);
    expect(a.checkedInBookings).toBe(1);
    expect(a.noShowBookings).toBe(1);

    // Check-in rate: 1 checked_in / (2 active + 1 noShow) = 33%
    expect(a.checkInRatePercent).toBe(33);
    // Cancellation rate: 1 cancelled / 4 total = 25%
    expect(a.cancellationRatePercent).toBe(25);
  });

  test('computes area performance breakdown', () => {
    const a = computePlatformAnalytics(mockDb);

    const kodialbail = a.areaBreakdown.find((x) => x.area === 'Kodialbail');
    expect(kodialbail).toBeDefined();
    expect(kodialbail?.turfCount).toBe(1);
    expect(kodialbail?.revenue).toBeGreaterThan(0);

    const bejai = a.areaBreakdown.find((x) => x.area === 'Bejai');
    expect(bejai).toBeDefined();
    expect(bejai?.turfCount).toBe(1);
  });

  test('computes hourly distribution and identifies peak hours', () => {
    const a = computePlatformAnalytics(mockDb);

    expect(a.hourlyDistribution).toHaveLength(24);
    const hour18 = a.hourlyDistribution[18];
    expect(hour18.bookingsCount).toBe(1); // bk_1 (bk_3 was cancelled)
    expect(hour18.isPeak).toBe(true);

    const hour19 = a.hourlyDistribution[19];
    expect(hour19.bookingsCount).toBe(1);
    expect(hour19.isPeak).toBe(true);
  });

  test('computes sport breakdown', () => {
    const a = computePlatformAnalytics(mockDb);

    const football = a.sportBreakdown.find((s) => s.sport === 'Football');
    expect(football).toBeDefined();
    expect(football?.bookingsCount).toBe(2);

    const cricket = a.sportBreakdown.find((s) => s.sport === 'Box Cricket');
    expect(cricket).toBeDefined();
    expect(cricket?.bookingsCount).toBe(1);
  });
});
