import type { ReactNode } from 'react';
import Image from 'next/image';
import { SPORTS } from '@/modules/web/lib/sports';
import AdPlacement from './AdPlacement';
import BookingSearch from './BookingSearch';
import styles from './BookingDiscovery.module.css';

export default function BookingDiscovery({ selectedSport, onSelectSport, children }: { selectedSport: string; onSelectSport: (sport: string) => void; children?: ReactNode }) {
  return <section className={styles.discovery} aria-label="Find a place to play">
    <BookingSearch />
    <div className={styles.discoveryGrid}>
      <div className={styles.sideAd}><AdPlacement id="home-desktop-left" format="card" /></div>
      <div className={styles.discoveryMain}>
    {children}
    <div className={styles.categories} role="group" aria-label="Filter venues by sport">
      {SPORTS.slice(0, 4).map(sport => <button data-home-reveal type="button" key={sport.value} className={styles.category} aria-pressed={selectedSport === sport.value} aria-controls="featured-title" onClick={() => onSelectSport(sport.value)}>
        <span className={styles.photo}><Image src={sport.image} alt="" fill loading="eager" sizes="(max-width: 760px) 25vw, 160px" /></span>
        <span className={styles.name}>{sport.label}</span>
      </button>)}
    </div>
      </div>
      <div className={styles.sideAd}><AdPlacement id="home-desktop-right" format="card" /></div>
    </div>
  </section>;
}
