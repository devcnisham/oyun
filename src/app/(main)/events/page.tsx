import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_CITY } from '@/lib/site';
import styles from '../hub.module.css';

export const metadata: Metadata = {
  title: `Events in ${SITE_CITY} | Tournaments and Open Matches`,
  description: `Tournaments to enter and open matches to join across ${SITE_CITY}, from five-a-side football to box cricket and badminton.`,
  alternates: { canonical: '/events' },
};

export const revalidate = 300;

export default function EventsPage() {
  return (
    <div className={`container ${styles.page}`}>
      <nav className={styles.crumbs} aria-label="Breadcrumb"><Link href="/">Home</Link> / <span>Events</span></nav>
      <h1 className={styles.title}>Events</h1>
      <p className={styles.lead}>Play beyond a single booking: enter a tournament with your team, or join a game that is short of players.</p>
      <div className={styles.cards}>
        <Link href="/tournaments" className={styles.card}>
          <span className={styles.cardTitle}>Tournaments</span>
          <span className={styles.cardText}>See upcoming tournaments, their dates and venues, and register your team.</span>
          <span className={styles.cardMeta}>View tournaments</span>
        </Link>
        <Link href="/matches" className={styles.card}>
          <span className={styles.cardTitle}>Open matches</span>
          <span className={styles.cardText}>Find players for a game, or host your own and let others join.</span>
          <span className={styles.cardMeta}>Find a game</span>
        </Link>
      </div>
    </div>
  );
}
