'use client';

import { useEffect, useState } from 'react';
import styles from './Countdown.module.css';

// 31 October 2026, 12:00 am India time
const LAUNCH_AT = new Date('2026-10-31T00:00:00+05:30').getTime();

const pad = (n: number) => String(n).padStart(2, '0');

function remaining(now: number) {
  const left = Math.max(0, LAUNCH_AT - now);
  const s = Math.floor(left / 1000);
  return {
    done: left === 0,
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

export default function Countdown() {
  // Empty until mounted so the server and browser render the same thing
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const t = now === null ? null : remaining(now);

  if (t?.done) {
    return <p className={styles.live}>We are live today</p>;
  }

  const units = [
    { label: 'Days', value: t ? String(t.days) : '--' },
    { label: 'Hours', value: t ? pad(t.hours) : '--' },
    { label: 'Minutes', value: t ? pad(t.minutes) : '--' },
    { label: 'Seconds', value: t ? pad(t.seconds) : '--' },
  ];

  return (
    <div className={styles.wrap}>
      <p className={styles.date}>Launching 31 October 2026</p>
      <div
        className={styles.grid}
        role="timer"
        aria-label={t ? `${t.days} days, ${t.hours} hours and ${t.minutes} minutes to launch` : 'Countdown to launch'}
      >
        {units.map((u) => (
          <div key={u.label} className={styles.unit}>
            <span key={u.value} className={styles.value}>{u.value}</span>
            <span className={styles.label}>{u.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
