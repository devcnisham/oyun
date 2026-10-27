import type { Metadata } from 'next';
import BackButton from '@/modules/web/frontend/BackButton';
import { getTournaments } from '@/modules/web/lib/tournaments';
import TournamentsClient from '@/modules/web/frontend/main/tournaments/TournamentsClient';
import styles from '../faq/page.module.css';

export const metadata: Metadata = {
  title: 'Venue Tournaments & Leagues | Mangalore Sports Competitions',
  description: 'Upcoming venue football, box cricket, and badminton tournaments in Mangalore. View prize pools, formats, and register your team.',
  alternates: { canonical: '/tournaments' },
};

export default async function TournamentsPage() {
  const tournaments = await getTournaments();

  return (
    <div className={styles.pageContainer}>
      <div className={styles.content}>
        <BackButton />
        <h1 className={styles.title}>Venue Tournaments & Leagues</h1>
        <p className={styles.subtitle}>
          Compete against the best teams across Mangalore. Browse verified tournaments, prize pools, and register your squad in seconds.
        </p>

        <TournamentsClient tournaments={tournaments} />
      </div>
    </div>
  );
}
