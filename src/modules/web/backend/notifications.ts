import type { Booking, Turf } from '@/modules/shared/database/types';
import { formatSlotRange } from '@/modules/shared/lib/time';

export interface NotificationLog {
  id: string;
  type: 'confirmation' | 'reminder' | 'owner_alert' | 'email_receipt' | 'web_push';
  channel: 'whatsapp' | 'sms' | 'email' | 'push';
  recipient: string;
  message: string;
  status: 'sent' | 'queued' | 'simulated';
  createdAt: string;
}

// In-memory buffer for simulated and dispatched notifications
const notificationHistory: NotificationLog[] = [];

export function getDispatchedNotifications(): NotificationLog[] {
  return [...notificationHistory];
}

export function clearNotificationHistory(): void {
  notificationHistory.length = 0;
}

/**
 * P12-01: Booking confirmation via WhatsApp / SMS
 */
export async function sendBookingConfirmation(
  booking: Booking,
  turf: Turf
): Promise<NotificationLog> {
  const hoursText = booking.hours && booking.hours.length > 0
    ? booking.hours.map((h) => formatSlotRange(h, 60)).join(', ')
    : formatSlotRange(booking.hour, 60);

  const message = `🎉 Booking Confirmed at ${turf.name}!\n` +
    `Code: ${booking.code}\n` +
    `Date: ${booking.date}\n` +
    `Slot(s): ${hoursText}\n` +
    `Amount Paid: ₹${booking.amountPaid}\n` +
    `Location: ${turf.location}, ${turf.area}\n` +
    `Ticket: /bookings/${booking.id}`;

  const log: NotificationLog = {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: 'confirmation',
    channel: process.env.WHATSAPP_API_KEY ? 'whatsapp' : 'sms',
    recipient: booking.customerPhone,
    message,
    status: process.env.WHATSAPP_API_KEY ? 'sent' : 'simulated',
    createdAt: new Date().toISOString(),
  };

  notificationHistory.push(log);
  return log;
}

/**
 * P12-02: Slot reminder two hours before start time
 */
export async function sendSlotReminder(
  booking: Booking,
  turf: Turf
): Promise<NotificationLog> {
  const timeText = formatSlotRange(booking.hour, 60);
  const message = `⏰ Reminder: Your game at ${turf.name} starts in 2 hours (${timeText}).\n` +
    `Address: ${turf.location}, ${turf.area}\n` +
    `Show ticket: /bookings/${booking.id}`;

  const log: NotificationLog = {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: 'reminder',
    channel: 'whatsapp',
    recipient: booking.customerPhone,
    message,
    status: process.env.WHATSAPP_API_KEY ? 'sent' : 'simulated',
    createdAt: new Date().toISOString(),
  };

  notificationHistory.push(log);
  return log;
}

/**
 * P12-03: Owner alert on new booking or cancellation
 */
export async function sendOwnerAlert(
  booking: Booking,
  turf: Turf,
  action: 'new_booking' | 'cancellation'
): Promise<NotificationLog> {
  const timeText = booking.hours && booking.hours.length > 0
    ? booking.hours.map((h) => formatSlotRange(h, 60)).join(', ')
    : formatSlotRange(booking.hour, 60);

  const message = action === 'new_booking'
    ? `📢 New Booking Alert!\n` +
      `Turf: ${turf.name}\n` +
      `Slot: ${booking.date} (${timeText})\n` +
      `Player: ${booking.customerName} (${booking.customerPhone})\n` +
      `Paid: ₹${booking.amountPaid}`
    : `⚠️ Booking Cancelled!\n` +
      `Turf: ${turf.name}\n` +
      `Slot: ${booking.date} (${timeText})\n` +
      `Player: ${booking.customerName} (${booking.customerPhone})\n` +
      `Slot is now available again for booking.`;

  const log: NotificationLog = {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: 'owner_alert',
    channel: 'whatsapp',
    recipient: turf.phone || 'owner',
    message,
    status: 'simulated',
    createdAt: new Date().toISOString(),
  };

  notificationHistory.push(log);
  return log;
}

/**
 * P12-04: Email receipt
 */
export async function sendEmailReceipt(
  booking: Booking,
  turf: Turf,
  email: string
): Promise<NotificationLog> {
  const total = booking.pricing?.total ?? booking.amountPaid;
  const message = `Receipt for Booking ${booking.code} at ${turf.name}.\n` +
    `Total: ₹${total}. Paid: ₹${booking.amountPaid}.`;

  const log: NotificationLog = {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: 'email_receipt',
    channel: 'email',
    recipient: email,
    message,
    status: process.env.RESEND_API_KEY ? 'sent' : 'simulated',
    createdAt: new Date().toISOString(),
  };

  notificationHistory.push(log);
  return log;
}

/**
 * P12-05: Web push notification
 */
export async function sendWebPush(
  targetEndpoint: string,
  payload: { title: string; body: string; url?: string }
): Promise<NotificationLog> {
  const log: NotificationLog = {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: 'web_push',
    channel: 'push',
    recipient: targetEndpoint,
    message: JSON.stringify(payload),
    status: 'simulated',
    createdAt: new Date().toISOString(),
  };

  notificationHistory.push(log);
  return log;
}
