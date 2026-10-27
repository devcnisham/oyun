import Image from 'next/image';
import Link from 'next/link';
import type { Offer, SponsorAd, TurfSummary } from '@/modules/shared/database/types';
import { homeDeals } from '@/modules/web/lib/home-deals';
import { canOptimize } from '@/modules/shared/backend/images';
import HomeFeatured from './HomeFeatured';
import VenueCard from './VenueCard';
import DaytimeCard from './DaytimeCard';
import AdPlacement from './AdPlacement';
import AutoSlideRail from './AutoSlideRail';
import CommunityCards from './CommunityCards';
import styles from './BookingHome.module.css';

export default function BookingHome({ turfs, offers, ads }: { turfs: TurfSummary[]; offers: Offer[]; ads: SponsorAd[] }) {
  const featured = turfs.filter(t => t.isFeatured).slice(0, 4);
  const picks = featured.length ? featured : turfs.slice(0, 4);
  const others = turfs.filter(t => !picks.some(p => p.id === t.id)).slice(0, 4);
  const byId = new Map(turfs.map(t => [t.id, t]));
  const deals = homeDeals(offers, new Set(byId.keys())).slice(0, 3);
  return (
    <div className={styles.home} data-booking-home>
      <h1 className="sr-only">Book venues and courts in Mangalore</h1>
      <HomeFeatured turfs={turfs} />

      <AdPlacement id="home-leaderboard" />

      <section className={styles.section} aria-labelledby="deals-title">
        <div className={styles.sectionHead}><div><div className={styles.headingLine}><h2 id="deals-title">Morning and<br className={styles.mobileBreak} /> afternoon deals</h2><span className={styles.offPeak}>Off-peak</span></div></div><Link href="/offers" className={styles.textLink}>All offers </Link></div>
        <AutoSlideRail className={styles.dealGrid} label="Daytime deals">
          {deals.length ? deals.map((offer, i) => <DaytimeCard key={offer.id} turf={byId.get(offer.turfId)!} offer={offer} tone={i} />) : turfs.slice(0, 3).map((turf, i) => <DaytimeCard key={turf.id} turf={turf} tone={i} />)}
        </AutoSlideRail>

      </section>


      {ads.length > 0 && <section className={`${styles.section} ${styles.sponsors}`} aria-labelledby="sponsors-title"><div className={styles.sectionHead}><div><h2 id="sponsors-title">Around the game</h2></div><span className={styles.label}>Sponsored</span></div><div className={styles.sponsorGrid}>{ads.map(ad => <article key={ad.id} className={`${styles.sponsor} ${!ad.image ? styles.sponsorTextOnly : ''}`}>
        {ad.image && <div className={styles.sponsorImage}><Image src={ad.image} alt="" fill sizes="(max-width: 600px) 100vw, 50vw" unoptimized={!canOptimize(ad.image)} /></div>}
        <div><span className={styles.sponsorBrand}>{ad.brand} · Sponsored</span><h3>{ad.title}</h3><p>{ad.subtitle}</p>{(/^(https?:\/\/|\/(?!\/))/.test(ad.link)) && <a href={ad.link} rel="sponsored noopener" className={styles.textLink}>Find out more </a>}</div>
      </article>)}</div></section>}

      <CommunityCards />

      {others.length > 0 && <section className={styles.section} aria-labelledby="more-title"><div className={styles.sectionHead}><div><h2 id="more-title">More places. More play.</h2></div><Link href="/arenas?view=map" className={styles.outlineButton}>Explore the map </Link></div><div className={styles.venueGrid}>{others.map(t => <VenueCard key={t.id} turf={t} />)}</div></section>}
      <section className={styles.owner}><div><h2>Your venue.<br />Their next great game.</h2></div><div><Link href="/list-turf">List your venue </Link></div></section>
    </div>
  );
}
