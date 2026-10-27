import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/modules/web/frontend/JsonLd';
import { getSettings, listAreas, listPublicTurfs } from '@/modules/web/database/queries';
import { organizationSchema, websiteSchema } from '@/modules/web/lib/schema';
import { localeAlternates, ogBase } from '@/modules/web/lib/seo';
import { SITE_CITY, SITE_DESCRIPTION, areaSlug } from '@/modules/web/lib/site';
import { IconArrow, IconPlus } from '@/modules/web/frontend/launch/_ui/icons';
import { BROWSE_URL } from '@/modules/web/frontend/launch/_ui/links';
import Reveal from '@/modules/web/frontend/launch/_ui/Reveal';
import { isLaunched } from '@/modules/shared/backend/hosts';
import SiteFooter from '@/modules/web/frontend/launch/_ui/SiteFooter';
import SiteHeader from '@/modules/web/frontend/launch/_ui/SiteHeader';
import { display } from './fonts';
import OwnerCalendar from '@/modules/web/frontend/launch/landing/OwnerCalendar';
import SlotBoard from '@/modules/web/frontend/launch/landing/SlotBoard';
import styles from './landing.module.css';

export const metadata: Metadata = {
  title: 'Book Football, Box Cricket, Badminton & Pickleball Venues in Mangalore',
  description: SITE_DESCRIPTION,
  alternates: { canonical: '/', languages: localeAlternates() },
  openGraph: { ...ogBase('/'), title: 'OYUN | Book Sports Venues & Courts in Mangalore Online', description: SITE_DESCRIPTION },
};

const STEPS = [
  { title: 'Pick', text: 'Choose a venue, a day and the hours you want. Open hours are live, so what you see is what is free.' },
  { title: 'Hold', text: 'Your hours are held for 8 minutes while you sign in and confirm, so nobody books them from under you.' },
  { title: 'Play', text: 'Pay a small advance, keep the ticket, and settle the rest at the venue. Cancel from the ticket up to 2 hours before.' },
];

const OWNER_POINTS = [
  'Every court and hour in one calendar',
  'Bookings and check-ins from a single dashboard',
  'Block hours for maintenance or private games',
  'Separate logins for your managers and front desk',
];

const LISTING = [
  { title: 'Write to us', text: 'Send your venue details and a few photos of your own.' },
  { title: 'We review it', text: 'Every venue is checked before it goes live.' },
  { title: 'Get your login', text: 'Once approved you get a partner login with your calendar, bookings and check-in tools.' },
];

const FAQ = [
  { q: 'What is OYUN?', a: `OYUN is a booking platform for sports venues in ${SITE_CITY}. You see open slots, hold the hours you want and get a ticket, instead of calling around.` },
  { q: 'What can I book?', a: 'Football and box cricket venues, plus badminton and pickleball courts. More venues are joining before launch.' },
  { q: 'How does booking work?', a: 'Choose a venue, a day and your hours. They are held for 8 minutes while you sign in and confirm. A small advance is paid when you book and the rest at the venue.' },
  { q: 'Can I cancel?', a: 'Yes, from your ticket, up to 2 hours before the slot starts.' },
  { q: 'I run a venue. How do I get listed?', a: 'Write to us with your venue details. Once we approve it you get a partner login with your calendar, bookings and check-in tools.' },
  { q: 'When does booking open?', a: 'At launch. The countdown page shows the date.' },
];

export default async function LandingPage() {
  const [{ supportEmail, supportPhone }, turfs] = await Promise.all([getSettings(), listPublicTurfs()]);
  const areas = listAreas(turfs).map((a) => ({ name: a, slug: areaSlug(a), count: turfs.filter((t) => t.area === a).length }));
  return (
    <div className={`${display.variable} ${styles.page}`}>
      <JsonLd data={[organizationSchema(supportEmail, supportPhone), websiteSchema()]} />
      <SiteHeader waiting={!isLaunched()} />
      <main id="content">
        {/* hero: the promise and a board you can use */}
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={`${styles.wrap} ${styles.heroGrid}`}>
            <div className={styles.heroCopy}>
              <p className={styles.kicker}>{SITE_CITY}</p>
              <h1 id="hero-title" className={styles.h1}>
                <span className="sr-only">Book football, box cricket, badminton and pickleball venues in {SITE_CITY}. </span>
                <span className={styles.rise} style={{ ['--d' as string]: '0ms' }}>Pick the hour.</span>
                <span className={`${styles.rise} ${styles.h1Accent}`} style={{ ['--d' as string]: '120ms' }}>Play the game.</span>
              </h1>
              <p className={`${styles.lead} ${styles.rise}`} style={{ ['--d' as string]: '240ms' }}>See what is open at football, box cricket, badminton and pickleball venues across the city, hold the hours you want, and walk in with a ticket.</p>
              <div className={`${styles.actions} ${styles.rise}`} style={{ ['--d' as string]: '340ms' }}>
                <a href={BROWSE_URL} className={styles.btn}>Browse &amp; book <IconArrow size={16} /></a>
                <Link href="/countdown" className={styles.btnGhost}>Launching soon</Link>
              </div>
            </div>
            <div className={`${styles.heroBoard} ${styles.rise}`} style={{ ['--d' as string]: '200ms' }}>
              <SlotBoard />
            </div>
          </div>
        </section>

        {/* how it works: three states of the same booking */}
        <section id="how" className={styles.section} aria-labelledby="how-title">
          <div className={styles.wrap}>
            <Reveal>
              <p className={styles.eyebrow}>How it works</p>
              <h2 id="how-title" className={styles.h2}>From open hour to ticket, in three moves.</h2>
            </Reveal>
            <ol className={styles.steps}>
              {STEPS.map((s, i) => (
                <Reveal as="li" key={s.title} delay={i * 100} className={styles.step}>
                  <div className={styles.stepArt} aria-hidden="true">
                    {i === 0 && (
                      <div className={styles.miniSlots}>
                        {['6 PM', '7 PM', '8 PM', '9 PM'].map((t, n) => (
                          <span key={t} className={n === 1 || n === 2 ? styles.miniOn : n === 3 ? styles.miniOff : ''}>{t}</span>
                        ))}
                      </div>
                    )}
                    {i === 1 && (
                      <div className={styles.miniHold}>
                        <svg viewBox="0 0 64 64" width="72" height="72"><circle cx="32" cy="32" r="26" className={styles.miniRingBg} /><circle cx="32" cy="32" r="26" className={styles.miniRingFg} /></svg>
                        <span>8:00</span>
                      </div>
                    )}
                    {i === 2 && (
                      <div className={styles.miniTicket}>
                        <b>7 PM to 9 PM</b>
                        <span>Show this at the venue</span>
                      </div>
                    )}
                  </div>
                  <h3 className={styles.h3}>{s.title}</h3>
                  <p className={styles.body}>{s.text}</p>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* the neighbourhoods, from live venue data */}
        {areas.length > 0 && (
          <section className={`${styles.section} ${styles.areasSection}`} aria-labelledby="where-title">
            <div className={styles.wrap}>
              <Reveal>
                <p className={styles.eyebrow}>Where</p>
                <h2 id="where-title" className={styles.h2}>Venues across {SITE_CITY}.</h2>
              </Reveal>
              <Reveal delay={100}>
                <ul className={styles.areas}>
                  {areas.map((a) => (
                    <li key={a.slug}>
                      <Link href={`/turfs/${a.slug}`} className={styles.area}>
                        <span>{a.name}</span>
                        <span className={styles.areaCount}>{a.count}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </section>
        )}

        {/* owners */}
        <section id="owners" className={styles.owners} aria-labelledby="owners-title">
          <div className={`${styles.wrap} ${styles.ownersGrid}`}>
            <Reveal>
              <p className={styles.eyebrowLight}>For venue owners</p>
              <h2 id="owners-title" className={`${styles.h2} ${styles.h2Light}`}>Fill the quiet hours without the phone tag.</h2>
              <p className={styles.bodyLight}>Players book straight into your calendar, and you run the day from your phone.</p>
              <ul className={styles.rules}>
                {OWNER_POINTS.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              <a href={`mailto:${supportEmail}?subject=List%20my%20venue%20on%20OYUN`} className={styles.btn}>List your venue <IconArrow size={16} /></a>
            </Reveal>
            <Reveal delay={120}>
              <OwnerCalendar />
            </Reveal>
          </div>
          <div className={styles.wrap}>
            <ol className={styles.listing} aria-label="How listing works">
              {LISTING.map((st, n) => (
                <li key={st.title} className={styles.listingItem}>
                  <span className={styles.listingNo} aria-hidden="true">{n + 1}</span>
                  <h3 className={styles.h3Light}>{st.title}</h3>
                  <p className={styles.bodyLight}>{st.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* faq */}
        <section id="faq" className={styles.section} aria-labelledby="faq-title">
          <div className={`${styles.wrap} ${styles.faqGrid}`}>
            <Reveal>
              <p className={styles.eyebrow}>Questions</p>
              <h2 id="faq-title" className={styles.h2}>Good to know.</h2>
              <p className={styles.body}>More guides and rules are in the <a className={styles.link} href="/help">help centre</a>.</p>
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
            <h2 id="close-title" className={styles.closeTitle}>Your hour is waiting.</h2>
            <div className={styles.actions}>
              <a href={BROWSE_URL} className={styles.btnLight}>Browse &amp; book <IconArrow size={16} /></a>
              <Link href="/countdown" className={styles.btnGhostLight}>Launching soon</Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter supportEmail={supportEmail} />
    </div>
  );
}
