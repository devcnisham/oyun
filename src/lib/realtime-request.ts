// Builds the Supabase Realtime broadcast REST call. Pure (no imports) so it can be unit-tested.

export type BroadcastMessage = { topic: string; event: string; payload: Record<string, unknown> };

export function broadcastRequest(supabaseUrl: string, secretKey: string, messages: BroadcastMessage[]) {
  const headers: Record<string, string> = { apikey: secretKey, 'Content-Type': 'application/json' };
  if (secretKey.startsWith('ey')) headers.Authorization = `Bearer ${secretKey}`; // legacy JWT service_role key
  return {
    url: `${supabaseUrl.replace(/\/+$/, '')}/realtime/v1/api/broadcast`,
    init: { method: 'POST', headers, body: JSON.stringify({ messages }) },
  };
}

// Topic the health check broadcasts on. No browser subscribes to it, so the probe never touches a slot map.
export const PROBE_TOPIC = 'health:realtime-probe';
