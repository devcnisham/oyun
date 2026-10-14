'use client';

import { useEffect, useRef } from 'react';
import { SLOTS_CHANGED, slotTopic } from '@/lib/slot-topic';

const realtimeConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
// With realtime the poll is only a safety net (expired holds, missed messages), so it can be slower
const POLL_MS = realtimeConfigured ? 10_000 : 5_000;

/*
 * Keeps a slot map live while it is on screen:
 * - instantly, when the server broadcasts that someone held, booked or released a slot on this turf/day;
 * - every few seconds and whenever the tab comes back into view, in case a broadcast is missed
 *   or a hold simply ran out.
 */
export function useSlotUpdates(turfId: string, date: string, onChange: () => void, enabled: boolean) {
  const callback = useRef(onChange);
  useEffect(() => {
    callback.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!enabled) return;
    const fire = () => {
      if (document.visibilityState === 'visible') callback.current();
    };

    const poll = window.setInterval(fire, POLL_MS);
    document.addEventListener('visibilitychange', fire);
    window.addEventListener('focus', fire);

    let cleanupChannel = () => {};
    let cancelled = false;
    if (realtimeConfigured) {
      // The Supabase client is large and only needed once the page is interactive: load it on demand, not with the page bundle
      void import('@/utils/supabase/client')
        .then(({ createClient }) => {
          if (cancelled) return;
          const supabase = createClient();
          const channel = supabase.channel(slotTopic(turfId, date)).on('broadcast', { event: SLOTS_CHANGED }, () => callback.current()).subscribe();
          cleanupChannel = () => void supabase.removeChannel(channel);
        })
        .catch(() => {
          // realtime unavailable: polling keeps things fresh
        });
    }

    return () => {
      window.clearInterval(poll);
      document.removeEventListener('visibilitychange', fire);
      window.removeEventListener('focus', fire);
      cancelled = true;
      cleanupChannel();
    };
  }, [turfId, date, enabled]);
}
