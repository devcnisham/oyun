import type { Metadata } from 'next';
import Link from 'next/link';
import BackButton from '@/modules/web/frontend/BackButton';
import JsonLd from '@/modules/web/frontend/JsonLd';
import CookieSettingsLink from '@/modules/web/frontend/consent/CookieSettingsLink';
import { buildFaqs } from '@/modules/web/lib/faq';
import { getSettings } from '@/modules/web/database/queries';
import { faqSchema } from '@/modules/web/lib/schema';
import styles from './Help.module.css';

export const metadata: Metadata = {
  title: 'Help center | Bookings, payments & cancellations',
  description: 'Get help with booking a venue or court on OYUN: contact support, cancel a booking, how payment works and answers to common questions.',
  alternates: { canonical: '/help' },
};

export default async function HelpPage() {
  const s = await getSettings();
  const faqs = buildFaqs(s);
  const phone = s.supportPhone?.trim();

  return (
    <div className={`container ${styles.page}`}>
      <JsonLd data={faqSchema(faqs)} />
      <BackButton fallback="/" />
      <h1 className={styles.title}>Help center</h1>

      <section className={styles.card} aria-labelledby="contact">
        <h2 id="contact">Contact us</h2>
        <p className={styles.hint}>Booking problem, a payment question, or a venue that did not turn up? Reach OYUN support.</p>
        <div className={styles.contact}>
          <a className={styles.contactBtn} href={`mailto:${s.supportEmail}`}> {s.supportEmail}</a>
          {phone && <a className={styles.contactBtn} href={`tel:${phone.replace(/\s+/g, '')}`}> {phone}</a>}
        </div>
      </section>

      <section className={styles.card} aria-labelledby="quick">
        <h2 id="quick">Quick help</h2>
        <ul className={styles.rows}>
          <li><Link href="/faq"><span aria-hidden></span><b>FAQ</b><i>Booking, payment, cancellation and check-in answers</i></Link></li>
          <li><Link href="/bookings"><span aria-hidden></span><b>Find or cancel a booking</b><i>Open it and tap Cancel booking, up to 2 hours before</i></Link></li>
          <li><Link href="/arenas"><span aria-hidden></span><b>Book a venue</b><i>Browse venues and pick your slots</i></Link></li>
          <li><Link href="/list-turf"><span aria-hidden></span><b>List your venue</b><i>For venue owners</i></Link></li>
          <li><Link href="/settings"><span aria-hidden></span><b>Settings</b><i>Cookies, account and notifications</i></Link></li>
        </ul>
      </section>

      <section className={styles.card} aria-labelledby="faq">
        <h2 id="faq">Common questions</h2>
        <div className={styles.faq}>
          {faqs.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <p className={styles.legal}>
        <Link href="/privacy">Privacy policy</Link> · <Link href="/terms">Terms &amp; conditions</Link> · <CookieSettingsLink className={styles.linkBtn} />
      </p>
    </div>
  );
}
