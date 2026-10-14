import type { Metadata } from 'next';
import BackButton from '@/components/BackButton';
import { listOpenMatches } from '@/lib/community';
import { listPublicTurfs } from '@/lib/queries';
import MatchesClient from './MatchesClient';
import styles from '../faq/page.module.css';

export const metadata: Metadata = {
  title: 'Open Matches & Player Finder | Join Games in Mangalore',
  description: 'Find local players and open matches for football, box cricket, and badminton across Mangalore turfs and arenas.',
  alternates: { canonical: '/matches' },
};

export default async function MatchesPage() {
  const [matches, turfs] = await Promise.all([listOpenMatches(), listPublicTurfs()]);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.content}>
        <BackButton />
        <h1 className={styles.title}>Find Players & Open Matches</h1>
        <p className={styles.subtitle}>
          Short of players for your turf slot? Or looking to join an active local game in Mangalore?
          Browse open community matches or host your own.
        </p>

        <MatchesClient initialMatches={matches} turfs={turfs} />
      </div>
    </div>
  );
}
