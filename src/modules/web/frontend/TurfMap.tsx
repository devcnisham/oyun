'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { TurfSummary } from '@/modules/shared/database/types';
import { canOptimize } from '@/modules/shared/backend/images';
import styles from './TurfMap.module.css';

export type MapTurf = Pick<TurfSummary, 'id' | 'name' | 'area' | 'pricePerHour' | 'rating' | 'reviewCount' | 'lat' | 'lng'> & { location?: string; images?: string[]; sports?: string[] };

export default function TurfMap({ turfs, single = false }: { turfs: MapTurf[]; single?: boolean }) {
  const [selected, setSelected] = useState(turfs[0]?.id ?? '');
  const [query, setQuery] = useState('');
  const venues = turfs.filter(t => `${t.name} ${t.area} ${t.sports?.join(' ') ?? ''}`.toLowerCase().includes(query.trim().toLowerCase()));
  const venue = venues.find(t => t.id === selected) ?? venues[0];
  const place = venue ? Number.isFinite(venue.lat) && Number.isFinite(venue.lng) ? `${venue.lat},${venue.lng}` : `${venue.name}, ${venue.location ?? venue.area}, Mangalore, India` : 'sports venues Mangalore India';
  const searchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`;
  return <section className={`${styles.map} ${single ? styles.fill : ''}`} aria-label={single ? 'Venue location' : 'Venues on map'}>
    <iframe key={place} className={styles.frame} title={venue ? `Google Maps: ${venue.name}` : 'Google Maps: Mangalore'} src={`https://www.google.com/maps/embed?origin=mfe&pb=!1m3!2m1!1s${encodeURIComponent(place)}!6i${single ? 16 : 14}`} allowFullScreen referrerPolicy="no-referrer-when-downgrade" />
    {!single && <>
      <div className={styles.search}><Link href="/arenas" aria-label="Back to venue list">‹</Link><input aria-label="Search map venues" placeholder="Search venue or area" value={query} onChange={e => setQuery(e.target.value)} /></div>
      <div className={styles.rail} aria-label="Map venues">
        {venues.map(t => <article key={t.id} className={`${styles.venue} ${venue?.id === t.id ? styles.selected : ''}`}>
          <button type="button" className={styles.select} aria-pressed={venue?.id === t.id} onClick={() => setSelected(t.id)} aria-label={`Show ${t.name} on Google Maps`}>
            {t.images?.[0] && <span className={styles.image}><Image src={t.images[0]} alt="" fill sizes="280px" unoptimized={!canOptimize(t.images[0])} /></span>}
            <span className={styles.info}><strong>{t.name}</strong><span>Mangalore</span><b>₹{t.pricePerHour.toLocaleString('en-IN')} <small>/hr</small></b></span>
          </button>
          <Link className={styles.book} href={`/arenas/${t.id}`}>Book now</Link>
        </article>)}
        {!venues.length && <p className={styles.empty}>No matching venues. Try another area.</p>}
      </div>
    </>}
    {single && <a className={styles.external} href={searchUrl} target="_blank" rel="noopener noreferrer">Open in Google Maps</a>}
  </section>;
}
