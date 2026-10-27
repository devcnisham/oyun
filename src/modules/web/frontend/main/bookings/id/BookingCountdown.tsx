'use client';

import { useEffect, useState } from 'react';
import styles from './BookingCountdown.module.css';

export default function BookingCountdown({ startsAt, durationMinutes = 60 }: { startsAt: string; durationMinutes?: number }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const start = new Date(startsAt).getTime();
  if (!Number.isFinite(start)) return null;
  const end = start + durationMinutes * 60_000;
  const started = now !== null && now >= start;
  const finished = now !== null && now >= end;
  const seconds = now === null ? null : Math.max(0, Math.ceil(((started ? end : start) - now) / 1000));
  const days = seconds === null ? 0 : Math.floor(seconds / 86400);
  const clock = seconds === null ? '— : — : —' : [Math.floor(seconds / 3600) % 24, Math.floor(seconds / 60) % 60, seconds % 60].map(value => String(value).padStart(2, '0')).join(' : ');
  return <div className={styles.countdown} aria-label={finished ? 'Session ended' : started ? 'Time until session ends' : 'Time until booking starts'}>
    <span>{finished ? 'Session ended' : started ? 'Your session ends in' : 'Your game starts in'}</span>
    {!finished && <strong>{days > 0 ? `${days}d ` : ''}{clock}</strong>}
  </div>;
}
