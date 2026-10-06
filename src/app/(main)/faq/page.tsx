import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import { getSettings } from '@/lib/queries';
import { faqSchema } from '@/lib/schema';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Turf Booking FAQ | Payments, Cancellations & Check-in',
  description: 'Answers to common questions about booking football turfs on OYUN: how slot holds work, advance payments, cancellations, refunds, wallet cashback and checking in.',
  alternates: { canonical: '/faq' },
};

export default async function FAQPage() {
  const s = await getSettings();
  const faqs = [
    {
      q: 'How do I book a turf on OYUN?',
      a: `Open a turf, pick a date and tap one or more free slots, then press Proceed. Your slots are held for 8 minutes while you enter your name and number and pay the full amount or a ${s.advancePercent}% advance. You get a booking with a QR code straight away.`,
    },
    {
      q: 'What does "On hold" mean on a slot?',
      a: 'Another player is checking out that slot right now. Holds last 8 minutes; if they don\'t pay in time the slot opens up again automatically.',
    },
    {
      q: 'Do I need an account to book?',
      a: 'No. You book with your name and mobile number. Your bookings are saved on your phone under the Bookings tab, and you can install OYUN to your home screen like an app.',
    },
    {
      q: 'What is the cancellation policy?',
      a: 'Contact the turf or OYUN support to cancel. Refunds for cancelled bookings go to your OYUN wallet, which you can use on your next booking.',
    },
    {
      q: 'How do I check in at the turf?',
      a: 'Show the QR code on your booking page at the front desk. Staff scan it to check you in, and any balance for an advance booking is paid at the venue.',
    },
    {
      q: 'Do I earn cashback?',
      a: s.cashbackEnabled
        ? `Yes. You earn ${s.cashbackPercent}% cashback (up to ₹${s.cashbackMax}) in your OYUN wallet when you check in for a game.`
        : 'Cashback offers run from time to time and are shown at checkout when available.',
    },
    {
      q: 'Do I need to bring my own equipment?',
      a: 'Most turfs have balls and bibs, and many offer add-ons such as bibs, match balls, shoes and drinks that you can add at checkout.',
    },
    {
      q: 'How do I list my turf on OYUN?',
      a: 'Fill in the form on the List your turf page. Our team reviews it within 24–48 hours and sets up your partner dashboard for bookings, pricing, slots and payouts.',
    },
  ];

  return (
    <div className={styles.pageContainer}>
      <JsonLd data={faqSchema(faqs)} />
      <div className={styles.content}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 24, color: 'var(--text-muted)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
          <span style={{ fontSize: 16 }}>←</span> Back home
        </Link>
        <h1 className={styles.title}>Frequently asked questions</h1>
        <p className={styles.subtitle}>
          Everything you need to know about booking football turfs with OYUN. Still stuck? Email <a href={`mailto:${s.supportEmail}`}>{s.supportEmail}</a>.
        </p>

        <div className={styles.faqSection}>
          {faqs.map((f) => (
            <div key={f.q} className={styles.faqItem}>
              <h2>{f.q}</h2>
              <p>{f.a}</p>
            </div>
          ))}
        </div>

        <p className={styles.subtitle} style={{ marginTop: 32 }}>
          Ready to play? <Link href="/arenas">Browse football turfs in Mangalore</Link> or <Link href="/list-turf">list your own turf</Link>.
        </p>
      </div>
    </div>
  );
}
