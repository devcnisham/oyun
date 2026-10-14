import Image from 'next/image';
import Link from 'next/link';
import { rupees } from '@/lib/format';
import { canOptimize } from '@/lib/images';
import type { PromoCard, TurfSummary } from '@/lib/types';
import CouponCard from './CouponCard';
import NextGame from './NextGame';
import SportRail, { type RailTurf } from './SportRail';
import styles from './MobileHome.module.css';

interface Props {
  turfs: TurfSummary[];
  promos: PromoCard[];
  coupons: { code: string; title: string; note: string }[];
  deals: { id: string; turfId: string; turfName: string; image: string; title: string; percentOff: number; when: string }[];
}

const TOP_RATED_SHOWN = 3;

// The phone version of the home page: an app-style feed instead of the desktop landing page
export default function MobileHome({ turfs, promos, coupons, deals }: Props) {
  // Only what the rail needs, since it runs in the browser
  const railTurfs: RailTurf[] = turfs.map((t) => ({ id: t.id, name: t.name, area: t.area, pricePerHour: t.pricePerHour, image: t.images[0], availableToday: t.availableToday, sports: t.sports }));
  const topRated = [...turfs].sort((a, b) => b.rating - a.rating).slice(0, TOP_RATED_SHOWN);

  return (
    <div className={styles.home}>
      <header className={styles.head}>
        <NextGame />
        <h2 className={styles.title}>What do you want to play?</h2>
      </header>

      <SportRail turfs={railTurfs} />

      {promos.length > 0 && (
        <section className={styles.promos} tabIndex={0} aria-label="Featured">
          {promos.map((p, i) => (
            <div key={p.id} className={styles.promo}>
              {/* The first card is the biggest thing above the fold: fetch it early and keep it out of lazy loading */}
              <Image src={p.image} alt={p.title} fill sizes="85vw" preload={i === 0} loading={i === 0 ? 'eager' : undefined} fetchPriority={i === 0 ? 'high' : undefined} unoptimized={!canOptimize(p.image)} />
              <div>
                <b>{p.title}</b>
                <span>{p.subtitle}</span>
              </div>
            </div>
          ))}
        </section>
      )}

      {(coupons.length > 0 || deals.length > 0) && (
        <section id="deals" className={styles.anchor}>
          <div className={styles.sectionHead}>
            <h2>Deals for you</h2>
            <span className={styles.muted}>Tap a code to copy</span>
          </div>
          <div className={styles.rail}>
            {coupons.map((c) => (
              <CouponCard key={c.code} {...c} />
            ))}
            {deals.map((d) => (
              <Link key={d.id} href={`/arenas/${d.turfId}`} className={styles.deal}>
                <span className={styles.dealOff}>-{d.percentOff}%</span>
                <b>{d.title}</b>
                <span>{d.turfName}</span>
                <small>{d.when}</small>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className={styles.sectionHead}>
          <h2>{topRated.some((t) => t.reviewCount > 0) ? 'Top rated near you' : 'Popular turfs'}</h2>
          <Link href="/arenas">See all</Link>
        </div>
        <div className={styles.list}>
          {topRated.map((t, i) => (
            <Link key={t.id} href={`/arenas/${t.id}`} className={styles.row}>
              <div className={styles.rowImg}>
                <Image src={t.images[0]} alt={`${t.name} turf in ${t.area}`} fill sizes="96px" unoptimized={!canOptimize(t.images[0])} />
                {t.reviewCount > 0 && <span className={styles.rank}>#{i + 1}</span>}
              </div>
              <div className={styles.rowInfo}>
                <b>{t.name}</b>
                <span>{t.area} · {t.size}</span>
                <span className={styles.rowMeta}>
                  {t.reviewCount > 0 ? <em>★ {t.rating}</em> : <em>New</em>}
                  <strong>{rupees(t.pricePerHour)}<small>/hr</small></strong>
                </span>
              </div>
            </Link>
          ))}
        </div>
        <Link href="/arenas" className={styles.seeAll}>See all {turfs.length} turfs</Link>
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
