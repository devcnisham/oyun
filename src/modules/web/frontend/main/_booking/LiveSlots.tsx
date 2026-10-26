'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSlotsForDate } from '@/modules/web/backend/booking-actions';
import { istNow } from '@/modules/shared/lib/time';
import { rupees } from '@/modules/shared/lib/format';
import type { Slot, TurfSummary } from '@/modules/shared/database/types';
import styles from './LiveSlots.module.css';

type Snapshot = { key: string; date: string; venues: { id: string; slots: Slot[] }[]; error: boolean };

export default function LiveSlots({ turfs }: { turfs: TurfSummary[] }) {
  const candidates = [...turfs].sort((a, b) => b.availableToday - a.availableToday).slice(0, 4);
  const key = candidates.map(t => t.id).join('|');
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
      if (active) setSnapshot({ key, date, venues: results.flatMap((result, i) => result.status === 'fulfilled' ? [{ id: ids[i], slots: result.value.filter(slot => slot.available) }] : []), error: results.some(result => result.status === 'rejected') });
      pending = false;
    };
    void refresh(true);
    const timer = window.setInterval(() => void refresh(), 30_000);
    const visible = () => { if (document.visibilityState === 'visible') void refresh(); };
    document.addEventListener('visibilitychange', visible);
    return () => { active = false; window.clearInterval(timer); document.removeEventListener('visibilitychange', visible); };
  }, [key]);
  const loading = snapshot?.key !== key;
  const open = snapshot?.key === key ? snapshot.venues.filter(venue => venue.slots.length > 0) : [];
  return <section className={styles.section} aria-labelledby="live-slots-title">
    <div className={styles.heading}><div><h2 id="live-slots-title">Live slots</h2><p>Available today · refreshed every 30 seconds</p></div><Link href="/arenas">See all turfs</Link></div>
    {loading ? <div className={styles.grid} role="status" aria-label="Checking live availability">{Array.from({ length: 4 }, (_, i) => <div className={styles.skeleton} key={i} aria-hidden="true" />)}</div> : <>
      {snapshot?.error && <p role="status" className={styles.notice}>Some venues could not be refreshed. Check availability on the venue page.</p>}
      {open.length ? <div className={styles.grid}>{open.map(venue => {
        const turf = candidates.find(t => t.id === venue.id)!;
        return <article className={styles.card} key={venue.id}><span className={styles.available}><i aria-hidden="true" />{venue.slots.length} slots available today</span><h3>{turf.name}</h3><p className={styles.city}>Mangalore</p><ul className={styles.times} aria-label={`${turf.name} available times`}>{venue.slots.slice(0, 4).map((slot, index) => <li key={`${slot.hour}-${slot.minute ?? 0}-${index}`}><span>{slot.label}</span><strong>{rupees(slot.price)}</strong></li>)}</ul><Link href={`/arenas/${venue.id}?date=${snapshot!.date}`}>View slots</Link></article>;
      })}</div> : !snapshot?.error && <div className={styles.empty}>No slots are available today for these venues. <Link href="/arenas">Check another day</Link>.</div>}
    </>}
  </section>;
}
