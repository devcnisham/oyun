import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import { SITE_CITY, SITE_DESCRIPTION } from '@/lib/site';
import { SPORTS } from '@/lib/sports';
import { getSettings } from '@/lib/queries';
import { organizationSchema, websiteSchema } from '@/lib/schema';
import { localeAlternates, ogBase } from '@/lib/seo';
import { IconArrow } from '../_ui/icons';
import { BROWSE_URL } from '../_ui/links';
import SiteFooter from '../_ui/SiteFooter';
import SiteHeader from '../_ui/SiteHeader';
import Countdown from './Countdown';
import styles from './page.module.css';

// Before launch this page is the home page: www rewrites / to it, so it carries the home page's title, canonical and schema
export const metadata: Metadata = {
  title: 'Book Football, Box Cricket, Badminton & Pickleball Turfs in Mangalore',
  description: SITE_DESCRIPTION,
  alternates: { canonical: '/', languages: localeAlternates() },
  openGraph: { ...ogBase('/'), title: 'OYUN | Book Sports Turfs & Courts in Mangalore Online', description: `OYUN launches in ${SITE_CITY} on 31 October 2026. Count down to the day you can book turfs and courts.` },
};

export default async function CountdownPage() {
  const { supportEmail, supportPhone } = await getSettings();
  // Repeated so the ticker loops without a visible jump
  const ticker = [...SPORTS, ...SPORTS, ...SPORTS, ...SPORTS];
  return (
    <div className={styles.shell}>
      <JsonLd data={[organizationSchema(supportEmail, supportPhone), websiteSchema()]} />
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
