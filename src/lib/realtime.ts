import 'server-only';
import { SLOTS_CHANGED, slotTopic } from './slot-topic';

// Tell every open slot map for these turf/days to refresh, through Supabase Realtime broadcast.
// Best effort: if it fails, browsers still catch up on their next poll.
export async function broadcastSlotChanges(slots: { turfId: string; date: string }[]) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key || slots.length === 0) return;
  const headers: Record<string, string> = { apikey: key, 'Content-Type': 'application/json' };
  if (key.startsWith('ey')) headers.Authorization = `Bearer ${key}`; // legacy JWT service_role key
  try {
    const res = await fetch(`${url}/realtime/v1/api/broadcast`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messages: slots.map((s) => ({ topic: slotTopic(s.turfId, s.date), event: SLOTS_CHANGED, payload: { at: Date.now() } })),
      }),
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) console.warn(`[realtime] broadcast failed: ${res.status} ${await res.text().catch(() => '')}`);
  } catch (err) {
    console.warn('[realtime] broadcast failed', err);
  }
}
