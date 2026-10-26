import Image from 'next/image';
import Link from 'next/link';
import type { Offer, SponsorAd, TurfSummary } from '@/modules/shared/database/types';
import { homeDeals } from '@/modules/web/lib/home-deals';
import { shortHour } from '@/modules/shared/lib/format';
import { canOptimize } from '@/modules/shared/backend/images';
import { SITE_CITY } from '@/modules/web/lib/site';
import { SPORTS, sportHref } from '@/modules/web/lib/sports';
import BookingSearch from './BookingSearch';
import VenueCard from './VenueCard';
import styles from './BookingHome.module.css';

export default function BookingHome({ turfs, offers, ads }: { turfs: TurfSummary[]; offers: Offer[]; ads: SponsorAd[] }) {
  const featured = turfs.filter(t => t.isFeatured).slice(0, 4);
  const picks = featured.length ? featured : turfs.slice(0, 4);
  const others = turfs.filter(t => !picks.some(p => p.id === t.id)).slice(0, 4);
  const byId = new Map(turfs.map(t => [t.id, t]));
  const deals = homeDeals(offers, new Set(byId.keys())).slice(0, 3);
  return (
    <div className={styles.home} data-booking-home>
      <section className={styles.hero} aria-labelledby="home-title">
        <div className={styles.heroTop}>
          <p className={styles.eyebrow}><span /> GOOD TIMES START ON THE TURF</p>
          <span className={styles.city}>⌖ {SITE_CITY}, India</span>
        </div>
        <div className={styles.heroMain}>
          <h1 id="home-title">Find your<br /><em>next game.</em><span className={styles.titleStar} aria-hidden>✳</span></h1>
          <div className={styles.heroAside}>
            <div className={styles.courtMark} aria-hidden><span /><i /><b /></div>
            <p>Your people. Your favourite sport.<br />A place to make it happen.</p>
            <Link href="/arenas">Find your space to play <span aria-hidden>↗</span></Link>
          </div>
        </div>
        <BookingSearch />
        <nav className={styles.sports} aria-label="Browse by sport">
          <span>Pick your game</span>
          {SPORTS.slice(0, 4).map((sport, i) => <Link href={sportHref(sport.value)} key={sport.value}><span className={styles.sportIcon} aria-hidden>{['◉', '⌁', '◇', '⊕'][i]}</span>{sport.label}<span className={styles.sportArrow} aria-hidden>↗</span></Link>)}
        </nav>
      </section>

      <section className={styles.section} aria-labelledby="featured-title">
        <div className={styles.sectionHead}><div><div className={styles.headingLine}><h2 id="featured-title">{featured.length ? 'Featured turfs' : 'Explore turfs'}</h2><span className={styles.label}>Find your favourite</span></div><p>Good grounds. Great games. Right here in {SITE_CITY}.</p></div><Link href="/arenas" className={styles.outlineButton}>See all turfs <span aria-hidden>↗</span></Link></div>
        {picks.length ? <div className={styles.venueGrid}>{picks.map((t, i) => <VenueCard key={t.id} turf={t} eager={i < 4} />)}</div> : <div className={styles.empty}>New venues are on the way. <Link href="/arenas">Explore available sports</Link></div>}
      </section>

      <section className={styles.section} aria-labelledby="deals-title">
        <div className={styles.sectionHead}><div><div className={styles.headingLine}><h2 id="deals-title">Morning and<br className={styles.mobileBreak} /> afternoon deals</h2><span className={styles.offPeak}>Off-peak</span></div><p>{deals.length ? 'Book quieter hours and pay less.' : 'Find time for a game before the evening rush.'}</p></div><Link href="/offers" className={styles.textLink}>All offers <span aria-hidden>↗</span></Link></div>
        {deals.length ? <div className={styles.dealGrid}>{deals.map((deal, i) => {
          const turf = byId.get(deal.turfId)!;
          return <article key={deal.id} className={`${styles.deal} ${styles[`dealTone${i % 3}`]}`}>
            <div className={styles.dealTop}><span>{deal.period}</span><b>{deal.percentOff}% off</b></div>
            <h3>{turf.name}</h3><p>{turf.area}</p>
            <div className={styles.dealBottom}><div><span>{shortHour(deal.startHour)} – {shortHour(deal.endHour)}</span><strong>{deal.title}</strong><small>On eligible slots · final price at checkout</small></div><Link href={`/arenas/${turf.id}`} aria-label={`Book ${turf.name} ${deal.period.toLowerCase()} deal`}>Book <span aria-hidden>↗</span></Link></div>
          </article>;
        })}</div> : <div className={styles.noDeals}><div><span className={styles.sun} aria-hidden>☀</span><h3>Make time for a daytime game.</h3><p>No morning or afternoon discounts are live right now.<br />You can still find a slot that fits your day.</p></div><div className={styles.dayLinks}><Link href="/arenas?time=morning">Morning slots <span>5 AM – 12 PM ↗</span></Link><Link href="/arenas?time=afternoon">Afternoon slots <span>12 PM – 5 PM ↗</span></Link></div></div>}
      </section>

      {ads.length > 0 && <section className={`${styles.section} ${styles.sponsors}`} aria-labelledby="sponsors-title"><div className={styles.sectionHead}><div><h2 id="sponsors-title">Around the game</h2><p>From our sponsors</p></div><span className={styles.label}>Sponsored</span></div><div className={styles.sponsorGrid}>{ads.map(ad => <article key={ad.id} className={`${styles.sponsor} ${!ad.image ? styles.sponsorTextOnly : ''}`}>
        {ad.image && <div className={styles.sponsorImage}><Image src={ad.image} alt="" fill sizes="(max-width: 600px) 100vw, 50vw" unoptimized={!canOptimize(ad.image)} /></div>}
        <div><span className={styles.sponsorBrand}>{ad.brand} · Sponsored</span><h3>{ad.title}</h3><p>{ad.subtitle}</p>{(/^(https?:\/\/|\/(?!\/))/.test(ad.link)) && <a href={ad.link} rel="sponsored noopener" className={styles.textLink}>Find out more <span aria-hidden>↗</span></a>}</div>
      </article>)}</div></section>}

      {others.length > 0 && <section className={styles.section} aria-labelledby="more-title"><div className={styles.sectionHead}><div><h2 id="more-title">More places. More play.</h2><p>Find a new favourite around the corner.</p></div><Link href="/arenas?view=map" className={styles.outlineButton}>Explore the map <span aria-hidden>↗</span></Link></div><div className={styles.venueGrid}>{others.map(t => <VenueCard key={t.id} turf={t} />)}</div></section>}
      <section className={styles.owner}><div><span>FOR THE PEOPLE BEHIND THE PITCH</span><h2>Your turf.<br />Their next great game.</h2></div><div><p>Bring your venue to OYUN.<br />Let players find you and book online.</p><Link href="/list-turf">List your turf <span aria-hidden>↗</span></Link></div></section>
    </div>
  );
}
