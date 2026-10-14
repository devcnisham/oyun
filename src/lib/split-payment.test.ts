import { describe, it, expect } from 'vitest';
import {
  isValidUpiId,
  calculateSplit,
  generateUpiLink,
  generateSplitShareMessage,
} from './split-payment';

describe('split payment logic', () => {
  describe('isValidUpiId', () => {
    it('accepts valid UPI VPAs', () => {
      expect(isValidUpiId('9876543210@upi')).toBe(true);
      expect(isValidUpiId('john.doe@okhdfcbank')).toBe(true);
      expect(isValidUpiId('player_123@icici')).toBe(true);
      expect(isValidUpiId('fc.mangalore@axisbank')).toBe(true);
    });

    it('rejects invalid UPI IDs', () => {
      expect(isValidUpiId('')).toBe(false);
      expect(isValidUpiId('plainstring')).toBe(false);
      expect(isValidUpiId('@upi')).toBe(false);
      expect(isValidUpiId('user@')).toBe(false);
      expect(isValidUpiId('user @upi')).toBe(false);
      expect(isValidUpiId(null as unknown as string)).toBe(false);
    });
  });

  describe('calculateSplit', () => {
    it('splits evenly when divisible', () => {
      const res = calculateSplit(1000, 5);
      expect(res.perPerson).toBe(200);
      expect(res.playerCount).toBe(5);
      expect(res.total).toBe(1000);
    });

    it('rounds up with ceil to prevent host shortfall when indivisible', () => {
      // 1000 / 3 = 333.33 -> 334
      const res = calculateSplit(1000, 3);
      expect(res.perPerson).toBe(334);
    });

    it('clamps player count safely', () => {
      const minRes = calculateSplit(1000, 0);
      expect(minRes.playerCount).toBe(1);
      expect(minRes.perPerson).toBe(1000);

      const maxRes = calculateSplit(1000, 100);
      expect(maxRes.playerCount).toBe(50);
      expect(maxRes.perPerson).toBe(20);
    });
  });

  describe('generateUpiLink', () => {
    it('builds a standard UPI deep link intent URL', () => {
      const link = generateUpiLink({
        upiId: 'organizer@upi',
        payeeName: 'Rahul',
        amount: 250,
        note: 'Turf game share',
      });

      expect(link.startsWith('upi://pay?')).toBe(true);
      const url = new URL(link);
      expect(url.searchParams.get('pa')).toBe('organizer@upi');
      expect(url.searchParams.get('pn')).toBe('Rahul');
      expect(url.searchParams.get('am')).toBe('250');
      expect(url.searchParams.get('cu')).toBe('INR');
      expect(url.searchParams.get('tn')).toBe('Turf game share');
    });
  });

  describe('generateSplitShareMessage', () => {
    it('generates a detailed team share message for WhatsApp', () => {
      const msg = generateSplitShareMessage({
        turfName: 'Arena One',
        date: 'Wednesday, 14 Oct',
        timeSlot: '07:00 PM – 08:00 PM',
        totalAmount: 1200,
        playerCount: 6,
        perPerson: 200,
        upiLink: 'upi://pay?pa=rahul@upi&pn=Rahul&am=200&cu=INR',
      });

      expect(msg).toContain('Arena One');
      expect(msg).toContain('Wednesday, 14 Oct');
      expect(msg).toContain('07:00 PM – 08:00 PM');
      expect(msg).toContain('Total: ₹1200 split among 6 players');
      expect(msg).toContain('Your share: ₹200');
      expect(msg).toContain('upi://pay?pa=rahul@upi');
    });
  });
});
