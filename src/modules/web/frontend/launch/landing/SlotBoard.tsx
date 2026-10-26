'use client';

import { useEffect, useState } from 'react';
import { IconArrow } from '@/modules/web/frontend/launch/_ui/icons';
import { BROWSE_URL } from '@/modules/web/frontend/launch/_ui/links';
import styles from '@/modules/web/frontend/launch/landing/board.module.css';

const SPORTS = ['Football', 'Box cricket', 'Badminton', 'Pickleball'] as const;
const HOURS = ['4 PM', '5 PM', '6 PM', '7 PM', '8 PM', '9 PM', '10 PM', '11 PM'];
// 1 = already booked. A sample evening for each sport, not real venue data.
const BOOKED: Record<(typeof SPORTS)[number], number[]> = {
  Football: [0, 0, 1, 1, 1, 0, 0, 1],
  'Box cricket': [0, 1, 1, 0, 0, 1, 0, 0],
  Badminton: [1, 0, 0, 0, 1, 1, 0, 0],
  Pickleball: [0, 0, 0, 1, 1, 0, 1, 0],
};
const HOLD_SECONDS = 8 * 60;
const RING = 2 * Math.PI * 26;

type Phase = 'pick' | 'held' | 'expired';

// The product's own object as the hero: an hour board you can actually use. Pick open hours, hold them, watch the
// 8 minute hold run. It is a labelled sample; booking real venues happens on the booking site.
export default function SlotBoard() {
  const [sport, setSport] = useState<(typeof SPORTS)[number]>('Football');
  const [picked, setPicked] = useState<number[]>([]);
  const [phase, setPhase] = useState<Phase>('pick');
  const [left, setLeft] = useState(HOLD_SECONDS);

  useEffect(() => {
    if (phase !== 'held') return;
    const id = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          setPhase('expired');
          setPicked([]);
          return HOLD_SECONDS;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  const pickSport = (s: (typeof SPORTS)[number]) => {
    setSport(s);
    setPicked([]);
    setPhase('pick');
  };
  const toggle = (i: number) => setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));
  const hold = () => {
    setLeft(HOLD_SECONDS);
    setPhase('held');
  };
  const release = () => {
    setPicked([]);
    setPhase('pick');
  };

  const held = phase === 'held';
  const mm = String(Math.floor(left / 60));
  const ss = String(left % 60).padStart(2, '0');

  return (
    <div className={styles.board} aria-label="Sample hour board">
      <div className={styles.top}>
        <p className={styles.title}>Tonight</p>
        <p className={styles.tag}>Sample board</p>
      </div>

      <div className={styles.sports} role="group" aria-label="Sport">
        {SPORTS.map((s) => (
          <button key={s} type="button" className={styles.sport} aria-pressed={s === sport} onClick={() => pickSport(s)} disabled={held}>{s}</button>
        ))}
      </div>

      <ul className={styles.slots}>
        {HOURS.map((h, i) => {
          const booked = BOOKED[sport][i] === 1;
          const on = picked.includes(i);
          return (
            <li key={h}>
              <button
                type="button"
                className={`${styles.slot} ${booked ? styles.booked : ''} ${on ? styles.on : ''}`}
                aria-pressed={on}
                disabled={booked || held}
                onClick={() => toggle(i)}
              >
                <span className={styles.time}>{h}</span>
                <span className={styles.state}>{booked ? 'Booked' : on ? (held ? 'Held' : 'Picked') : 'Open'}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className={styles.foot}>
        {phase === 'pick' && (
          <>
            <p className={styles.hint}>{picked.length === 0 ? 'Pick one or more open hours.' : `${picked.length} hour${picked.length === 1 ? '' : 's'} picked.`}</p>
            <button type="button" className={styles.cta} disabled={picked.length === 0} onClick={hold}>Hold {picked.length > 1 ? 'these hours' : 'this hour'}</button>
          </>
        )}
        {held && (
          <>
            <div className={styles.timer}>
              <svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">
                <circle cx="32" cy="32" r="26" className={styles.ringBg} />
                <circle cx="32" cy="32" r="26" className={styles.ringFg} strokeDasharray={RING} strokeDashoffset={RING * (1 - left / HOLD_SECONDS)} />
              </svg>
              <div>
                <p className={styles.clock}>{mm}:{ss}</p>
                <p className={styles.hint}>Held for you. Confirm before it runs out.</p>
              </div>
            </div>
            <div className={styles.row}>
              <a href={BROWSE_URL} className={styles.cta}>Continue to book <IconArrow size={16} /></a>
              <button type="button" className={styles.link} onClick={release}>Release</button>
            </div>
          </>
        )}
        {phase === 'expired' && (
          <>
            <p className={styles.hint} role="status">The hold ran out and the hours are open again.</p>
            <button type="button" className={styles.cta} onClick={release}>Pick again</button>
          </>
        )}
      </div>
    </div>
  );
}
