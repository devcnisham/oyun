import type { Metadata } from 'next';
import Link from 'next/link';
import { ogBase } from '@/modules/web/lib/seo';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'About OYUN | Play Beyond in Mangalore',
  description: 'OYUN helps players discover and book venues and courts in Mangalore, and gives venue owners a way to manage online bookings.',
  alternates: { canonical: '/about' },
  openGraph: ogBase('/about'),
};

export default function AboutPage() {
  return <div className={styles.page}>
    <header className={styles.hero}><span>ABOUT OYUN</span><h1>More time playing.<br />Less time planning.</h1><p>OYUN is a venue and court booking platform built for Mangalore.</p><Link href="/arenas">Find a place to play</Link></header>
    <section className={styles.story} aria-labelledby="purpose"><h2 id="purpose">A place for your game.</h2><div><p>Finding a place to play should take a minute, not a round of phone calls. OYUN brings venue discovery and slot booking together, so you can plan your game in one place.</p><p>For venue owners, it’s a way to help players find their venue and book online.</p></div></section>
    <section className={styles.steps} aria-label="How OYUN works">{[
      ['Discover', 'Explore venues and courts by sport. Find a place that fits your game.'],
      ['Book', 'Choose a date, check available slots and review the booking details.'],
      ['Play', 'Keep your booking confirmation handy and head to the venue.'],
    ].map(([title, text]) => <article key={title}><h2>{title}</h2><p>{text}</p></article>)}</section>
    <section className={styles.owner}><div><h2>Behind a great place to play?</h2><p>Bring your venue to OYUN.</p></div><Link href="/list-turf">List your venue</Link></section>
  </div>;
}
