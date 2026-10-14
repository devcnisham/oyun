import crypto from 'node:crypto';
import { beforeEach, describe, expect, test } from 'vitest';
import {
  autoRefundRaceLostPayment,
  processPaymentWebhook,
  resetPaymentStateForTesting,
  verifyRazorpaySignature,
} from './payments';
import { POST } from '@/app/api/webhooks/razorpay/route';

describe('payments & race-lost auto-refund (P11-09)', () => {
  const secret = 'whsec_test_secret_123456';

  beforeEach(() => {
    resetPaymentStateForTesting();
    process.env.RAZORPAY_WEBHOOK_SECRET = secret;
  });

  function signPayload(payload: string, key = secret): string {
    return crypto.createHmac('sha256', key).update(payload).digest('hex');
  }

  describe('verifyRazorpaySignature', () => {
    test('valid signature matches successfully', () => {
      const payload = JSON.stringify({ event: 'payment.captured' });
      const sig = signPayload(payload);
      expect(verifyRazorpaySignature(payload, sig, secret)).toBe(true);
    });

    test('tampered body is rejected', () => {
      const payload = JSON.stringify({ event: 'payment.captured' });
      const sig = signPayload(payload);
      expect(verifyRazorpaySignature(payload + ' ', sig, secret)).toBe(false);
    });

    test('invalid signature is rejected', () => {
      const payload = JSON.stringify({ event: 'payment.captured' });
      expect(verifyRazorpaySignature(payload, 'bad_signature_hex', secret)).toBe(false);
    });

    test('empty inputs return false gracefully', () => {
      expect(verifyRazorpaySignature('', '', secret)).toBe(false);
      expect(verifyRazorpaySignature('payload', '', '')).toBe(false);
    });
  });

  describe('autoRefundRaceLostPayment', () => {
    test('creates refund with synthetic ID and audit log', async () => {
      const refund = await autoRefundRaceLostPayment({
        paymentId: 'pay_race_test_1',
        orderId: 'order_1',
        amount: 90000,
        bookingId: 'bk_123',
        reason: 'Slot taken before payment arrived',
      });

      expect(refund.ok).toBe(true);
      expect(refund.refundId).toMatch(/^rfnd_race_/);
      expect(refund.status).toBe('processed');
      expect(refund.amount).toBe(90000);
      expect(refund.reason).toBe('Slot taken before payment arrived');
    });

    test('idempotent: multiple refund requests for the same payment return the original record', async () => {
      const first = await autoRefundRaceLostPayment({
        paymentId: 'pay_race_dup',
        amount: 50000,
      });

      const second = await autoRefundRaceLostPayment({
        paymentId: 'pay_race_dup',
        amount: 50000,
      });

      expect(second.refundId).toBe(first.refundId);
    });
  });

  describe('processPaymentWebhook - Race Condition Handling (Brief 4.1 failure branch)', () => {
    test('first payment wins slot; second racing payment is automatically refunded', async () => {
      const slotKey = 'turf_kadri:2026-10-18:18';

      // Player 1 payload
      const payload1 = JSON.stringify({
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_player_1',
              order_id: 'order_player_1',
              amount: 100000,
              status: 'captured',
              notes: { slot_key: slotKey, booking_id: 'bk_winner' },
            },
          },
        },
      });

      // Player 2 payload (races for the exact same slotKey)
      const payload2 = JSON.stringify({
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_player_2',
              order_id: 'order_player_2',
              amount: 100000,
              status: 'captured',
              notes: { slot_key: slotKey, booking_id: 'bk_loser' },
            },
          },
        },
      });

      // 1. First webhook arrives -> Player 1 wins the slot
      const res1 = await processPaymentWebhook(payload1, signPayload(payload1));
      expect(res1.ok).toBe(true);
      expect(res1.action).toBe('confirmed');
      expect(res1.orderId).toBe('order_player_1');

      // 2. Second webhook arrives for the same slot -> Race condition detected!
      // Brief 4.1 failure branch: H (DB unique constraint) -> race lost -> R (Auto refund second payment)
      const res2 = await processPaymentWebhook(payload2, signPayload(payload2));
      expect(res2.ok).toBe(true);
      expect(res2.action).toBe('refunded_due_to_race');
      expect(res2.orderId).toBe('order_player_2');
      expect(res2.paymentId).toBe('pay_player_2');
      expect(res2.refundId).toMatch(/^rfnd_race_/);

      // 3. Replaying the second webhook is idempotent
      const replay2 = await processPaymentWebhook(payload2, signPayload(payload2));
      expect(replay2.ok).toBe(true);
      expect(replay2.action).toBe('already_confirmed');
    });

    test('webhook rejection on invalid signature', async () => {
      const payload = JSON.stringify({ event: 'payment.captured' });
      const res = await processPaymentWebhook(payload, 'wrong_sig');
      expect(res.ok).toBe(false);
      expect(res.error).toBe('invalid_signature');
    });
  });

  describe('POST /api/webhooks/razorpay Route Handler', () => {
    test('accepts valid webhook and returns 200 with action', async () => {
      const payload = JSON.stringify({
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_http_1',
              order_id: 'order_http_1',
              amount: 80000,
              status: 'captured',
              notes: { slot_key: 'turf_test:2026-10-19:10' },
            },
          },
        },
      });

      const req = new Request('http://localhost:3000/api/webhooks/razorpay', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-razorpay-signature': signPayload(payload),
          'x-forwarded-for': '127.0.0.1',
        },
        body: payload,
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.received).toBe(true);
      expect(data.action).toBe('confirmed');
    });

    test('rejects webhook with invalid signature with 400', async () => {
      const payload = JSON.stringify({ event: 'payment.captured' });
      const req = new Request('http://localhost:3000/api/webhooks/razorpay', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-razorpay-signature': 'bad_sig',
          'x-forwarded-for': '127.0.0.1',
        },
        body: payload,
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Invalid signature');
    });
  });
});
