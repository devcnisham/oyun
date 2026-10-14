import type { Booking } from './types';

export interface DoubleBookingConflict {
  turfId: string;
  date: string;
  hour: number;
  pitchConflict: string;
  bookingIds: string[];
  bookingCodes: string[];
}

export interface PagingIncident {
  severity: 'critical' | 'error' | 'warning' | 'info';
  title: string;
  summary: string;
  dedupKey?: string;
  details?: Record<string, unknown>;
}

export interface PagingResult {
  paged: boolean;
  service: 'pagerduty' | 'opsgenie' | 'webhook' | 'mock';
  incidentId?: string;
}

export const ALERT_THRESHOLDS = {
  // SEV-1: Double bookings MUST read 0 at all times
  MAX_DOUBLE_BOOKINGS: 0,
  // SEV-2: Maximum tolerated payment failure rate (5%)
  MAX_PAYMENT_FAILURE_RATE: 0.05,
  // SEV-2: Webhook arrival SLA (60s)
  MAX_WEBHOOK_DELAY_SEC: 60,
  // SEV-3: Maximum API p95 latency (500ms)
  MAX_LATENCY_P95_MS: 500,
} as const;

/**
 * Scans bookings to detect live collisions (status confirmed or checked_in).
 * Handles split pitches ('full' conflicts with 'full', 'A', 'B'; 'A' conflicts with 'A' and 'full').
 */
export function detectDoubleBookings(bookings: Booking[]): {
  count: number;
  conflicts: DoubleBookingConflict[];
} {
  const activeBookings = bookings.filter((b) => b.status === 'confirmed' || b.status === 'checked_in');
  const conflicts: DoubleBookingConflict[] = [];

  // Group by turfId + date + hour
  const groups = new Map<string, Booking[]>();
  for (const b of activeBookings) {
    const hours = b.hours && b.hours.length > 0 ? b.hours : [b.hour];
    for (const h of hours) {
      const key = `${b.turfId}:${b.date}:${h}`;
      const list = groups.get(key) ?? [];
      list.push(b);
      groups.set(key, list);
    }
  }

  for (const [, list] of groups) {
    if (list.length <= 1) continue;

    // Check pairwise pitch overlaps
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const b1 = list[i];
        const b2 = list[j];
        if (b1.id === b2.id) continue;
        const p1 = b1.pitch ?? 'full';
        const p2 = b2.pitch ?? 'full';

        const overlaps = p1 === 'full' || p2 === 'full' || p1 === p2;
        if (overlaps) {
          conflicts.push({
            turfId: b1.turfId,
            date: b1.date,
            hour: b1.hour,
            pitchConflict: `${p1} vs ${p2}`,
            bookingIds: [b1.id, b2.id],
            bookingCodes: [b1.code, b2.code],
          });
        }
      }
    }
  }

  return {
    count: conflicts.length,
    conflicts,
  };
}

/**
 * Triggers an on-call phone paging alert (PagerDuty Events API v2, OpsGenie, or Webhook).
 * Logs an unredacted incident summary without personal customer data.
 */
export async function triggerOnCallPage(incident: PagingIncident): Promise<PagingResult> {
  const pagerdutyKey = process.env.PAGERDUTY_ROUTING_KEY;
  const opsgenieKey = process.env.OPSGENIE_API_KEY;
  const pagingWebhook = process.env.PAGING_WEBHOOK_URL;

  console.error(`🚨 [ON-CALL PAGE - ${incident.severity.toUpperCase()}] ${incident.title}: ${incident.summary}`);

  // 1. PagerDuty Events API v2
  if (pagerdutyKey && !pagerdutyKey.startsWith('dummy_')) {
    try {
      const res = await fetch('https://events.pagerduty.com/v2/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routing_key: pagerdutyKey,
          event_action: 'trigger',
          dedup_key: incident.dedupKey,
          payload: {
            summary: incident.title,
            severity: incident.severity,
            source: 'oyun-production',
            component: 'booking-engine',
            custom_details: incident.details,
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return { paged: true, service: 'pagerduty', incidentId: data.dedup_key };
      }
    } catch (err) {
      console.error('[paging] PagerDuty dispatch failed:', err);
    }
  }

  // 2. OpsGenie Alerts API
  if (opsgenieKey && !opsgenieKey.startsWith('dummy_')) {
    try {
      const res = await fetch('https://api.opsgenie.com/v2/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `GenieKey ${opsgenieKey}`,
        },
        body: JSON.stringify({
          message: incident.title,
          description: incident.summary,
          priority: incident.severity === 'critical' ? 'P1' : 'P2',
          details: incident.details,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return { paged: true, service: 'opsgenie', incidentId: data.requestId };
      }
    } catch (err) {
      console.error('[paging] OpsGenie dispatch failed:', err);
    }
  }

  // 3. Generic Paging Webhook (Slack / Discord / Custom SMS relay)
  if (pagingWebhook && pagingWebhook.startsWith('https://')) {
    try {
      await fetch(pagingWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 [PAGING ALERT] ${incident.title}\n${incident.summary}`,
          severity: incident.severity,
          details: incident.details,
        }),
      });
      return { paged: true, service: 'webhook' };
    } catch (err) {
      console.error('[paging] Paging webhook failed:', err);
    }
  }

  // Mock / local development mode
  return {
    paged: true,
    service: 'mock',
    incidentId: `mock_${Date.now().toString(36)}`,
  };
}
