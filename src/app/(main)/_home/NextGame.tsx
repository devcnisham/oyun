'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBookingSummaries, type BookingSummary } from '@/lib/booking-actions';
import { getMyBookingIds, getProfile } from '@/lib/client/device';
import styles from './MobileHome.module.css';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

// Greeting plus the player's next game, from bookings saved on this device
export default function NextGame() {
  const [hello, setHello] = useState('Hello');
  const [next, setNext] = useState<BookingSummary | null>(null);

  useEffect(() => {
    const name = getProfile().name.split(' ')[0];
    queueMicrotask(() => setHello(`${greeting()}${name ? `, ${name}` : ''} 👋`));
    const ids = getMyBookingIds();
    if (ids.length === 0) return;
    const today = new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
    getBookingSummaries(ids)
      .then((list) => setNext(list.find((b) => b.status === 'confirmed' && b.date >= today) ?? null))
      .catch(() => {});
  }, []);

  return (
    <>
      <p className={styles.hello}>{hello}</p>
      {next && (
        <Link href={`/bookings/${next.id}`} className={styles.next}>
          <div>
            <small>Your next game</small>
            <b>{next.turfName}</b>
            <span>
              {new Date(`${next.date}T00:00:00+05:30`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })} · {next.timeLabel}
            </span>
          </div>
          <span className={styles.nextCta}>View ticket</span>
        </Link>
      )}
    </>
  );
}
