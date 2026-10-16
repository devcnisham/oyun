import type { Metadata } from 'next';
import { SITE_DESCRIPTION } from '@/lib/site';
import JsonLd from '@/components/JsonLd';
import { organizationSchema, websiteSchema } from '@/lib/schema';
import { connection } from 'next/server';
import { headers } from 'next/headers';
import Image from 'next/image';
import Link from 'next/link';
import TurfSlider from '@/components/TurfSlider';
import { getSettings, getSiteContent, listPublicTurfs } from '@/lib/queries';
import { shortHour } from '@/lib/format';
import { homeStats } from '@/lib/home-stats';
import { getDb } from '@/lib/store';
import HeroSearchBar from './HeroSearchBar';
import { SPORTS, sportHref } from '@/lib/sports';
import PopupAd from '@/components/PopupAdLazy';
import MobileHome from './_home/MobileHome';
import HeroScroll from './HeroScroll';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: { absolute: 'OYUN | Book Sports Turfs & Courts in Mangalore Online' },
  description: SITE_DESCRIPTION,
  alternates: { canonical: '/' },
};

export default async function Home() {
  await connection(); // live data: render per request
  // A phone only needs the app feed: skip the desktop landing page so it is not sent, parsed and hydrated for nothing
  const phone = /Mobi|Android|iPhone|iPod/i.test((await headers()).get('user-agent') ?? '');
  const site = await getSiteContent();
  const turfs = await listPublicTurfs();
  const settings = await getSettings();
  const recommended = [...turfs].sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || b.rating - a.rating).slice(0, 10);

  // Phone home feed extras: coupons, turf deals and every area with its turf count
  const db = await getDb();
  const stats = homeStats(db.turfs, db.bookings);
  const coupons = db.promoCodes
    .filter((p) => p.active)
    .map((p) => ({
      code: p.code,
      title: p.kind === 'percent' ? `${p.value}% off` : `₹${p.value} off`,
      note: [p.maxDiscount ? `up to ₹${p.maxDiscount}` : '', p.weekendOnly ? 'weekends only' : 'any day'].filter(Boolean).join(' · '),
    }));
  const turfNames = new Map(turfs.map((t) => [t.id, t]));
  const deals = db.offers
    .filter((o) => o.active && turfNames.has(o.turfId))
    .map((o) => {
      const t = turfNames.get(o.turfId)!;
      return {
        id: o.id,
        turfId: t.id,
        turfName: t.name,
        image: t.images[0],
        title: o.title,
        percentOff: o.percentOff,
        when: o.type === 'first_time' ? 'Your first booking' : `${shortHour(o.startHour)} – ${shortHour(o.endHour)}`,
      };
    });


  return (
    <div className={styles.page}>
      <JsonLd data={[organizationSchema(settings.supportEmail, settings.supportPhone), websiteSchema()]} />
      <PopupAd promos={site.promos} />
      {!phone && (
      <div className={styles.desktopHome}>

      {/* OYO Style Hero Search */}
      <section className={styles.hero}>
        <HeroScroll />
        <div className={styles.videoWrapper}>
          <Image
            src="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=2000&auto=format&fit=crop"
            alt="Soccer ball and boot"
            fill
            preload
            sizes="100vw"
            className={styles.heroVideo}
            style={{ transform: 'scale(1.3)' }}
          />
        </div>
        <div className={styles.heroOverlay}></div>
        
        <div className={`container ${styles.heroContainer}`}>
          <h1 className={styles.heroTitle}>{site.heroTitle}</h1>
          
          <div className={styles.searchWrapper}>
            <HeroSearchBar />
            <Link href="/arenas?view=map" className={styles.mapBtn} aria-label="Map view" title="Map view">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 4 3 6.5v13L9 17l6 3 6-2.5v-13L15 7 9 4z" />
                <path d="M9 4v13M15 7v13" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Stats Banner (Glassmorphism Overlay): real counts only, hidden until there is something to show */}
        {stats.length > 0 && (
          <div className={styles.statsBanner}>
            <div className={`container ${styles.statsContainer}`}>
              {stats.map((s) => (
                <div key={s.key} className={styles.statItem}>
                  <span className={styles.statIcon}>{s.icon}</span>
                  <span><strong>{s.value.toLocaleString('en-IN')}</strong> {s.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
      {/* Browse by Sport */}
      <section className={`container ${styles.section}`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Browse by Sport</h2>
        </div>
        <div className={styles.sportGrid}>
          {SPORTS.map((sport) => (
            <Link href={sportHref(sport.value)} key={sport.value} className={styles.sportCard}>
              <Image src={sport.image} alt={sport.label} fill className={styles.sportImg} sizes="(max-width: 768px) 50vw, 25vw" />
              <div className={styles.sportInfo}>
                <h3 className={styles.sportName}>{sport.label}</h3>
                <div className={styles.sportAction}>Explore venues <span>→</span></div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Turfs Slider */}
      <TurfSlider 
        title="Recommended Turfs in Mangalore" 
        turfs={recommended} 
        viewAllLink="/arenas" 
      />

      {/* Sponsor ad strip: managed in Admin → Customization, hidden while there are no real sponsors */}
      {site.ads.length > 0 && (
        <section className={styles.promoSection} aria-label="Sponsors">
          <div className={styles.marqueeContainer}>
            <div className={styles.marqueeTrack}>
              {/* Rendered twice for a seamless marquee loop */}
              {[0, 1].map((copy) =>
                site.ads.map((ad) => {
                  const card = (
                    <>
                      <Image src={ad.image} alt={copy === 0 ? ad.brand : ''} fill sizes="600px" className={styles.promoImg} />
                      <div className={styles.promoContent}>
                        <div className={styles.adBrand}>{ad.brand} · Sponsored</div>
                        <h2>{ad.title}</h2>
                        <p>{ad.subtitle}</p>
                      </div>
                    </>
                  );
                  const key = `${copy}-${ad.id}`;
                  if (!ad.link) return <div key={key} className={styles.promoCard} aria-hidden={copy === 1}>{card}</div>;
                  const external = !ad.link.startsWith('/');
                  return (
                    <a
                      key={key}
                      href={ad.link}
                      className={styles.promoCard}
                      aria-hidden={copy === 1}
                      tabIndex={copy === 1 ? -1 : undefined}
                      {...(external ? { target: '_blank', rel: 'sponsored noopener noreferrer' } : {})}
                    >
                      {card}
                    </a>
                  );
                })
              )}
            </div>
          </div>
        </section>
      )}

      {/* CTA Footer */}
      <section className={styles.ctaSection}>
        <div className="container">
          <div className={styles.ctaInner}>
            <div className={styles.ctaLeft}>
              <h2>Own a sports facility?</h2>
              <p>List your arena on OYUN for free and start getting online bookings in Mangalore.</p>
            </div>
            <div className={styles.ctaRight}>
              <Link href="/list-turf" className="btn btn--secondary">List Your Property</Link>
            </div>
          </div>
        </div>
      </section>
      </div>
      )}

      <div className={`${styles.mobileHome} ${phone ? styles.mobileForced : ''}`}>
        <MobileHome turfs={turfs} promos={site.promos} coupons={coupons} deals={deals} />
      </div>
    </div>
  );
}
