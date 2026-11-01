import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import BookingLink from '@/modules/web/frontend/launch/_ui/BookingLink';
import { ogBase } from '@/modules/web/lib/seo';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'About OYUN | Play Beyond in Mangalore',
  description: 'OYUN connects players with sports venues in Mangalore. Discover our purpose, explore booking and bring your venue to the platform.',
  alternates: { canonical: '/about' },
  openGraph: ogBase('/about'),
};
const principles = [
  ['More time for the game.', 'Find a venue and check available slots in one place, so planning fits around playing.'],
  ['A space for your sport.', 'Explore football, box cricket, badminton and pickleball venues across Mangalore.'],
  ['Local grounds. Local people.', 'Connect the people looking for a game with the people who make space for it.'],
];
export default function AboutPage() {
  return <div className={styles.page}>
    <header className={styles.hero}><p className={styles.eyebrow}>About OYUN</p><h1>Life happens.<br /><span>Make time for play.</span></h1><div className={styles.heroBottom}><p>We bring players and places together.<br />Starting right here in Mangalore.</p><BookingLink className={styles.button}>Book venue</BookingLink></div></header>
    <figure className={styles.photo}><Image src="/about/team-training.jpg" alt="Football players preparing for a training session on an outdoor pitch" fill priority sizes="(max-width: 760px) 100vw, 1300px" /><figcaption>For the game. For the people you play with.</figcaption></figure>
    <section className={styles.story} aria-labelledby="purpose"><p className={styles.eyebrow}>Why we’re here</p><h2 id="purpose">A good game starts<br />with a place to play.</h2><div><p>There’s a match in the group chat, a free evening on the calendar, and people ready to play. Finding a venue should be the easy part.</p><p>OYUN brings venue discovery and booking together. Explore a space, choose an available time and keep your booking details close.</p><p>For venue owners, it’s a way to reach players and manage online bookings.</p></div></section>
    <section className={styles.principles} aria-labelledby="principles-title"><div className={styles.sectionHead}><p className={styles.eyebrow}>What matters to us</p><h2 id="principles-title">Keep the game<br />at the center.</h2></div><div className={styles.principleList}>{principles.map(([title,text])=><article key={title}><h3>{title}</h3><p>{text}</p></article>)}</div></section>
    <section className={styles.paths} aria-label="Find your place in OYUN"><article><span className={styles.eyebrow}>For players</span><h2>Bring your people.<br />Find your place.</h2><p>Choose a sport, explore venues and plan your next session.</p><BookingLink className={styles.button}>Explore venues</BookingLink></article><article><span className={styles.eyebrow}>For venue owners</span><h2>Your venue.<br />Their next game.</h2><p>Make your space discoverable to players looking to book.</p><Link href="/list-turf" className={styles.lightButton}>List your venue</Link></article></section>
    <section className={styles.closing} aria-labelledby="closing-title"><p className={styles.eyebrow}>OYUN / Mangalore</p><h2 id="closing-title">PLAY BEYOND.</h2><p>See you on the ground.</p></section>
  </div>;
}
