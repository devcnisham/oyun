'use client';

import Link from 'next/link';
import BackButton from '@/modules/web/frontend/BackButton';
import TurfCard from '@/modules/web/frontend/TurfCard';
import { useFavourites } from '@/modules/web/frontend/hooks/favourites';
import type { TurfSummary } from '@/modules/shared/database/types';
import styles from '@/modules/web/frontend/main/saved/saved.module.css';

export default function SavedTurfs({ turfs }: { turfs: TurfSummary[] }) {
  const { ids } = useFavourites();
  const saved = ids.map((id) => turfs.find((t) => t.id === id)).filter((t): t is TurfSummary => Boolean(t));

  return (
    <div className={`container ${styles.page}`}>
      <BackButton fallback="/profile" />
      <h1 className={styles.title}>Saved venues</h1>
      {saved.length === 0 ? (
        <div className={styles.empty}>
          <div aria-hidden className={styles.icon}>♡</div>
          <h2>No saved venues yet</h2>
          <p>Tap the heart on any venue to save it here for quick booking.</p>
          <Link href="/arenas" className="btn btn--primary">Explore venues</Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {saved.map((t) => <TurfCard key={t.id} turf={t} />)}
        </div>
      )}
    </div>
  );
}
