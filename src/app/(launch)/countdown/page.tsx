import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_CITY } from '@/lib/site';
import { SPORTS } from '@/lib/sports';
import { getSettings } from '@/lib/queries';
import { IconArrow } from '../_ui/icons';
import { BROWSE_URL } from '../_ui/links';
import SiteFooter from '../_ui/SiteFooter';
import SiteHeader from '../_ui/SiteHeader';
import Countdown from './Countdown';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Launching soon',
  description: `OYUN launches in ${SITE_CITY} on 31 October 2026. Count down to the day you can book turfs and courts.`,
  alternates: { canonical: '/countdown' },
};

export default async function CountdownPage() {
  const { supportEmail } = await getSettings();
  // Repeated so the ticker loops without a visible jump
  const ticker = [...SPORTS, ...SPORTS, ...SPORTS, ...SPORTS];
  return (
    <div className={styles.shell}>
      <SiteHeader current="countdown" />
      <main id="content" className={styles.page}>
        <div className={styles.glow} aria-hidden="true" />
        <div className={styles.orbs} aria-hidden="true">
          {Array.from({ length: 7 }).map((_, i) => (
            <span key={i} className={styles.orb} style={{ '--n': i } as React.CSSProperties} />
          ))}
        </div>

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
          <div className={styles.actions}>
            <a className={styles.cta} href={BROWSE_URL}>Browse &amp; book <IconArrow /></a>
            <Link className={styles.back} href="/">Back to home</Link>
          </div>
        </section>

        <div className={styles.tickerWrap} aria-hidden="true">
          <div className={styles.ticker}>
            {ticker.map((s, i) => (
              <span key={i} className={styles.tickItem}>{s.label}<i className={styles.slash}>/</i></span>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter supportEmail={supportEmail} />
    </div>
  );
}
