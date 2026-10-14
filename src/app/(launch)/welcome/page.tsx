import type { Metadata } from 'next';
import { SITE_CITY } from '@/lib/site';
import { SPORTS } from '@/lib/sports';
import { getSettings } from '@/lib/queries';
import LaunchHeader from '../LaunchHeader';
import Countdown from './Countdown';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Launching soon',
  description: `OYUN launches in ${SITE_CITY} on 17 October 2026. Everything will be revealed at launch.`,
  alternates: { canonical: '/welcome' },
};

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
      </section>

      <div className={styles.tickerWrap} id="sports" aria-hidden="true">
        <div className={styles.ticker}>
          {ticker.map((s, i) => (
            <span key={i} className={styles.tickItem}>{s.label}<i className={styles.slash}>/</i></span>
          ))}
        </div>
      </div>

      <p className={styles.foot}>
        Everything will be revealed at launch. Questions? <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
      </p>
    </main>
  );
}
