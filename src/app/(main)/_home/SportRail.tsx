'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { canOptimize } from '@/lib/images';
import { SPORTS, sportHref } from '@/lib/sports';
import styles from './MobileHome.module.css';

export interface RailTurf {
  id: string;
  name: string;
  area: string;
  pricePerHour: number;
  image: string;
  availableToday: number;
  sports: string[];
}

const SHOWN = 8;

// The round sport icons and the "Open slots today" rail under them. Tapping an icon filters the rail
// right here instead of opening another page; tapping it again shows every sport.
export default function SportRail({ turfs }: { turfs: RailTurf[] }) {
  const [sport, setSport] = useState<string | null>(null);
  const chosen = SPORTS.find((s) => s.value === sport);

  const open = turfs
    .filter((t) => t.availableToday > 0 && (!sport || t.sports.includes(sport)))
    .sort((a, b) => b.availableToday - a.availableToday)
    .slice(0, SHOWN);
  const seeAll = sport ? `${sportHref(sport)}&sort=availability` : '/arenas?sort=availability';

  return (
    <>
      <nav className={styles.sports} aria-label="Sports">
        {SPORTS.map((s) => (
          <button
            key={s.value}
            type="button"
            className={`${styles.sportIcon} ${sport === s.value ? styles.sportIconOn : ''}`}
            aria-pressed={sport === s.value}
            onClick={() => setSport(sport === s.value ? null : s.value)}
          >
            <span className={styles.sportIconImg}>
              <Image src={s.image} alt="" fill sizes="88px" />
            </span>
            <b>{s.label}</b>
          </button>
        ))}
      </nav>

      {(open.length > 0 || chosen) && (
        <section aria-live="polite">
          <div className={styles.sectionHead}>
            <h2>{chosen ? `${chosen.label} open today` : 'Open slots today'}</h2>
            <Link href={seeAll}>See all</Link>
          </div>
          {open.length > 0 ? (
            // Remount on a new choice so the rail starts from its first card
            <div className={styles.rail} key={sport ?? 'all'}>
              {open.map((t, i) => (
                <Link key={t.id} href={`/arenas/${t.id}`} className={styles.railCard}>
                  <div className={styles.railImg}>
                    <Image src={t.image} alt={`${t.name} turf in ${t.area}`} fill sizes="220px" loading={i < 2 ? 'eager' : 'lazy'} unoptimized={!canOptimize(t.image)} />
                    <span className={styles.badge}>{t.availableToday} slots left</span>
                  </div>
                  <b>{t.name}</b>
                  <span>{t.area} · ₹{t.pricePerHour.toLocaleString('en-IN')}/hr</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className={styles.railEmpty}>
              No {chosen?.label} venue has a slot left today. <Link href={sportHref(sport!)}>See all {chosen?.label} venues</Link>
            </p>
          )}
        </section>
      )}
    </>
  );
}
