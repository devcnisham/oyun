import type { Metadata } from 'next';
import Link from 'next/link';
import { listLiveOffers } from '@/modules/web/lib/offers-list';
import { listPublicTurfs } from '@/modules/web/database/queries';
import { getDb } from '@/modules/shared/database/store';
import styles from '../hub.module.css';

export const metadata: Metadata = {
  title: 'Offers | Discounts on Turf and Court Bookings in Mangalore',
  description: 'Live OYUN offers: platform discounts, student price, and happy-hour and first-booking deals at individual venues.',
  alternates: { canonical: '/offers' },
};

export default async function OffersPage() {
  const [db, turfs] = await Promise.all([getDb(), listPublicTurfs()]);
  const { platform, turf } = listLiveOffers(db, turfs);
  const none = platform.length === 0 && turf.length === 0;
  return (
    <div className={`container ${styles.page}`}>
      <nav className={styles.crumbs} aria-label="Breadcrumb"><Link href="/">Home</Link> / <span>Offers</span></nav>
      <h1 className={styles.title}>Offers</h1>
      <p className={styles.lead}>What is running right now. The best single offer is applied to your booking at checkout.</p>

      {none && <p className={styles.empty}>No offers are running at the moment. Check back soon, or browse venues to see prices and open slots.</p>}

      {platform.length > 0 && (
        <section>
          <h2 className={styles.h2}>On every venue</h2>
          <div className={styles.list}>
            {platform.map((o) => (
              <div key={o.id} className={styles.row}>
                <span className={styles.rowTitle}>{o.title}</span>
                <span className={styles.rowDetail}>{o.detail}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {turf.length > 0 && (
        <section>
          <h2 className={styles.h2}>At individual venues</h2>
          <div className={styles.list}>
            {turf.map((o) => (
              <div key={o.id} className={styles.row}>
                <span><span className={styles.rowTitle}>{o.title}</span> <span className={styles.rowDetail}>at {o.turfName}</span></span>
                <span className={styles.rowDetail}>{o.detail}</span>
                {o.turfId && <Link href={`/arenas/${o.turfId}`} className={styles.rowLink}>View venue</Link>}
              </div>
            ))}
          </div>
        </section>
      )}

      <div className={styles.actions}>
        <Link href="/arenas" className={styles.cta}>Browse venues</Link>
      </div>
    </div>
  );
}
