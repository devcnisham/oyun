'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBookingSummaries, type BookingSummary } from '@/modules/web/backend/booking-actions';
import { getMyBookingIds } from '@/modules/web/frontend/hooks/device';
import { slotTimestamp } from '@/modules/shared/lib/time';
import styles from './LiveSlots.module.css';

export default function UpcomingGame() {
  const [next, setNext] = useState<BookingSummary | null>(null);
  useEffect(() => { let active = true; getBookingSummaries(getMyBookingIds()).then(items => { const upcoming = items.filter(b => b.status === 'confirmed' && Date.parse(slotTimestamp(b.date, b.hour)) > Date.now()).sort((a,b) => Date.parse(slotTimestamp(a.date,a.hour))-Date.parse(slotTimestamp(b.date,b.hour)))[0]; if (active) setNext(upcoming ?? null); }).catch(() => {}); return () => { active = false; }; }, []);
  if (!next) return null;
  return <Link href={`/bookings/${next.id}`} className={styles.next}><span>Next game</span><strong>{next.timeLabel}</strong><small>{next.turfName} · {new Date(`${next.date}T00:00:00+05:30`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })}</small></Link>;
}
