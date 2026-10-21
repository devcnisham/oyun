'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { IconArrow } from '../_ui/icons';
import { BROWSE_URL } from '../_ui/links';
import { useScrollProgress } from './motion';
import styles from './sections.module.css';

// A full-bleed photograph of a turf in the middle of a lane: the reason OYUN exists. The picture drifts slower than the page.
export default function Lane() {
  const ref = useRef<HTMLElement>(null);
  useScrollProgress(ref, 'through');
  return (
    <section ref={ref} className={styles.lane} aria-labelledby="lane-title">
      <div className={styles.laneImg}>
        <Image src="/turfs/turf_1.jpg" alt="Artificial grass turf lanes ready for a game in Mangalore" fill sizes="100vw" quality={70} className={styles.laneImgEl} />
      </div>
      <div className={`${styles.wrap} ${styles.laneCopy}`}>
        <p className={styles.eyebrow}>Wherever there is room</p>
        <h2 id="lane-title" className={styles.displayXL}>Every lane has<br />a game in it.</h2>
        <a href={BROWSE_URL} className={styles.btnLight}>Browse &amp; book <IconArrow /></a>
      </div>
    </section>
  );
}
