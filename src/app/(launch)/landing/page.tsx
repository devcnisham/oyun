import Footer from '@/modules/web/frontend/Footer';
import { getDb } from '@/modules/shared/database/store';
import { listPublicTurfs } from '@/modules/web/database/queries';
import { homeDeals } from '@/modules/web/lib/home-deals';
import { shortHour } from '@/modules/shared/lib/format';
import { getSettings } from '@/modules/web/database/queries';
import BookingLink from '@/modules/web/frontend/launch/_ui/BookingLink';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ogBase } from '@/modules/web/lib/seo';
import styles from './landing.module.css';

export const revalidate = 60;

const description = 'Find and book sports venues in Mangalore with OYUN. Choose your sport, explore available slots, or list your venue.';
export const metadata: Metadata = {
  title: 'Play beyond. | Sports venue booking in Mangalore', description,
  alternates: { canonical: '/' },
  openGraph: { ...ogBase('/'), title: 'Play beyond. | OYUN', description },
};
const steps = [
  ['Find your venue', 'Football, box cricket, badminton or pickleball. Find a space for your game.'],
  ['Pick your time', 'Explore available dates and slots. Choose the session that works for you.'],
  ['Get ready to play', 'Keep your booking ticket handy and bring your people.'],
];
const sports = ['Football', 'Box cricket', 'Badminton', 'Pickleball'];
export default async function LandingPage() {
  const [settings, turfs, db] = await Promise.all([getSettings(), listPublicTurfs(), getDb()]);
  const venues = new Map(turfs.map(venue => [venue.id, venue]));
  const deals = homeDeals(db.offers, new Set(venues.keys())).slice(0, 3);
  return <div className={styles.page}>
    <header className={styles.header}>
      <Link href="/" className={styles.brand} aria-label="OYUN home"><Image src="/oyun-icon.svg" width={36} height={36} alt="" /><span>OYUN</span></Link>
      <nav aria-label="Landing navigation"><Link href="/about">About us</Link><Link href="/list-turf">List your venue</Link><BookingLink className={styles.button}>Book venue</BookingLink></nav>
    </header>
    <main id="main">
      <section className={styles.hero} aria-labelledby="landing-title">
        <Image src="/landing/night-football.jpg" alt="An aerial view of a floodlit football pitch at night" fill priority sizes="100vw" className={styles.heroPhoto} />
        <div className={styles.heroContent}><p className={styles.eyebrow}>Sports. Spaces. Your people.</p><h1 id="landing-title">PLAY<br /><em>BEYOND.</em></h1><p className={styles.lead}>Less time planning.<br />More time on the ground.</p><div className={styles.actions}><BookingLink className={styles.lightButton}>Book venue</BookingLink><Link href="/list-turf" className={styles.outlineButton}>List your venue</Link></div></div>
        <div className={styles.heroFoot}><span>Mangalore, India</span><span>A place for your next game.</span></div>
      </section>
      <section className={styles.intro} aria-labelledby="intro-title"><p className={styles.eyebrow}>Make room for play</p><h2 id="intro-title">The game starts<br />with a <span>place.</span></h2><div><p>A weekday match. A weekend rally. A game with friends. Find your space to play with OYUN.</p><BookingLink className={styles.textLink}>Explore venues</BookingLink></div></section>
      <section className={styles.offers} aria-labelledby="landing-offers-title"><div className={styles.offersHead}><div><p className={styles.eyebrow}>More play, better value</p><h2 id="landing-offers-title">Deals worth playing for.</h2></div><Link href="/offers" className={styles.textLink}>View all offers</Link></div>
        {deals.length > 0 ? <div className={styles.offerGrid}>{deals.map(offer => <article key={offer.id}><span className={styles.offerBadge}>{offer.percentOff}% off</span><p>{offer.period}</p><h3>{venues.get(offer.turfId)!.name}</h3><span className={styles.offerHours}>{shortHour(offer.startHour)} – {shortHour(offer.endHour)}</span><Link href={`/arenas/${offer.turfId}`}>View eligible slots</Link></article>)}</div> : <div className={styles.offersEmpty}><div><h3>Your next game is waiting.</h3><p>No daytime discounts are active right now. Explore venues and find an available slot.</p></div><BookingLink className={styles.button}>Explore venues</BookingLink></div>}
      </section>
      <div className={styles.sports} aria-label="Sports on OYUN">{sports.map(sport => <span key={sport}>{sport}</span>)}</div>
      <section className={styles.how} aria-labelledby="how-title"><div className={styles.sectionHead}><p className={styles.eyebrow}>From browsing to playing</p><h2 id="how-title">Your game.<br />Your way.</h2></div><div className={styles.steps}>{steps.map(([title, text], i) => <article key={title}><span className={styles.number}>0{i + 1}</span><h3>{title}</h3><p>{text}</p></article>)}</div></section>
      <section className={styles.owner} aria-labelledby="owner-title"><div className={styles.ownerImage}><Image src="/landing/court-aerial.jpg" alt="An overhead view of a blue outdoor sports court" fill sizes="(max-width: 760px) 100vw, 45vw" /></div><div className={styles.ownerCopy}><p className={styles.eyebrow}>For venue owners</p><h2 id="owner-title">Your ground.<br />Their next game.</h2><p>Bring your venue to OYUN. Help players discover your space and book their next session.</p><Link href="/list-turf" className={styles.lightButton}>List your venue</Link></div></section>
    </main>
    <Footer supportEmail={settings.supportEmail} />
  </div>;
}
