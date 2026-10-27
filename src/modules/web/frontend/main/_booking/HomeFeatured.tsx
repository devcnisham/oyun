'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { TurfSummary } from '@/modules/shared/database/types';
import { sportHref } from '@/modules/web/lib/sports';
import BookingDiscovery from './BookingDiscovery';
import VenueCard from './VenueCard';
import LiveSlots from './LiveSlots';
import AutoSlideRail from './AutoSlideRail';
import UpcomingGame from './UpcomingGame';
import styles from './BookingHome.module.css';

export default function HomeFeatured({ turfs }: { turfs: TurfSummary[] }) {
  const [sport, setSport] = useState('');
  const matching = sport ? turfs.filter(t => t.sports.some(s => s.toLowerCase() === sport.toLowerCase())) : turfs;
  const featured = matching.filter(t => t.isFeatured);
  const picks = (featured.length ? featured : matching).slice(0, 4);
  return <>
    <BookingDiscovery selectedSport={sport} onSelectSport={value => setSport(current => current === value ? '' : value)}><LiveSlots turfs={matching} /><UpcomingGame /></BookingDiscovery>
    <section className={styles.section} aria-labelledby="featured-title">
      <div className={styles.sectionHead}><div className={styles.headingLine}><h2 id="featured-title">{sport ? `${sport} ${featured.length ? 'featured venues' : 'venues & courts'}` : featured.length ? 'Featured venues' : 'Explore venues'}</h2>{!sport && <span className={styles.label}>Find your favourite</span>}</div><Link href={sport ? sportHref(sport) : '/arenas'} className={styles.outlineButton}>See all venues</Link></div>
      <p className="sr-only" role="status">{picks.length} {sport || 'all sports'} venues shown</p>
      {picks.length ? <AutoSlideRail className={styles.venueGrid} label="Featured venues">{picks.map((t, i) => <VenueCard key={t.id} turf={t} eager={i < 4} />)}</AutoSlideRail> : <div className={styles.empty}>{sport ? `No ${sport.toLowerCase()} venues are available right now.` : 'New venues are on the way.'} <button type="button" className={styles.resetSport} onClick={() => setSport('')}>Show all sports</button></div>}
    </section>
  </>;
}
