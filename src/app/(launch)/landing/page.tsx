import type { Metadata } from 'next';
import Link from 'next/link';
import { getSettings } from '@/lib/queries';
import { SITE_CITY, SITE_DESCRIPTION } from '@/lib/site';
import { IconArrow, IconBall, IconBat, IconBlock, IconCalendar, IconChart, IconClock, IconHourglass, IconLayers, IconPaddle, IconPlus, IconShuttle, IconStar, IconTicket, IconUndo, IconUsers } from '../_ui/icons';
import { APP_URL } from '../_ui/links';
import Reveal from '../_ui/Reveal';
import SiteFooter from '../_ui/SiteFooter';
import SiteHeader from '../_ui/SiteHeader';
import { body, display } from './fonts';
import styles from './landing.module.css';
import SlotBoard from './SlotBoard';

export const metadata: Metadata = {
  title: 'Turf and court booking in Mangalore',
  description: SITE_DESCRIPTION,
  alternates: { canonical: '/' },
};

const SPORTS = [
  { name: 'Football', place: 'Turfs', line: 'Five-a-side and seven-a-side pitches, booked by the hour.', Icon: IconBall },
  { name: 'Box cricket', place: 'Turfs', line: 'Net-enclosed turfs for quick evening matches.', Icon: IconBat },
  { name: 'Badminton', place: 'Courts', line: 'Indoor courts with the hour you want.', Icon: IconShuttle },
  { name: 'Pickleball', place: 'Courts', line: 'Courts opening across the city, easy to try.', Icon: IconPaddle },
];

const STEPS = [
  { title: 'Pick your hours', text: 'Choose a turf or court, a day and one or more open hours. Prices show before you confirm.' },
  { title: 'Hold the slot', text: 'Your hours are held for 8 minutes while you check out, so nobody books them from under you.', stat: '8:00' },
  { title: 'Walk in with a ticket', text: 'Your ticket and booking history stay in one place. Show it at the turf and play.' },
];

const FEATURES = [
  { title: 'Live open slots', text: 'See what is free right now, hour by hour, without calling anyone.', Icon: IconClock, wide: true },
  { title: 'Hold, then confirm', text: 'Slots are held for 8 minutes while you pay the advance.', Icon: IconHourglass },
  { title: 'Several hours at once', text: 'Book a block of hours in a single checkout.', Icon: IconLayers },
  { title: 'A ticket for every booking', text: 'A QR ticket to show at the turf, plus an add-to-calendar link.', Icon: IconTicket },
  { title: 'Cancel yourself', text: 'Plans change. Cancel up to 2 hours before the slot, no calls needed.', Icon: IconUndo },
  { title: 'Reviews and saved turfs', text: 'Read what players say, then save your regular spots for next time.', Icon: IconStar, wide: true },
];

const OWNER_POINTS = [
  { text: 'A calendar of every court and hour, in one view', Icon: IconCalendar },
  { text: 'Bookings and check-ins from one dashboard', Icon: IconUsers },
  { text: 'Block hours for maintenance or private games', Icon: IconBlock },
  { text: 'See which hours earn the most and which stay quiet', Icon: IconChart },
];

const FAQ = [
  { q: 'What is OYUN?', a: `OYUN is a turf and court booking platform for ${SITE_CITY}. You see open slots, hold the hours you want and get a ticket, instead of calling around.` },
  { q: 'Which sports can I book?', a: 'Football and box cricket turfs, plus badminton and pickleball courts. More venues are joining before launch.' },
  { q: 'How does booking work?', a: 'Pick a turf, a day and your hours. Your slots are held for 8 minutes while you sign in and confirm. A small advance is paid when you book and the rest at the venue.' },
  { q: 'Can I cancel a booking?', a: 'Yes. You can cancel from your ticket up to 2 hours before the slot starts.' },
  { q: 'I run a turf. How do I get listed?', a: 'Write to us with your venue details. We review each turf, and once it is approved you get a partner login with your calendar, bookings and check-in tools.' },
  { q: 'When can I start booking?', a: 'Booking opens at launch. The launch countdown page shows exactly when.' },
];

export default async function LandingPage() {
  const { supportEmail } = await getSettings();
  return (
    <div className={`${display.variable} ${body.variable} ${styles.page}`}>
      <SiteHeader />
      <main id="content">
        {/* ---------- hero ---------- */}
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroGlow} aria-hidden="true" />
          <div className={`${styles.wrap} ${styles.heroGrid}`}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>Turf and court booking · {SITE_CITY}</p>
              <h1 id="hero-title" className={styles.h1}>
                <span className={styles.h1Line}>Find the slot.</span>
                <span className={`${styles.h1Line} ${styles.h1Red}`}>Own the hour.</span>
              </h1>
              <p className={styles.lead}>OYUN shows live open slots at turfs and courts across {SITE_CITY}. Pick your hours, hold them, and walk in with a ticket.</p>
              <div className={styles.ctaRow}>
                <a href={APP_URL} className={styles.btnPrimary}>Browse &amp; book <IconArrow /></a>
                <Link href="/countdown" className={styles.btnGhost}>See the launch countdown</Link>
              </div>
              <ul className={styles.heroFacts}>
                <li>Football</li>
                <li>Box cricket</li>
                <li>Badminton</li>
                <li>Pickleball</li>
              </ul>
            </div>
            <SlotBoard />
          </div>
        </section>

        {/* ---------- sports ---------- */}
        <section id="sports" className={`${styles.section} ${styles.light}`} aria-labelledby="sports-title">
          <div className={styles.wrap}>
            <Reveal>
              <p className={styles.eyebrowDark}>Sports</p>
              <h2 id="sports-title" className={styles.h2}>Four games. One place to book them.</h2>
            </Reveal>
            <ul className={styles.fixtures}>
              {SPORTS.map(({ name, place, line, Icon }, i) => (
                <Reveal as="li" key={name} delay={i * 70} className={styles.fixture}>
                  <span className={styles.fixIcon}><Icon /></span>
                  <span className={styles.fixName}>{name}</span>
                  <span className={styles.fixLine}>{line}</span>
                  <span className={styles.fixPlace}>{place}</span>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* ---------- how it works ---------- */}
        <section id="how" className={`${styles.section} ${styles.dark}`} aria-labelledby="how-title">
          <div className={styles.wrap}>
            <Reveal>
              <p className={styles.eyebrow}>How it works</p>
              <h2 id="how-title" className={`${styles.h2} ${styles.h2Light}`}>From open slot to kick-off in three steps.</h2>
            </Reveal>
            <ol className={styles.steps}>
              {STEPS.map((s, i) => (
                <Reveal as="li" key={s.title} delay={i * 120} className={styles.step}>
                  <span className={styles.stepNo} aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className={styles.h3}>{s.title}</h3>
                  <p className={styles.stepText}>{s.text}</p>
                  {s.stat && <span className={styles.stepStat} aria-hidden="true">{s.stat}</span>}
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------- features ---------- */}
        <section className={`${styles.section} ${styles.light}`} aria-labelledby="features-title">
          <div className={styles.wrap}>
            <Reveal>
              <p className={styles.eyebrowDark}>Built for players</p>
              <h2 id="features-title" className={styles.h2}>Everything around the booking, handled.</h2>
            </Reveal>
            <ul className={styles.bento}>
              {FEATURES.map(({ title, text, Icon, wide }, i) => (
                <Reveal as="li" key={title} delay={(i % 3) * 80} className={`${styles.tile} ${wide ? styles.tileWide : ''}`}>
                  <span className={styles.tileIcon}><Icon /></span>
                  <h3 className={styles.h3Dark}>{title}</h3>
                  <p className={styles.tileText}>{text}</p>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* ---------- turf owners ---------- */}
        <section id="owners" className={`${styles.section} ${styles.dark}`} aria-labelledby="owners-title">
          <div className={`${styles.wrap} ${styles.ownersGrid}`}>
            <Reveal>
              <p className={styles.eyebrow}>For turf owners</p>
              <h2 id="owners-title" className={`${styles.h2} ${styles.h2Light}`}>Fill your quiet hours without the phone tag.</h2>
              <p className={styles.leadLight}>Players book straight into your calendar. You see every court and hour in one view and run the day from your phone.</p>
              <ul className={styles.ownerList}>
                {OWNER_POINTS.map(({ text, Icon }) => (
                  <li key={text}><span className={styles.ownerIcon}><Icon size={20} /></span>{text}</li>
                ))}
              </ul>
              <a href={`mailto:${supportEmail}?subject=List%20my%20turf%20on%20OYUN`} className={styles.btnPrimary}>List your turf <IconArrow /></a>
            </Reveal>
            <Reveal delay={120}>
              <div className={styles.calendar} aria-hidden="true">
                <div className={styles.calHead}><span>This week</span><span>4 courts</span></div>
                <div className={styles.calGrid}>
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                    <span key={i} className={styles.calDay}>{d}</span>
                  ))}
                  {Array.from({ length: 35 }).map((_, i) => {
                    const filled = [0, 1, 3, 4, 6, 8, 9, 11, 13, 15, 16, 17, 20, 22, 23, 24, 26, 27, 29, 31, 33, 34].includes(i);
                    return <span key={i} className={`${styles.calCell} ${filled ? styles.calFilled : ''}`} />;
                  })}
                </div>
                <p className={styles.calNote}>Illustration of the partner calendar</p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ---------- FAQ ---------- */}
        <section id="faq" className={`${styles.section} ${styles.light}`} aria-labelledby="faq-title">
          <div className={`${styles.wrap} ${styles.faqGrid}`}>
            <Reveal>
              <p className={styles.eyebrowDark}>Questions</p>
              <h2 id="faq-title" className={styles.h2}>Quick answers.</h2>
              <p className={styles.leadDark}>More guides and rules live in the <a className={styles.inlineLink} href="https://help.oyun.co.in/help">help centre</a>.</p>
            </Reveal>
            <div className={styles.faqList}>
              {FAQ.map((f, i) => (
                <Reveal key={f.q} delay={i * 40}>
                  <details className={styles.faqItem} {...(i === 0 ? { open: true } : {})}>
                    <summary className={styles.faqQ}>
                      {f.q}
                      <span className={styles.faqPlus}><IconPlus /></span>
                    </summary>
                    <p className={styles.faqA}>{f.a}</p>
                  </details>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- closing call to action ---------- */}
        <section className={styles.final} aria-labelledby="final-title">
          <div className={`${styles.wrap} ${styles.finalInner}`}>
            <Reveal>
              <h2 id="final-title" className={styles.finalTitle}>Your next game starts with an open slot.</h2>
              <div className={styles.ctaRow}>
                <a href={APP_URL} className={styles.btnLight}>Browse &amp; book <IconArrow /></a>
                <Link href="/countdown" className={styles.btnGhostLight}>See the launch countdown</Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <SiteFooter supportEmail={supportEmail} />
    </div>
  );
}
