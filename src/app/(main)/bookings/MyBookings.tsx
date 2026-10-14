'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getBookingSummaries, type BookingSummary } from '@/lib/booking-actions';
import { addMyBookingIds, getMyBookingIds } from '@/lib/client/device';
import { canOptimize } from '@/lib/images';
import styles from './MyBookings.module.css';
import { halfNote } from '@/lib/pricing';

const STATUS: Record<BookingSummary['status'], string> = {
  confirmed: 'Confirmed',
  checked_in: 'Played',
  no_show: 'No-show',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

function todayIst() {
  return new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
}

function prettyDate(date: string) {
  return new Date(`${date}T00:00:00+05:30`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });
}

export default function MyBookings({ newIds }: { newIds: string[] }) {
  const [bookings, setBookings] = useState<BookingSummary[] | null>(null);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    if (newIds.length) addMyBookingIds(newIds);
    getBookingSummaries(getMyBookingIds())
      .then(setBookings)
      .catch(() => setBookings([]));
  }, [newIds]);

  const today = todayIst();
  const upcoming = (bookings ?? []).filter((b) => b.date >= today && b.status === 'confirmed');
  const past = (bookings ?? []).filter((b) => !upcoming.includes(b)).reverse();
  const shown = tab === 'upcoming' ? upcoming : past;

  return (
    <div className={`container ${styles.page}`}>
      <h1 className={styles.title}>My bookings</h1>

      {newIds.length > 0 && (
        <div className={styles.banner} role="status">
          🎉 {newIds.length} slot{newIds.length === 1 ? '' : 's'} booked! Show the QR code at the turf to check in.
        </div>
      )}

      <div className={styles.tabs} role="tablist">
        <button role="tab" aria-selected={tab === 'upcoming'} className={tab === 'upcoming' ? styles.tabOn : ''} onClick={() => setTab('upcoming')}>
          Upcoming {upcoming.length > 0 && <span>{upcoming.length}</span>}
        </button>
        <button role="tab" aria-selected={tab === 'past'} className={tab === 'past' ? styles.tabOn : ''} onClick={() => setTab('past')}>
          Past
        </button>
      </div>

      {bookings === null ? (
        <div className={styles.list}>
          {[0, 1].map((i) => <div key={i} className={styles.skeleton} />)}
        </div>
      ) : shown.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>⚽</div>
          <h2>{tab === 'upcoming' ? 'No upcoming games' : 'Nothing here yet'}</h2>
          <p>Bookings you make on this device or your account show up here.</p>
          <Link href="/arenas" className={styles.cta}>Book a turf</Link>
        </div>
      ) : (
        <div className={styles.list}>
          {shown.map((b) => (
            <div key={b.id} className={`${styles.cardWrapper} ${newIds.includes(b.id) ? styles.cardNew : ''}`}>
              <Link href={`/bookings/${b.id}`} className={styles.card}>
                <div className={styles.thumb}>
                  <Image src={b.image} alt="" fill sizes="88px" unoptimized={!canOptimize(b.image)} />
                </div>
                <div className={styles.info}>
                  <b>{b.turfName}</b>
                  <span>{prettyDate(b.date)} · {b.timeLabel}{halfNote(b.pitch)}</span>
                  <span className={styles.meta}>
                    <em className={b.status === 'confirmed' || b.status === 'checked_in' ? styles.ok : styles.off}>{STATUS[b.status]}</em>
                    {b.due > 0 && b.status === 'confirmed' && <> · ₹{b.due} at venue</>}
                    {b.status === 'checked_in' && !b.reviewed && <> · <strong className={styles.rate}>⭐ Rate your game</strong></>}
                  </span>
                </div>
                <span className={styles.chev} aria-hidden>›</span>
              </Link>
              {tab === 'past' && (
                <div className={styles.cardActions}>
                  <Link href={`/arenas/${b.turfId}`} className={styles.bookAgainBtn}>
                    Book again
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
