import Link from 'next/link';
import type { Offer, TurfSummary } from '@/modules/shared/database/types';
import { rupees, shortHour } from '@/modules/shared/lib/format';
import styles from './BookingHome.module.css';

export default function DaytimeCard({ turf, offer, tone }: {
  turf: TurfSummary;
  offer?: Offer & { period: string };
  tone: number;
}) {
  return (
    <article data-home-reveal className={`${styles.deal} ${styles[`dealTone${tone % 3}`]}`}>
      <div className={styles.dealTop}><span>{offer?.period ?? 'Morning & afternoon'}</span>{offer ? <b>{offer.percentOff}% off</b> : <b className={styles.regularRate}>Daytime play</b>}</div>
      <h3>{turf.name}</h3><p>{turf.city}</p>
      <div className={styles.dealBottom}>
        <div>
          <span>{offer ? `${shortHour(offer.startHour)} – ${shortHour(offer.endHour)}` : 'View daytime availability'}</span>
          {offer ? <strong>{offer.title}</strong> : <strong className={styles.dealPrice}>From {rupees(turf.pricePerHour)}<small>/hr</small></strong>}
          <small>{offer ? 'On eligible slots · final price at checkout' : 'Regular starting rate'}</small>
        </div>
        <Link href={`/arenas/${turf.id}`} aria-label={`Book ${turf.name} ${offer ? offer.period.toLowerCase() + ' deal' : 'daytime slots'}`}>Book now</Link>
      </div>
    </article>
  );
}
