'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';
import { IconArrow } from '../_ui/icons';
import { BROWSE_URL } from '../_ui/links';
import styles from './hero.module.css';
import Magnetic from './Magnetic';
import { usePointerVars, useScrollProgress } from './motion';
import PitchLines from './PitchLines';
import SlotBoard from './SlotBoard';

export default function Hero({ city }: { city: string }) {
  const ref = useRef<HTMLElement>(null);
  useScrollProgress(ref, 'leave');
  usePointerVars(ref);

  return (
    <section ref={ref} className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.photo}>
        <Image src="/turfs/turf_2.jpg" alt={`Floodlit football turf in ${city} with open evening slots`} fill sizes="100vw" quality={55} className={styles.photoImg} priority />
      </div>
      <div className={styles.beams} aria-hidden="true"><i /><i /><i /></div>
      <div className={styles.stage} aria-hidden="true">
        <div className={styles.pitch}><PitchLines /></div>
      </div>
      <div className={styles.grain} aria-hidden="true" />

      <div className={styles.inner}>
        <div>
          <p className={styles.eyebrow}>Turf and court booking · {city}</p>
          <h1 id="hero-title" className={styles.h1}>
            <span className="sr-only">Book football, box cricket, badminton and pickleball turfs in {city}. </span>
            <span className={styles.line}><span className={styles.lineIn}>Find the slot.</span></span>
            <span className={styles.line}><span className={`${styles.lineIn} ${styles.red}`}>Own the hour.</span></span>
          </h1>
          <p className={styles.lead}>Live open slots at football, box cricket, badminton and pickleball turfs across {city}. Pick your hours, hold them, and walk in with a ticket. No phone calls.</p>
          <div className={styles.ctas}>
            <Magnetic><a href={BROWSE_URL} className={styles.btn}>Browse &amp; book <IconArrow /></a></Magnetic>
            <Link href="/countdown" className={styles.btnGhost}>See the launch countdown</Link>
          </div>
        </div>
        <div className={styles.boardWrap}>
          <div className={styles.boardTilt}>
            <div className={styles.boardFloat}><SlotBoard /></div>
            <div className={styles.boardShadow} aria-hidden="true" />
          </div>
        </div>
      </div>

      <a href="#sports" className={styles.cue} aria-label="Scroll to sports">
        Scroll
        <span aria-hidden="true" />
      </a>
    </section>
  );
}
