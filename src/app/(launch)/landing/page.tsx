import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getSettings } from '@/lib/queries';
import { SITE_CITY, SITE_DESCRIPTION } from '@/lib/site';
import { IconArrow, IconPlus } from '../_ui/icons';
import { APP_URL } from '../_ui/links';
import Reveal from '../_ui/Reveal';
import SiteFooter from '../_ui/SiteFooter';
import SiteHeader from '../_ui/SiteHeader';
import { serif } from './fonts';
import styles from './landing.module.css';

export const metadata: Metadata = {
  title: 'Turf and court booking in Mangalore',
  description: SITE_DESCRIPTION,
  alternates: { canonical: '/' },
};

const PRINCIPLES = [
  { title: 'See what is open', text: 'Live availability for every venue, hour by hour. No calls, no waiting for a reply.' },
  { title: 'Hold, then confirm', text: 'Your hours are held for 8 minutes while you check out, so nobody books them from under you.' },
  { title: 'Change your mind', text: 'Cancel from your ticket up to 2 hours before the slot starts.' },
];

const OWNER_POINTS = [
  'Every court and hour in one calendar',
  'Bookings and check-ins from a single dashboard',
  'Block hours for maintenance or private games',
  'Separate logins for your managers and front desk',
];

const FAQ = [
  { q: 'What is OYUN?', a: `OYUN is a booking platform for sports venues in ${SITE_CITY}. You see open slots, hold the hours you want and get a ticket, instead of calling around.` },
  { q: 'What can I book?', a: 'Football and box cricket turfs, plus badminton and pickleball courts. More venues are joining before launch.' },
  { q: 'How does booking work?', a: 'Choose a venue, a day and your hours. They are held for 8 minutes while you sign in and confirm. A small advance is paid when you book and the rest at the venue.' },
  { q: 'Can I cancel?', a: 'Yes, from your ticket, up to 2 hours before the slot starts.' },
  { q: 'I run a venue. How do I get listed?', a: 'Write to us with your venue details. Once we approve it you get a partner login with your calendar, bookings and check-in tools.' },
  { q: 'When does booking open?', a: 'At launch. The countdown page shows the date.' },
];

export default async function LandingPage() {
  const { supportEmail } = await getSettings();
  return (
    <div className={`${serif.variable} ${styles.page}`}>
      <SiteHeader />
      <main id="content">
        {/* hero: one photograph, one sentence, two actions */}
        <section className={styles.hero} aria-labelledby="hero-title">
          <Image src="/turfs/turf_0.jpg" alt="" fill priority sizes="100vw" quality={70} className={styles.heroImg} />
          <div className={styles.heroShade} aria-hidden="true" />
          <div className={`${styles.wrap} ${styles.heroInner}`}>
            <p className={styles.kicker}>{SITE_CITY}</p>
            <h1 id="hero-title" className={styles.h1}>
              Book your game<br />in <em>a minute.</em>
            </h1>
            <p className={styles.lead}>See what is open at venues across the city, hold the hours you want, and walk in with a ticket.</p>
            <div className={styles.actions}>
              <a href={APP_URL} className={styles.btn}>Browse &amp; book <IconArrow size={16} /></a>
              <Link href="/countdown" className={styles.btnGhost}>Launch countdown</Link>
            </div>
          </div>
        </section>

        {/* what it does: three plain statements */}
        <section id="how" className={styles.section} aria-labelledby="how-title">
          <div className={styles.wrap}>
            <Reveal>
              <h2 id="how-title" className={styles.h2}>Finding a place to play should not take a round of phone calls.</h2>
            </Reveal>
            <ol className={styles.principles}>
              {PRINCIPLES.map((p, i) => (
                <Reveal as="li" key={p.title} delay={i * 90} className={styles.principle}>
                  <h3 className={styles.h3}>{p.title}</h3>
                  <p className={styles.body}>{p.text}</p>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* a quiet photographic break */}
        <section className={styles.band} aria-label="Neighbourhood turf">
          <Image src="/turfs/turf_1.jpg" alt="Players on a turf between buildings in a city lane" fill sizes="100vw" quality={72} className={styles.bandImg} />
          <div className={styles.bandShade} aria-hidden="true" />
          <div className={`${styles.wrap} ${styles.bandInner}`}>
            <Reveal>
              <p className={styles.quote}>Every neighbourhood has room for a game.</p>
            </Reveal>
          </div>
        </section>

        {/* owners */}
        <section id="owners" className={`${styles.section} ${styles.split}`} aria-labelledby="owners-title">
          <div className={`${styles.wrap} ${styles.splitGrid}`}>
            <Reveal>
              <p className={styles.kicker}>For venue owners</p>
              <h2 id="owners-title" className={styles.h2}>Fill the quiet hours without the phone tag.</h2>
              <p className={styles.body}>Players book straight into your calendar, and you run the day from your phone.</p>
              <ul className={styles.rules}>
                {OWNER_POINTS.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              <a href={`mailto:${supportEmail}?subject=List%20my%20venue%20on%20OYUN`} className={styles.btn}>List your venue <IconArrow size={16} /></a>
            </Reveal>
            <Reveal delay={120}>
              <div className={styles.photo}>
                <Image src="/turfs/turf_2.jpg" alt="A match under floodlights" fill sizes="(max-width: 900px) 100vw, 560px" quality={70} className={styles.photoImg} />
              </div>
            </Reveal>
          </div>
        </section>

        {/* faq */}
        <section id="faq" className={`${styles.section} ${styles.paper}`} aria-labelledby="faq-title">
          <div className={`${styles.wrap} ${styles.faqGrid}`}>
            <Reveal>
              <p className={styles.kickerDark}>Questions</p>
              <h2 id="faq-title" className={`${styles.h2} ${styles.h2Dark}`}>Good to know.</h2>
              <p className={styles.bodyDark}>More guides and rules are in the <a className={styles.link} href="https://help.oyun.co.in/help">help centre</a>.</p>
            </Reveal>
            <div className={styles.faqList}>
              {FAQ.map((f, i) => (
                <details key={f.q} className={styles.faqItem} {...(i === 0 ? { open: true } : {})}>
                  <summary className={styles.faqQ}>
                    <span>{f.q}</span>
                    <span className={styles.faqIcon}><IconPlus size={18} /></span>
                  </summary>
                  <p className={styles.faqA}>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* close */}
        <section className={styles.closing} aria-labelledby="close-title">
          <div className={styles.wrap}>
            <Reveal>
              <h2 id="close-title" className={styles.h2Big}>Ready when <em>you are.</em></h2>
              <div className={styles.actions}>
                <a href={APP_URL} className={styles.btn}>Browse &amp; book <IconArrow size={16} /></a>
                <Link href="/countdown" className={styles.btnGhost}>Launch countdown</Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <SiteFooter supportEmail={supportEmail} />
    </div>
  );
}
