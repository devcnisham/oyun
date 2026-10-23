import 'server-only';
import { PROBE_TOPIC, broadcastRequest, type BroadcastMessage } from '@/modules/shared/backend/realtime-request';
import { SLOTS_CHANGED, slotTopic } from '@/modules/shared/lib/slot-topic';

async function broadcast(messages: BroadcastMessage[]): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key || messages.length === 0) return false;
  const request = broadcastRequest(url, key, messages);
  try {
    const res = await fetch(request.url, { ...request.init, signal: AbortSignal.timeout(3000) });
    if (!res.ok) console.warn(`[realtime] broadcast failed: ${res.status}`);
    return res.ok;
  } catch (err) {
    console.warn('[realtime] broadcast failed', err instanceof Error ? err.name : 'unknown error');
    return false;
  }
}

// Tell every open slot map for these turf/days to refresh, through Supabase Realtime broadcast.
// Best effort: if it fails, browsers still catch up on their next poll.
export async function broadcastSlotChanges(slots: { turfId: string; date: string }[]) {
  await broadcast(slots.map((s) => ({ topic: slotTopic(s.turfId, s.date), event: SLOTS_CHANGED, payload: { at: Date.now() } })));
}

// Health check: can this server actually broadcast? Cached so uptime monitors and admin page loads don't hammer Supabase.
const OK_TTL_MS = 5 * 60 * 1000;
const FAIL_TTL_MS = 60 * 1000;
const probeCache = globalThis as unknown as { __oyunRealtimeProbe?: { ok: boolean; at: number } };

export async function realtimeBroadcastWorks(): Promise<boolean> {
  const cached = probeCache.__oyunRealtimeProbe;
  if (cached && Date.now() - cached.at < (cached.ok ? OK_TTL_MS : FAIL_TTL_MS)) return cached.ok;
  const ok = await broadcast([{ topic: PROBE_TOPIC, event: 'probe', payload: {} }]);
  probeCache.__oyunRealtimeProbe = { ok, at: Date.now() };
  return ok;
}
