import type { Metadata } from 'next';
import Link from 'next/link';
import { listPublicTurfs } from '@/lib/queries';
import { SITE_CITY } from '@/lib/site';
import { SPORTS, sportSlug } from '@/lib/sports';
import styles from '../hub.module.css';

export const metadata: Metadata = {
  title: `Sports in ${SITE_CITY} | Football, Box Cricket, Badminton, Pickleball`,
  description: `Every sport you can book on OYUN in ${SITE_CITY}: football, box cricket, badminton and pickleball. Pick a sport to see its venues and open slots.`,
  alternates: { canonical: '/sports' },
};

export const revalidate = 60;

export default async function SportsIndexPage() {
  const turfs = await listPublicTurfs();
  // Padel is no longer offered anywhere on the site
  const games = SPORTS.filter((s) => s.value !== 'Padel');
  return (
    <div className={`container ${styles.page}`}>
      <nav className={styles.crumbs} aria-label="Breadcrumb"><Link href="/">Home</Link> / <span>Sports</span></nav>
      <h1 className={styles.title}>Sports in {SITE_CITY}</h1>
      <p className={styles.lead}>Choose a sport to see the venues that offer it, their prices and today&apos;s open slots.</p>
      <ul className={styles.cards} style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {games.map((s) => {
          const count = turfs.filter((t) => t.sports.includes(s.value)).length;
          return (
            <li key={s.value}>
              <Link href={`/sports/${sportSlug(s.value)}`} className={styles.card}>
                <span className={styles.cardTitle}>{s.label}</span>
                <span className={styles.cardText}>{s.place === 'court' ? 'Courts' : 'Turfs'} across the city, booked by the hour.</span>
                <span className={styles.cardMeta}>{count > 0 ? `${count} venue${count === 1 ? '' : 's'}` : 'Venues joining soon'}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
