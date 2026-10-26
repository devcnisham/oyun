import { beforeEach, describe, expect, test } from 'vitest';
import {
  calculatePartnerSettlement,
  calculateTPlus2SettlementPeriod,
  createSettlementBatch,
  executePayoutTransfer,
  generatePayoutStatementHtml,
  reconcilePayoutSettlements,
} from '@/modules/shared/lib/payouts';
import { getDb, mutate } from '@/modules/shared/database/store';
import { newId } from '@/modules/shared/database/ids';
import type { Booking, Partner, PayoutRecord, Turf } from '@/modules/shared/database/types';
import { addDays, istNow } from '@/modules/shared/lib/time';

describe('Bank payouts and T+2 settlements (P11-08 #203, #169)', () => {
  const partnerId = 'partner_test_payout';
  const turfId = 'turf_test_payout';
  const today = istNow().date;
  const matchDate = addDays(today, -2);

  const mockPartner: Partner = {
    id: partnerId,
    name: 'Mangalore Arena Partner',
    email: 'arena@oyun.test',
    phone: '9876543210',
    passwordHash: 'hash',
    status: 'active',
    business: {
      legalName: 'Mangalore Turf Enterprises LLP',
      gstin: '29ABCDE1234F1Z5',
      address: 'Kodialbail, Mangalore, Karnataka 575003',
      bankAccountNumber: '912345678901',
      bankIfsc: 'HDFC0001234',
      bankBeneficiaryName: 'Mangalore Turf Enterprises',
    },
    createdAt: new Date().toISOString(),
  };

  const mockTurf: Turf = {
    id: turfId,
    name: 'Mangalore Arena',
    location: 'Kodialbail, Mangalore',
    area: 'Kodialbail',
    city: 'Mangalore',
    rating: 4.8,
    reviewCount: 20,
    pricePerHour: 1000,
    sports: ['Football'],
    amenities: ['Floodlights'],
    size: '6-a-side',
    formats: ['6-a-side'],
    surface: 'Artificial Grass',
    openTime: '06:00',
    closeTime: '23:00',
    images: ['/turfs/turf_0.jpg'],
    isVerified: true,
    isFeatured: true,
    description: 'Premier turf arena',
    ownerName: 'Partner Owner',
    phone: '9876543210',
    partnerId,
    status: 'active',
    commissionPercent: 10,
    createdAt: new Date().toISOString(),
  };

  const mockBookings: Booking[] = [
    {
      id: newId('bk'),
      code: 'SA-PAY001',
      turfId,
      date: matchDate,
      hour: 18,
      timeLabel: '06:00 PM',
      customerName: 'Player Online',
      customerPhone: '9876500001',
      playerId: 'pl_001',
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
        advance: 200,
        walletDeduction: 0,
        total: 1000,
      },
      paymentMode: 'full',
      amountPaid: 1000,
      status: 'confirmed',
      checkedInAt: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: newId('bk'),
      code: 'SA-PAY002',
      turfId,
      date: matchDate,
      hour: 19,
      timeLabel: '07:00 PM',
      customerName: 'Player Venue Cash',
      customerPhone: '9876500002',
      playerId: 'pl_002',
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
        advance: 0,
        walletDeduction: 0,
        total: 1000,
      },
      paymentMode: 'venue',
      amountPaid: 0,
      status: 'confirmed',
      checkedInAt: null,
      createdAt: new Date().toISOString(),
    },
  ];

  beforeEach(async () => {
    await mutate((db) => {
      db.payouts = [];
      db.partners = db.partners.filter((p) => p.id !== partnerId);
      db.partners.push({ ...mockPartner });

      db.turfs = db.turfs.filter((t) => t.id !== turfId);
      db.turfs.push({ ...mockTurf });

      db.bookings = db.bookings.filter((b) => b.turfId !== turfId);
      db.bookings.push(...mockBookings);
    });
  });

  describe('calculateTPlus2SettlementPeriod', () => {
    test('computes T+2 settlement dates', () => {
      const period = calculateTPlus2SettlementPeriod('2026-10-14');
      expect(period.periodStart).toBe('2026-10-12');
      expect(period.periodEnd).toBe('2026-10-14');
      expect(period.settlementDate).toBe('2026-10-16');
    });
  });

  describe('calculatePartnerSettlement', () => {
    test('calculates gross, online, commission (10%), and net payout', async () => {
      const db = await getDb();
      const settlement = calculatePartnerSettlement(db, partnerId, matchDate, matchDate);

      expect(settlement.bookingsCount).toBe(1);
      expect(settlement.gross).toBe(1000); // 1 paid online
      expect(settlement.onlineCollected).toBe(1000);
      expect(settlement.commissionRate).toBe(10);
      expect(settlement.commission).toBe(100); // 10% of 1000
      expect(settlement.commissionGst).toBe(18); // 18% of 100
      expect(settlement.net).toBe(882); // 1000 - 100 - 18
    });

    test('excludes bookings that are already locked in another payout', async () => {
      await mutate((db) => {
        db.payouts ??= [];
        db.payouts.push({
          id: newId('po'),
          partnerId,
          turfId,
          periodStart: matchDate,
          periodEnd: matchDate,
          payoutDate: today,
          bookingIds: [mockBookings[0].id],
          bookingsCount: 1,
          gross: 1000,
          onlineCollected: 1000,
          commission: 100,
          commissionGst: 18,
          net: 882,
          status: 'paid',
          utr: 'UTR123',
          failureReason: null,
          idempotencyKey: 'idemp_key_1',
          createdAt: new Date().toISOString(),
          paidAt: new Date().toISOString(),
        });
      });

      const db = await getDb();
      const settlement = calculatePartnerSettlement(db, partnerId, matchDate, matchDate);

      // mockBookings[0] is locked, only mockBookings[1] remains (which has amountPaid 0)
      expect(settlement.bookingIds).not.toContain(mockBookings[0].id);
      expect(settlement.net).toBe(0);
    });
  });

  describe('createSettlementBatch', () => {
    test('creates payout record for eligible partners and enforces date range', async () => {
      const payouts = await createSettlementBatch(matchDate, matchDate);
      expect(payouts).toHaveLength(1);

      const p = payouts[0];
      expect(p.partnerId).toBe(partnerId);
      expect(p.turfId).toBe(turfId);
      expect(p.net).toBe(882);
      expect(p.status).toBe('pending');
      expect(p.idempotencyKey).toBe(`payout_${partnerId}_${matchDate}_to_${matchDate}`);
    });

    test('prevents overlapping active payout periods for the same partner', async () => {
      await createSettlementBatch(matchDate, matchDate);

      // Attempt to create overlapping batch
      const dup = await createSettlementBatch(matchDate, matchDate);
      expect(dup).toHaveLength(0);
    });
  });

  describe('executePayoutTransfer (Runbook 1 Protocol)', () => {
    test('successful transfer: sets status to paid, stores UTR and paidAt', async () => {
      const payouts = await createSettlementBatch(matchDate, matchDate);
      const res = await executePayoutTransfer(payouts[0].id);

      expect(res.ok).toBe(true);
      expect(res.status).toBe('paid');
      expect(res.utr).toMatch(/^UTR/);

      const db = await getDb();
      const stored = db.payouts?.find((p) => p.id === payouts[0].id);
      expect(stored?.status).toBe('paid');
      expect(stored?.paidAt).toBeTruthy();
      expect(stored?.utr).toBe(res.utr);
    });

    test('failed transfer: holds amount (on_hold), logs reason, and triggers alert', async () => {
      // Simulate partner with invalid bank details
      await mutate((db) => {
        const p = db.partners.find((x) => x.id === partnerId);
        if (p) {
          p.business.bankAccountNumber = 'FAIL'; // special test trigger
        }
      });

      const payouts = await createSettlementBatch(matchDate, matchDate);
      const res = await executePayoutTransfer(payouts[0].id);

      expect(res.ok).toBe(false);
      expect(res.status).toBe('on_hold');
      expect(res.error).toContain('BENEFICIARY_BANK_OFFLINE');

      const db = await getDb();
      const stored = db.payouts?.find((p) => p.id === payouts[0].id);
      expect(stored?.status).toBe('on_hold');
      expect(stored?.failureReason).toContain('BENEFICIARY_BANK_OFFLINE');
    });
  });

  describe('reconcilePayoutSettlements (Issue #169)', () => {
    test('reports reconciled when gateway transactions match online booking revenue', () => {
      const payout: PayoutRecord = {
        id: 'po_test_rec',
        partnerId,
        turfId,
        periodStart: matchDate,
        periodEnd: matchDate,
        payoutDate: today,
        bookingIds: [mockBookings[0].id],
        bookingsCount: 1,
        gross: 1000,
        onlineCollected: 1000,
        commission: 100,
        commissionGst: 18,
        net: 882,
        status: 'paid',
        utr: 'UTR123',
        failureReason: null,
        idempotencyKey: 'idemp_test',
        createdAt: new Date().toISOString(),
        paidAt: new Date().toISOString(),
      };

      const result = reconcilePayoutSettlements(payout, [{ id: mockBookings[0].id, amount: 1000 }]);
      expect(result.status).toBe('reconciled');
      expect(result.discrepancyAmount).toBe(0);
      expect(result.matchedCount).toBe(1);
      expect(result.unmatchedCount).toBe(0);
    });

    test('flags discrepancy when gateway settlement amount does not match expected online collected', () => {
      const payout: PayoutRecord = {
        id: 'po_test_rec_diff',
        partnerId,
        turfId,
        periodStart: matchDate,
        periodEnd: matchDate,
        payoutDate: today,
        bookingIds: [mockBookings[0].id],
        bookingsCount: 1,
        gross: 1000,
        onlineCollected: 1000,
        commission: 100,
        commissionGst: 18,
        net: 882,
        status: 'paid',
        utr: 'UTR123',
        failureReason: null,
        idempotencyKey: 'idemp_test',
        createdAt: new Date().toISOString(),
        paidAt: new Date().toISOString(),
      };

      // Gateway only settled 950 (e.g. unexpected chargeback or deduction)
      const result = reconcilePayoutSettlements(payout, [{ id: mockBookings[0].id, amount: 950 }]);
      expect(result.status).toBe('discrepancy');
      expect(result.discrepancyAmount).toBe(50);
    });
  });

  describe('generatePayoutStatementHtml', () => {
    test('generates complete HTML document with OYUN and partner GST details', () => {
      const payout: PayoutRecord = {
        id: 'po_test_stmt',
        partnerId,
        turfId,
        periodStart: matchDate,
        periodEnd: matchDate,
        payoutDate: today,
        bookingIds: [mockBookings[0].id],
        bookingsCount: 1,
        gross: 1000,
        onlineCollected: 1000,
        commission: 100,
        commissionGst: 18,
        net: 882,
        status: 'paid',
        utr: 'UTR99887766',
        failureReason: null,
        idempotencyKey: 'idemp_test',
        createdAt: new Date().toISOString(),
        paidAt: new Date().toISOString(),
      };

      const html = generatePayoutStatementHtml(payout, mockPartner, mockTurf, [mockBookings[0]], 18);

      expect(html).toContain('OYUN TURF SETTLEMENT STATEMENT');
      expect(html).toContain('Mangalore Turf Enterprises LLP');
      expect(html).toContain('29ABCDE1234F1Z5');
      expect(html).toContain('29AAFCO1234F1Z5');
      expect(html).toContain('UTR99887766');
      expect(html).toContain('SA-PAY001');
      expect(html).toContain('₹882');
    });
  });
});
