import Image from 'next/image';
import Link from 'next/link';
import { canOptimize } from '@/lib/images';
import type { PromoCard, TurfSummary } from '@/lib/types';
import NextGame from './NextGame';
import styles from './MobileHome.module.css';

interface Props {
  turfs: TurfSummary[];
  areas: { area: string; count: number }[];
  promos: PromoCard[];
}

// The phone version of the home page: an app-style feed instead of the desktop landing page
export default function MobileHome({ turfs, areas, promos }: Props) {
  const openNow = [...turfs].filter((t) => t.availableToday > 0).sort((a, b) => b.availableToday - a.availableToday).slice(0, 8);
  const topRated = [...turfs].sort((a, b) => b.rating - a.rating);

  return (
    <div className={styles.home}>
      <header className={styles.head}>
        <NextGame />
        <h2 className={styles.title}>Where do you want to play today?</h2>
        <form action="/arenas" className={styles.search} role="search">
          <span aria-hidden>🔍</span>
          <input name="q" placeholder="Search turfs or areas" aria-label="Search turfs or areas" enterKeyHint="search" />
        </form>
        <div className={styles.chips}>
          <Link href="/arenas" className={styles.chip}>All turfs</Link>
          {areas.map(({ area }) => (
            <Link key={area} href={`/arenas?area=${encodeURIComponent(area)}`} className={styles.chip}>{area}</Link>
          ))}
        </div>
      </header>

      {openNow.length > 0 && (
        <section>
          <div className={styles.sectionHead}>
            <h2>Open slots today</h2>
            <Link href="/arenas?sort=availability">See all</Link>
          </div>
          <div className={styles.rail}>
            {openNow.map((t) => (
              <Link key={t.id} href={`/arenas/${t.id}`} className={styles.railCard}>
                <div className={styles.railImg}>
                  <Image src={t.images[0]} alt={`${t.name} turf in ${t.area}`} fill sizes="220px" unoptimized={!canOptimize(t.images[0])} />
                  <span className={styles.badge}>{t.availableToday} slots left</span>
                </div>
                <b>{t.name}</b>
                <span>{t.area} · ₹{t.pricePerHour.toLocaleString('en-IN')}/hr</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {promos.length > 0 && (
        <section className={styles.promos} tabIndex={0} aria-label="Offers">
          {promos.map((p) => (
            <div key={p.id} className={styles.promo}>
              <Image src={p.image} alt={p.title} fill sizes="85vw" unoptimized={!canOptimize(p.image)} />
              <div>
                <b>{p.title}</b>
                <span>{p.subtitle}</span>
              </div>
            </div>
          ))}
        </section>
      )}

      <section>
        <div className={styles.sectionHead}>
          <h2>Top rated near you</h2>
          <Link href="/arenas">Explore</Link>
        </div>
        <div className={styles.list}>
          {topRated.map((t) => (
            <Link key={t.id} href={`/arenas/${t.id}`} className={styles.row}>
              <div className={styles.rowImg}>
                <Image src={t.images[0]} alt={`${t.name} turf in ${t.area}`} fill sizes="96px" unoptimized={!canOptimize(t.images[0])} />
              </div>
              <div className={styles.rowInfo}>
                <b>{t.name}</b>
                <span>{t.area} · {t.size}</span>
                <span className={styles.rowMeta}>
                  {t.reviewCount > 0 ? <em>★ {t.rating}</em> : <em>New</em>}
                  <strong>₹{t.pricePerHour.toLocaleString('en-IN')}<small>/hr</small></strong>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <Link href="/list-turf" className={styles.ownerCta}>
        <span>💼</span>
        <div>
          <b>Own a turf?</b>
          <small>List it free and get bookings</small>
        </div>
        <i aria-hidden>›</i>
      </Link>
    </div>
  );
}
