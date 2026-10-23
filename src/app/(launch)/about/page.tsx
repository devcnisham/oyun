import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_CITY } from '@/modules/web/lib/site';
import { getSettings } from '@/modules/web/database/queries';
import { isLaunched } from '@/modules/shared/backend/hosts';
import SiteFooter from '@/modules/web/frontend/launch/_ui/SiteFooter';
import SiteHeader from '@/modules/web/frontend/launch/_ui/SiteHeader';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'About us',
  description: `OYUN is a turf and court booking platform built for ${SITE_CITY}.`,
  alternates: { canonical: '/about' },
};

const pillars = [
  { title: 'Discover', desc: 'Find turfs and courts near you.' },
  { title: 'Book', desc: 'Hold a slot in a few taps.' },
  { title: 'Play', desc: 'Show up and enjoy the game.' },
];

export default async function AboutPage() {
  const { supportEmail } = await getSettings();
  return (
    <div className={styles.page}>
      <SiteHeader current="about" waiting={!isLaunched()} />
      <main id="content" className={styles.main}>
        <p className={styles.eyebrow}>About us</p>
        <h1 className={styles.title}>
          Finding a place to play should take a minute.
        </h1>
        <p className={styles.lead}>
          OYUN is a turf and court booking platform built for {SITE_CITY}.
        </p>
        <p className={styles.text}>
          We want finding a place to play to take a minute, not a round of phone calls. Players see what is free and
          book it. Turf owners get a simple way to fill their hours.
        </p>

        <ul className={styles.pillars}>
          {pillars.map((p, i) => (
            <li key={p.title} className={styles.pillar} style={{ animationDelay: `${0.15 * i}s` }}>
              <strong>{p.title}</strong>
              <span>{p.desc}</span>
            </li>
          ))}
        </ul>

        <Link href="/" className={styles.back}>← Back to home</Link>
      </main>
      <SiteFooter supportEmail={supportEmail} />
    </div>
  );
}
