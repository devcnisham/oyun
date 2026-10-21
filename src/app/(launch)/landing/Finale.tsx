'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { IconArrow } from '../_ui/icons';
import { APP_URL } from '../_ui/links';
import Magnetic from './Magnetic';
import { usePointerVars } from './motion';
import styles from './sections.module.css';

// Closing scene: a spotlight follows the pointer over giant type, with the OYUN wordmark bleeding off the bottom.
export default function Finale() {
  const ref = useRef<HTMLElement>(null);
  usePointerVars(ref);
  return (
    <section ref={ref} className={styles.finale} aria-labelledby="final-title">
      <div className={styles.spot} aria-hidden="true" />
      <div className={`${styles.wrap} ${styles.finaleInner}`}>
        <h2 id="final-title" className={styles.displayXL}>Book the hour.<br /><span className={styles.redText}>Play the game.</span></h2>
        <div className={styles.finaleCtas}>
          <Magnetic><a href={APP_URL} className={styles.btnRed}>Browse &amp; book <IconArrow /></a></Magnetic>
          <Link href="/countdown" className={styles.btnLine}>See the launch countdown</Link>
        </div>
      </div>
      <p className={styles.bigMark} aria-hidden="true">OYUN</p>
    </section>
  );
}
