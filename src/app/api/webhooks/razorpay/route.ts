import { NextResponse } from 'next/server';
import { clientIpFrom } from '@/lib/client-ip';
import { processPaymentWebhook, razorpayWebhookSecret, verifyRazorpaySignature } from '@/lib/payments';
import { refreshAll } from '@/lib/action-utils';
import { sharedRateLimit } from '@/lib/shared-rate-limit';

export async function POST(req: Request) {
  const ip = clientIpFrom(req.headers);
  if (!(await sharedRateLimit(`webhook:razorpay:${ip}`, 120, 60_000))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const signature = req.headers.get('x-razorpay-signature') || '';
  const rawBody = await req.text();

  if (!rawBody || rawBody.length > 100_000) {
    return NextResponse.json({ error: 'Payload too large or empty' }, { status: 400 });
  }

  const secret = razorpayWebhookSecret();
  if (!secret) {
    return NextResponse.json({ error: 'Webhook is not configured' }, { status: 503 });
  }
  if (!verifyRazorpaySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const result = await processPaymentWebhook(rawBody, signature);
  if (!result.ok) {
    return NextResponse.json({ error: result.error || 'Webhook processing failed' }, { status: 400 });
  }

  // A confirmed or refunded payment changes bookings: update player, partner and admin pages
  refreshAll();

  return NextResponse.json({
    received: true,
    action: result.action,
    orderId: result.orderId,
    paymentId: result.paymentId,
    refundId: result.refundId,
  });
}
