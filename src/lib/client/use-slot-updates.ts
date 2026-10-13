'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { SLOTS_CHANGED, slotTopic } from '@/lib/slot-topic';

const realtimeConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
// Fallback poll interval only when Realtime is not configured or unavailable
const FALLBACK_POLL_MS = 5_000;

/*
 * Keeps a slot map live while it is on screen:
 * - instantly, via Supabase Realtime broadcast when someone holds, books or releases a slot;
 * - on tab focus and visibility change to catch up on any missed updates;
 * - fallback interval poll only when Realtime is not configured.
 */
export function useSlotUpdates(turfId: string, date: string, onChange: () => void, enabled: boolean) {
  const callback = useRef(onChange);
  useEffect(() => {
    callback.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!enabled) return;
    const fire = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        callback.current();
      }
    };

    // Refetch whenever the tab comes into view or the window gains focus
    document.addEventListener('visibilitychange', fire);
    window.addEventListener('focus', fire);

    let pollId: number | undefined;
    let cleanupChannel = () => {};

    if (realtimeConfigured) {
      try {
        const supabase = createClient();
        const channel = supabase
          .channel(slotTopic(turfId, date))
          .on('broadcast', { event: SLOTS_CHANGED }, () => callback.current())
          .subscribe();
        cleanupChannel = () => void supabase.removeChannel(channel);
      } catch {
        // If Realtime client fails to initialize, fall back to polling
        pollId = window.setInterval(fire, FALLBACK_POLL_MS);
      }
    } else {
      // Realtime not configured: periodic polling fallback keeps slots fresh
      pollId = window.setInterval(fire, FALLBACK_POLL_MS);
    }

    return () => {
      if (pollId !== undefined) window.clearInterval(pollId);
      document.removeEventListener('visibilitychange', fire);
      window.removeEventListener('focus', fire);
      cleanupChannel();
    };
  }, [turfId, date, enabled]);
}

