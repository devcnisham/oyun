'use client';

import { useRef } from 'react';
import { IconArrow } from '../_ui/icons';
import { usePointerVars, useScrollProgress } from './motion';
import styles from './sections.module.css';

const POINTS = [
  'Every court and hour in one calendar',
  'Bookings and check-ins from one dashboard',
  'Block hours for maintenance or private games',
  'See which hours earn the most and which stay quiet',
  'Give managers and front-desk staff their own logins',
];

const FILLED = new Set([1, 2, 4, 5, 8, 9, 10, 12, 15, 16, 18, 19, 22, 23, 24, 26, 29, 30, 31, 33, 36, 37, 38, 40]);

export default function Owners({ supportEmail }: { supportEmail: string }) {
  const ref = useRef<HTMLElement>(null);
  const device = useRef<HTMLDivElement>(null);
  useScrollProgress(ref, 'through');
  usePointerVars(device);
  return (
    <section id="owners" ref={ref} className={`${styles.section} ${styles.ink}`} aria-labelledby="owners-title">
      <div className={`${styles.wrap} ${styles.ownersGrid}`}>
        <div>
          <p className={styles.eyebrow}>For turf owners</p>
          <h2 id="owners-title" className={styles.display}>Fill the quiet hours.<br /><span className={styles.redText}>Skip the phone tag.</span></h2>
          <p className={styles.lede}>Players book straight into your calendar. You see every court and hour in one view, and run the day from your phone.</p>
          <ul className={styles.ownerRules}>
            {POINTS.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <a href={`mailto:${supportEmail}?subject=List%20my%20turf%20on%20OYUN`} className={styles.btnRed}>List your turf <IconArrow /></a>
        </div>

        <div ref={device} className={styles.deviceWrap} aria-hidden="true">
          <div className={styles.device}>
            <div className={styles.deviceBar}><i /><i /><i /><span>Partner calendar · this week</span></div>
            <div className={styles.cal}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <span key={i} className={styles.calDay}>{d}</span>
              ))}
              {Array.from({ length: 42 }).map((_, i) => (
                <span key={i} className={`${styles.calCell} ${FILLED.has(i) ? styles.calOn : ''}`} style={{ '--i': i } as React.CSSProperties} />
              ))}
            </div>
            <p className={styles.calNote}>Illustration of the partner calendar</p>
          </div>
          <div className={styles.deviceShadow} />
        </div>
      </div>
    </section>
  );
}
