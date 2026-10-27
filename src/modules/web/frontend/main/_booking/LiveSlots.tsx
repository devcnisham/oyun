'use client';

import { useEffect, useState } from 'react';
import { getSlotsForDate } from '@/modules/web/backend/booking-actions';
import { istNow } from '@/modules/shared/lib/time';
import type { TurfSummary } from '@/modules/shared/database/types';
import styles from './LiveSlots.module.css';

type Snapshot = { key: string; count: number; error: boolean };

export default function LiveSlots({ turfs }: { turfs: TurfSummary[] }) {
  const key = turfs.map(t => t.id).join('|');
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  useEffect(() => {
    let active = true;
    let pending = false;
    const refresh = async (initial = false) => {
      if (pending || (!initial && document.visibilityState === 'hidden')) return;
      pending = true;
      const date = istNow().date;
      const ids = key ? key.split('|') : [];
      const results = await Promise.allSettled(ids.map(id => getSlotsForDate(id, date)));
      if (active) setSnapshot({ key, count: results.reduce((total, result) => total + (result.status === 'fulfilled' ? result.value.filter(slot => slot.available).length : 0), 0), error: results.some(result => result.status === 'rejected') });
      pending = false;
    };
    void refresh(true);
    const timer = window.setInterval(() => void refresh(), 30_000);
    const visible = () => { if (document.visibilityState === 'visible') void refresh(); };
    document.addEventListener('visibilitychange', visible);
    return () => { active = false; window.clearInterval(timer); document.removeEventListener('visibilitychange', visible); };
  }, [key]);
  const ready = snapshot?.key === key;
  return <section className={styles.banner} aria-label="Live slot availability">
    <p className={styles.eyebrow}>TODAY ON OYUN</p>
    <div role="status" aria-live="polite">{!ready ? <p className={styles.loading}>Checking open slots…</p> : snapshot.error ? <p className={styles.loading}>Check venues for live availability</p> : <p className={styles.total}><strong>{snapshot.count}</strong> open slots</p>}</div>
    <p className={styles.caption}>Your next game starts here.</p>
  </section>;
}
