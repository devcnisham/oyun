import type { Metadata } from 'next';
import { SITE_DESCRIPTION } from '@/lib/site';
import JsonLd from '@/components/JsonLd';
import { organizationSchema, websiteSchema } from '@/lib/schema';
import { connection } from 'next/server';
import Image from 'next/image';
import Link from 'next/link';
import TurfSlider from '@/components/TurfSlider';
import { getSettings, getSiteContent, listPublicTurfs } from '@/lib/queries';
import { getDb } from '@/lib/store';
import HeroSearchBar from './HeroSearchBar';
import { SPORTS, sportHref } from '@/lib/sports';
import PopupAd from '@/components/PopupAd';
import MobileHome from './_home/MobileHome';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: { absolute: 'OYUN | Book Football Turfs in Mangalore Online' },
  description: SITE_DESCRIPTION,
  alternates: { canonical: '/' },
};

export default async function Home() {
  await connection(); // live data: render per request
  const site = await getSiteContent();
  const turfs = await listPublicTurfs();
  const settings = await getSettings();
  const recommended = [...turfs].sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || b.rating - a.rating).slice(0, 10);

  // Top areas by number of listed turfs
  const popularAreas = Object.entries(
    turfs.reduce<Record<string, number>>((acc, t) => {
      acc[t.area] = (acc[t.area] ?? 0) + 1;
      return acc;
    }, {})
  )
    .map(([area, count]) => ({ area, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  // Phone home feed extras: coupons, turf deals and every area with its turf count
  const db = await getDb();
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
      const h = (x: number) => `${x % 12 === 0 ? 12 : x % 12} ${x < 12 || x === 24 ? 'AM' : 'PM'}`;
      return {
        id: o.id,
        turfId: t.id,
        turfName: t.name,
        image: t.images[0],
        title: o.title,
        percentOff: o.percentOff,
        when: o.type === 'first_time' ? 'Your first booking' : `${h(o.startHour)} – ${h(o.endHour)}`,
      };
    });


  return (
    <div className={styles.page}>
      <JsonLd data={[organizationSchema(settings.supportEmail, settings.supportPhone), websiteSchema()]} />
      <PopupAd promos={site.promos} />
      <div className={styles.desktopHome}>

      {/* OYO Style Hero Search */}
      <section className={styles.hero}>
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
            <Link href="/arenas?view=map" className={styles.mapBtn}>
              <span className={styles.filterActionIcon}>🗺️</span>
              <span>Map View</span>
            </Link>
          </div>
        </div>

        {/* Stats Banner (Glassmorphism Overlay) */}
        <div className={styles.statsBanner}>
          <div className={`container ${styles.statsContainer}`}>
            <div className={styles.statItem}>
              <span className={styles.statIcon}>⚽</span>
              <span><strong>100+</strong> turfs listed</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statIcon}>🌍</span>
              <span><strong>5+</strong> cities</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statIcon}>👥</span>
              <span><strong>50k+</strong> players hosted</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statIcon}>⭐</span>
              <span><strong>100k+</strong> bookings made</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statIcon}>🏆</span>
              <span>Since <strong>2024</strong></span>
            </div>
          </div>
        </div>
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

      {/* Promotional Carousel */}
      <section className={styles.promoSection}>
        <div className={styles.marqueeContainer}>
          <div className={styles.marqueeTrack}>
            {/* Rendered twice for a seamless marquee loop */}
            {[0, 1].map((copy) =>
              [
                { id: '1', brand: "Nike", title: "Just Do It.", subtitle: "New Mercurial Vapor 15. Available now.", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2000&auto=format&fit=crop" },
                { id: '2', brand: "Apple", title: "Shot on iPhone 15 Pro", subtitle: "Capture every goal in stunning 4K 60fps.", image: "https://images.unsplash.com/photo-1491933382434-500287f9b54b?q=80&w=2000&auto=format&fit=crop" },
                { id: '3', brand: "Puma", title: "Forever Faster.", subtitle: "Lighter, Faster, Stronger.", image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=2000&auto=format&fit=crop" },
                { id: '4', brand: "Adidas", title: "Predator Accuracy", subtitle: "Miss nothing. Score everything.", image: "https://images.unsplash.com/photo-1518002171953-a080ee817e1f?q=80&w=2000&auto=format&fit=crop" }
              ].map((ad) => (
                <div key={`${copy}-${ad.id}`} className={styles.promoCard} aria-hidden={copy === 1}>
                  <Image src={ad.image} alt={ad.brand} fill sizes="600px" className={styles.promoImg} />
                  <div className={styles.promoContent}>
                    <div className={styles.adBrand}>{ad.brand}</div>
                    <h2>{ad.title}</h2>
                    <p>{ad.subtitle}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Explore By Area (OYO Style Categories) */}
      <section className={styles.bgSection}>
        <div className={`container ${styles.section}`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Explore popular locations</h2>
            <Link href="/arenas" className="btn btn--ghost btn--sm">View All →</Link>
          </div>
          <div className={styles.areaGrid}>
            {popularAreas.map(({ area, count }, i) => (
              <Link href={`/arenas?area=${area}`} key={i} className={styles.areaCard}>
                <div className={styles.areaInfo}>
                  <h3 className={styles.areaName}>{area}</h3>
                  <p className={styles.areaCount}>{count} {count === 1 ? 'Turf' : 'Turfs'} available</p>
                </div>
                <div className={styles.areaIcon}>🏟️</div>
              </Link>
            ))}
          </div>
        </div>
      </section>


      {/* How it Works / Perks (OYO Style Features) */}
      <section className={`container ${styles.section}`}>
        <h2 className={styles.sectionTitle}>Why book with OYUN?</h2>
        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>⚡</div>
            <h3 className={styles.featureTitle}>Instant Booking</h3>
            <p className={styles.featureDesc}>No waiting for confirmations. See real-time availability and book instantly.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>💵</div>
            <h3 className={styles.featureTitle}>Pay at the Turf</h3>
            <p className={styles.featureDesc}>Reserve online in seconds and pay at the venue by cash or UPI: a small advance when you arrive, the rest after you play. Nothing is charged online.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🔒</div>
            <h3 className={styles.featureTitle}>No Double Bookings</h3>
            <p className={styles.featureDesc}>Your slot is locked while you reserve, and everyone sees holds and bookings live.</p>
          </div>
        </div>
      </section>

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

      <div className={styles.mobileHome}>
        <MobileHome turfs={turfs} promos={site.promos} coupons={coupons} deals={deals} />
      </div>
    </div>
  );
}
