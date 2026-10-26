import Image from 'next/image';
import Link from 'next/link';
import type { TurfSummary } from '@/modules/shared/database/types';
import { canOptimize } from '@/modules/shared/backend/images';
import { rupees } from '@/modules/shared/lib/format';
import styles from './BookingHome.module.css';

export default function VenueCard({ turf, eager = false }: { turf: TurfSummary; eager?: boolean }) {
  const photo = turf.images[0];
  return (
    <article className={styles.venue}>
      <Link href={`/arenas/${turf.id}`} className={styles.venueLink} aria-label={`Book ${turf.name}`}>
        <div className={styles.venueImage}>
          {photo ? <Image src={photo} alt={turf.name} fill sizes="(max-width: 600px) 100vw, (max-width: 1050px) 50vw, 25vw" loading={eager ? 'eager' : 'lazy'} unoptimized={!canOptimize(photo)} /> : <span className={styles.photoFallback}>{turf.sports[0] || 'Sports'}<br />{turf.area}</span>}
          <div className={styles.venueBadges}>
            {turf.isFeatured && <span className={styles.featuredBadge}>Featured</span>}
            {turf.reviewCount > 0 && turf.rating > 0 && <span className={styles.rating}><span aria-hidden>★</span> {turf.rating.toFixed(1)}<span className="sr-only"> out of 5 from {turf.reviewCount} reviews</span></span>}
          </div>
          <p className={styles.availability}><span className={turf.availableToday > 0 ? styles.openDot : styles.closedDot} />{turf.availableToday > 0 ? `${turf.availableToday} slots open today` : 'Check upcoming availability'}</p>
        </div>
        <div className={styles.venueBody}>
          <h3>{turf.name}</h3>
          <p className={styles.venueLocation}>{turf.area}, {turf.city}</p>
          <div className={styles.venueBottom}>
            <div><span className={styles.from}>From</span><span className={styles.price}>{rupees(turf.pricePerHour)}<small>/hr</small></span></div>
            <span className={styles.bookButton}>Book now <span aria-hidden>↗</span></span>
          </div>
        </div>
      </Link>
    </article>
  );
}
