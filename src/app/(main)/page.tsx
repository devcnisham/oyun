import { connection } from 'next/server';
import Image from 'next/image';
import Link from 'next/link';
import TurfCard from '@/components/TurfCard';
import TurfSlider from '@/components/TurfSlider';
import { canOptimize } from '@/lib/images';
import { getSiteContent, listPublicTurfs } from '@/lib/queries';
import HeroSearchBar from './HeroSearchBar';
import PopupAd from '@/components/PopupAd';
import styles from './page.module.css';

export default async function Home() {
  await connection(); // live data: render per request
  const site = getSiteContent();
  const turfs = listPublicTurfs();
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

  return (
    <div className={styles.page}>
      <PopupAd promos={site.promos} />
      
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
          {[
            { name: 'Football', image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=600&auto=format&fit=crop', link: '/arenas?sport=Football' },
            { name: 'Box Cricket', image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=600&auto=format&fit=crop', link: '/arenas?sport=Box%20Cricket' },
            { name: 'Badminton', image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=600&auto=format&fit=crop', link: '/arenas?sport=Badminton' },
            { name: 'Padel', image: 'https://images.unsplash.com/photo-1698246473105-df6c1032d667?q=80&w=600&auto=format&fit=crop', link: '/arenas?sport=Padel' },
          ].map((sport, i) => (
            <Link href={sport.link} key={i} className={styles.sportCard}>
              <Image src={sport.image} alt={sport.name} fill className={styles.sportImg} unoptimized sizes="(max-width: 768px) 50vw, 25vw" />
              <div className={styles.sportInfo}>
                <h3 className={styles.sportName}>{sport.name}</h3>
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
                  <Image src={ad.image} alt={ad.brand} fill sizes="600px" className={styles.promoImg} unoptimized />
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
            <div className={styles.featureIcon}>🏷️</div>
            <h3 className={styles.featureTitle}>Best Prices Guaranteed</h3>
            <p className={styles.featureDesc}>Get exclusive discounts up to 60% on our partner turfs across the city.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>✅</div>
            <h3 className={styles.featureTitle}>Verified Quality</h3>
            <p className={styles.featureDesc}>Every turf is inspected and verified by our team for turf quality and lighting.</p>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className={styles.ctaSection}>
        <div className="container">
          <div className={styles.ctaInner}>
            <div className={styles.ctaLeft}>
              <h2>Own a sports facility?</h2>
              <p>Join India&apos;s largest turf network. List your arena for free and start getting more bookings today.</p>
            </div>
            <div className={styles.ctaRight}>
              <Link href="/list-turf" className="btn btn--secondary">List Your Property</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
