import type { Metadata } from 'next';
import { SITE_CITY } from '@/lib/site';
import { SPORTS } from '@/lib/sports';
import { getSettings } from '@/lib/queries';
import BookButton from '../BookButton';
import LaunchHeader from '../LaunchHeader';
import Countdown from './Countdown';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Launching soon',
  description: `OYUN launches in ${SITE_CITY} on 31 October 2026. Everything will be revealed at launch.`,
  alternates: { canonical: '/welcome' },
};

const steps = [
  { n: '01', title: 'Discover', desc: 'See turfs and courts near you with live open slots and clear prices.' },
  { n: '02', title: 'Book', desc: 'Pick your hours, hold the slot and confirm in a few taps. No phone calls.' },
  { n: '03', title: 'Play', desc: 'Show up with your ticket and enjoy the game.' },
];

const audiences = [
  {
    title: 'For players',
    points: ['Live availability, so you never call to ask what is free', 'Book one hour or several in one go', 'Your ticket and booking history in one place', 'Football, box cricket, badminton and pickleball'],
  },
  {
    title: 'For turf owners',
    points: ['A simple calendar of every court and hour', 'Bookings and check-ins in one dashboard', 'Block hours for maintenance or private games', 'Fill quiet hours and see what earns the most'],
  },
];

export default async function WelcomePage() {
  const { supportEmail } = await getSettings();
  // Repeated so the ticker loops without a visible jump
  const ticker = [...SPORTS, ...SPORTS, ...SPORTS, ...SPORTS];
  return (
    <main className={styles.page} id="top">
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.orbs} aria-hidden="true">
        {Array.from({ length: 7 }).map((_, i) => (
          <span key={i} className={styles.orb} style={{ '--n': i } as React.CSSProperties} />
        ))}
      </div>
      <LaunchHeader />


      <section className={styles.center}>
        <h1 className={styles.title} aria-label="Launching soon">
          <span className={styles.line} aria-hidden="true">
            {'Launching'.split('').map((ch, i) => (
              <span key={i} className={styles.letter} style={{ '--i': i } as React.CSSProperties}>{ch}</span>
            ))}
          </span>
          <span className={`${styles.line} ${styles.red}`} aria-hidden="true">
            {'soon'.split('').map((ch, i) => (
              <span key={i} className={styles.letter} style={{ '--i': i + 9 } as React.CSSProperties}>{ch}</span>
            ))}
          </span>
        </h1>
        <Countdown />
        <BookButton className={styles.bookCta} closedClassName={styles.bookCtaClosed} />
      </section>

      <div className={styles.tickerWrap} id="sports" aria-hidden="true">
        <div className={styles.ticker}>
          {ticker.map((s, i) => (
            <span key={i} className={styles.tickItem}>{s.label}<i className={styles.slash}>/</i></span>
          ))}
        </div>
      </div>

      <section className={styles.about} aria-labelledby="what-is-oyun">
        <p className={styles.eyebrow}>About OYUN</p>
        <h2 id="what-is-oyun" className={styles.h2}>Finding a place to play should take a minute.</h2>
        <p className={styles.lead}>
          OYUN is a turf and court booking platform built for {SITE_CITY}. Players see what is free and book it. Turf owners get a
          simple way to fill their hours.
        </p>

        <ol className={styles.steps}>
          {steps.map((st) => (
            <li key={st.n} className={styles.step}>
              <span className={styles.stepNo} aria-hidden="true">{st.n}</span>
              <strong>{st.title}</strong>
              <span>{st.desc}</span>
            </li>
          ))}
        </ol>

        <div className={styles.cards}>
          {audiences.map((a) => (
            <div key={a.title} className={styles.card}>
              <h3>{a.title}</h3>
              <ul>
                {a.points.map((pt) => (
                  <li key={pt}>{pt}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className={styles.owners}>
          <h3>Run a turf in {SITE_CITY}?</h3>
          <p>We are onboarding venues before launch. Write to us and we will get you listed.</p>
          <a className={styles.cta} href={`mailto:${supportEmail}?subject=List%20my%20turf%20on%20OYUN`}>List your turf</a>
        </div>
      </section>

      <p className={styles.foot}>
        Launching 31 October 2026. Questions? <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
      </p>
    </main>
  );
}
