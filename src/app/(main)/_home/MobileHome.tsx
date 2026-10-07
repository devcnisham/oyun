import Image from 'next/image';
import Link from 'next/link';
import { canOptimize } from '@/lib/images';
import type { PromoCard, TurfSummary } from '@/lib/types';
import CouponCard from './CouponCard';
import NextGame from './NextGame';
import styles from './MobileHome.module.css';

interface Props {
  turfs: TurfSummary[];
  promos: PromoCard[];
  coupons: { code: string; title: string; note: string }[];
  deals: { id: string; turfId: string; turfName: string; image: string; title: string; percentOff: number; when: string }[];
}

const TOP_RATED_SHOWN = 3;

// `value` is what turfs list in their `sports`; it is also the /arenas filter
const SPORTS = [
  { value: 'Football', label: 'Football', icon: '⚽', tint: 'tileRed' },
  { value: 'Box Cricket', label: 'Cricket', icon: '🏏', tint: 'tileAmber' },
  { value: 'Badminton', label: 'Badminton', icon: '🏸', tint: 'tileGreen' },
  { value: 'Padel', label: 'Padel', icon: '🎾', tint: 'tileBlue' },
] as const;

// The phone version of the home page: an app-style feed instead of the desktop landing page
export default function MobileHome({ turfs, promos, coupons, deals }: Props) {
  const openNow = [...turfs].filter((t) => t.availableToday > 0).sort((a, b) => b.availableToday - a.availableToday).slice(0, 8);
  const topRated = [...turfs].sort((a, b) => b.rating - a.rating).slice(0, TOP_RATED_SHOWN);

  return (
    <div className={styles.home}>
      <header className={styles.head}>
        <NextGame />
        <h2 className={styles.title}>What do you want to play?</h2>
      </header>

      <nav className={styles.quick} aria-label="Sports">
        {SPORTS.map((sport) => {
          const count = turfs.filter((t) => t.sports.includes(sport.value)).length;
          return (
            <Link key={sport.value} href={`/arenas?sport=${encodeURIComponent(sport.value)}`} className={`${styles.tile} ${styles[sport.tint]}`}>
              <span aria-hidden>{sport.icon}</span>
              <b>{sport.label}</b>
              <small>{count} turf{count === 1 ? '' : 's'}</small>
            </Link>
          );
        })}
      </nav>

      {openNow.length > 0 && (
        <section>
          <div className={styles.sectionHead}>
            <h2>Open slots today</h2>
            <Link href="/arenas?sort=availability">See all</Link>
          </div>
          <div className={styles.rail}>
            {openNow.map((t, i) => (
              <Link key={t.id} href={`/arenas/${t.id}`} className={styles.railCard}>
                <div className={styles.railImg}>
                  <Image src={t.images[0]} alt={`${t.name} turf in ${t.area}`} fill sizes="220px" loading={i < 2 ? 'eager' : 'lazy'} unoptimized={!canOptimize(t.images[0])} />
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
        <section className={styles.promos} tabIndex={0} aria-label="Featured">
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
                  <strong>₹{t.pricePerHour.toLocaleString('en-IN')}<small>/hr</small></strong>
                </span>
              </div>
            </Link>
          ))}
        </div>
        <Link href="/arenas" className={styles.seeAll}>See all {turfs.length} turfs</Link>
      </section>

      <section className={styles.how}>
        <h2>How OYUN works</h2>
        <ol>
          <li><span aria-hidden>1</span><div><b>Pick your slots</b><small>Choose a date and one or more hours, like cinema seats.</small></div></li>
          <li><span aria-hidden>2</span><div><b>We hold them for 8 minutes</b><small>Nobody else can take them while you pay.</small></div></li>
          <li><span aria-hidden>3</span><div><b>Show your QR, play and pay</b><small>Pay at the turf by cash or UPI. Your ticket is under My games.</small></div></li>
        </ol>
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
