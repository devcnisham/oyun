import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { SITE_CITY } from '@/lib/site';
import { getSettings } from '@/lib/queries';
import { buildFaqs } from '@/lib/faq';
import { SPORTS, SPORTS_PHRASE, sportHref } from '@/lib/sports';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: `Play more, plan less: book a turf or court in ${SITE_CITY}`,
  description: `OYUN shows live slot availability for ${SPORTS_PHRASE} in ${SITE_CITY}. Pick a slot, hold it, book it. No calls, no back and forth.`,
  alternates: { canonical: '/welcome' },
};

const steps = [
  { title: 'Pick your game', desc: 'Choose a sport and an area. See which venues have your slot open right now.' },
  { title: 'Hold the slot', desc: 'Tap a time. We hold it for you for 8 minutes while you check out, so nobody books it from under you.' },
  { title: 'Show the QR, play', desc: 'Your ticket has a QR code. Show it at the desk and walk on to the pitch.' },
];

const features = [
  { icon: '🟢', title: 'Live availability', desc: 'Slots update as people book. What you see open is open.' },
  { icon: '🔒', title: 'No double bookings', desc: 'One slot, one booking. The system enforces it, not a phone call.' },
  { icon: '💸', title: 'Pay at the venue', desc: 'Nothing is charged online. You pay the turf in cash or UPI when you play.' },
  { icon: '📲', title: 'Works like an app', desc: 'Install OYUN to your home screen and find your bookings in one tap.' },
  { icon: '✅', title: 'Verified venues', desc: 'Listings carry a verified badge after our team has checked the turf.' },
  { icon: '⭐', title: 'Reviews from real players', desc: 'Only people who checked in can review, one review per booking.' },
];

const bookingDetails = [
  { icon: '🗓️', title: 'Pick one or more slots', desc: 'Choose a date, tap as many free hours as you need, then press Proceed.' },
  { icon: '⏱️', title: 'Held for 8 minutes', desc: 'Your slots are held while you sign in and reserve. If time runs out they open up again.' },
  { icon: '📱', title: 'Free account, mobile number', desc: 'Sign in or sign up with your mobile number. Every booking lives under My bookings.' },
  { icon: '🎟️', title: 'QR ticket, straight away', desc: 'You get a booking with a QR code at once, plus an invoice and a calendar file.' },
  { icon: '💬', title: 'Share with your team', desc: 'Send the booking to the group on WhatsApp or add it to your calendar.' },
  { icon: '🎁', title: 'Offers and cashback', desc: 'Promo codes, first-time and happy-hour offers and wallet cashback show at checkout when available.' },
  { icon: '🧤', title: 'Add-ons', desc: 'Add equipment rental or drinks at checkout where the venue offers them.' },
  { icon: '↩️', title: 'Cancel up to 2 hours before', desc: 'Open the booking and tap Cancel booking. Closer to the time, call the turf or OYUN support.' },
];

const ownerPoints = [
  'Get found by players searching in your area',
  'Manage slots, walk-ins and blocks from one dashboard',
  'Check players in with a QR scan and track no-shows',
  'Zero commission while we are in beta',
];

function FeatureGrid({ items }: { items: { icon: string; title: string; desc: string }[] }) {
  return (
    <ul className={styles.featureGrid}>
      {items.map((f) => (
        <li key={f.title} className={styles.feature}>
          <span className={styles.featureIcon} aria-hidden="true">{f.icon}</span>
          <h3 className={styles.h3}>{f.title}</h3>
          <p className={styles.body}>{f.desc}</p>
        </li>
      ))}
    </ul>
  );
}

export default async function WelcomePage() {
  const faqs = buildFaqs(await getSettings()).slice(0, 5); // booking questions, same answers as /faq
  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <Image
          src={SPORTS[0].image}
          alt=""
          fill
          preload
          sizes="100vw"
          className={styles.heroImg}
        />
        <div className={styles.heroShade} aria-hidden="true" />
        <div className={`container ${styles.heroInner}`}>
          <p className={styles.eyebrow}>{SITE_CITY}&apos;s turf and court booking</p>
          <h1 className={styles.heroTitle}>Your slot is one tap away.</h1>
          <p className={styles.heroLead}>
            Book {SPORTS_PHRASE} in {SITE_CITY}. See what is free, hold it, play. No calls, no waiting for a reply.
          </p>
          <div className={styles.heroCtas}>
            <Link href="/arenas" className={styles.primaryBtn}>Find a slot</Link>
            <Link href="/list-turf" className={styles.ghostBtn}>List your turf</Link>
          </div>
        </div>
      </section>

      {/* Sports */}
      <section className={`container ${styles.section}`} aria-labelledby="sports-h">
        <h2 id="sports-h" className={styles.h2}>Whatever you play</h2>
        <p className={styles.sub}>Four sports, one place to book them.</p>
        <ul className={styles.sportGrid}>
          {SPORTS.map((s) => (
            <li key={s.value}>
              <Link href={sportHref(s.value)} className={styles.sportCard}>
                <Image src={s.image} alt="" fill sizes="(max-width: 768px) 50vw, 25vw" className={styles.sportImg} />
                <span className={styles.sportShade} aria-hidden="true" />
                <span className={styles.sportName}>
                  <span aria-hidden="true">{s.icon}</span> {s.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* How it works */}
      <section className={styles.band} aria-labelledby="how-h">
        <div className={`container ${styles.section}`}>
          <h2 id="how-h" className={styles.h2}>Booked in three steps</h2>
          <ol className={styles.steps}>
            {steps.map((s, i) => (
              <li key={s.title} className={styles.step}>
                <span className={styles.stepNum} aria-hidden="true">{i + 1}</span>
                <h3 className={styles.h3}>{s.title}</h3>
                <p className={styles.body}>{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Booking in detail */}
      <section className={`container ${styles.section}`} aria-labelledby="booking-h">
        <h2 id="booking-h" className={styles.h2}>Everything about your booking</h2>
        <p className={styles.sub}>What happens from the first tap to the final whistle.</p>
        <FeatureGrid items={bookingDetails} />
      </section>

      {/* Features */}
      <section className={`container ${styles.section}`} aria-labelledby="why-h">
        <h2 id="why-h" className={styles.h2}>Built so game day just works</h2>
        <FeatureGrid items={features} />
      </section>

      {/* Booking questions */}
      <section className={`container ${styles.section}`} aria-labelledby="faq-h">
        <h2 id="faq-h" className={styles.h2}>Booking questions</h2>
        <div className={styles.faqList}>
          {faqs.map((f) => (
            <details key={f.q} className={styles.faq}>
              <summary className={styles.faqQ}>{f.q}</summary>
              <p className={styles.faqA}>{f.a}</p>
            </details>
          ))}
        </div>
        <p className={styles.faqMore}><Link href="/faq">More answers in the FAQ</Link></p>
      </section>

      {/* Owners */}
      <section className={styles.owners} aria-labelledby="owners-h">
        <div className={`container ${styles.ownersInner}`}>
          <div>
            <h2 id="owners-h" className={styles.ownersTitle}>Run a turf or court?</h2>
            <p className={styles.ownersLead}>Fill your empty hours without chasing bookings on WhatsApp.</p>
            <Link href="/list-turf" className={styles.lightBtn}>List your venue free</Link>
          </div>
          <ul className={styles.ownerList}>
            {ownerPoints.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Closing CTA */}
      <section className={`container ${styles.closing}`} aria-labelledby="close-h">
        <h2 id="close-h" className={styles.h2}>Ready for tonight&apos;s game?</h2>
        <div className={styles.heroCtas}>
          <Link href="/arenas" className={styles.primaryBtn}>Browse turfs</Link>
          <Link href="/faq" className={styles.outlineBtn}>Read the FAQ</Link>
        </div>
      </section>
    </div>
  );
}
