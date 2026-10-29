import HeaderBack from '@/modules/web/frontend/HeaderBack';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ogBase } from '@/modules/web/lib/seo';
import styles from './landing.module.css';

const description = 'Discover sports venues in Mangalore, choose an available slot and keep your booking ticket with OYUN.';
export const metadata: Metadata = {
  title: 'Play beyond.', description,
  alternates: { canonical: '/landing' },
  openGraph: { ...ogBase('/landing'), title: 'Play beyond. | OYUN', description },
};
const steps = [
  ['Find your ground.', 'Explore football, box cricket, badminton and pickleball venues in Mangalore.'],
  ['Make it your time.', 'Choose your date, pitch and available hours. Review your booking before you confirm.'],
  ['Show up. Play.', 'Keep your confirmed ticket in My bookings and show your QR at the venue.'],
];
export default function LandingPage() {
  return <div className={styles.page}>
    <header className={styles.header}><HeaderBack /><nav aria-label="Landing navigation"><Link href="/about">About</Link><Link href="/list-turf">For owners</Link><Link href="/arenas" className={styles.button}>Book a venue</Link></nav></header>
    <main id="content">
      <section className={styles.hero}>
        <div className={styles.heroCopy}><p className={styles.eyebrow}>Mangalore / Sports / Your people</p><h1>Less planning.<br />More <em>playing.</em></h1><p className={styles.lead}>Find a place. Pick a time.<br />Bring your game.</p><div className={styles.actions}><Link className={styles.button} href="/arenas">Find a venue</Link><Link className={styles.textLink} href="/?guide=1">New here? Start here</Link></div><span className={styles.signature}>PLAY BEYOND.</span></div>
        <div className={styles.heroImage}><Image src="/turfs/turf_1.jpg" alt="A floodlit football venue ready for a game" fill priority sizes="(max-width: 760px) 100vw, 50vw" /><span className={styles.photoLabel}>Your next game starts here.</span><div className={styles.pitch} aria-hidden="true"><span /></div></div>
      </section>
      <section className={styles.how} aria-labelledby="how-title"><div className={styles.sectionHead}><p className={styles.eyebrow}>From finding to playing</p><h2 id="how-title">Three steps.<br />One good game.</h2></div><div className={styles.steps}>{steps.map(([title, text], i) => <article key={title}><span className={styles.number}>0{i + 1}</span><h3>{title}</h3><p>{text}</p></article>)}</div></section>
      <section className={styles.closing}><p className={styles.eyebrow}>OYUN</p><h2>The group chat<br />has a game plan.</h2><Link href="/arenas" className={styles.lightButton}>Explore venues</Link></section>
    </main><footer className={styles.footer}><Link href="/">OYUN / PLAY BEYOND.</Link><div><Link href="/help">Help</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div></footer>
  </div>;
}
