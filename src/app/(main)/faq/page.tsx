import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import { getSettings } from '@/lib/queries';
import { faqSchema } from '@/lib/schema';
import styles from './page.module.css';
import BackButton from '@/components/BackButton';

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
      a: 'Open a turf, pick a date and tap one or more free slots, then press Proceed. Your slots are held for you for 8 minutes while you sign in and reserve. You get a booking with a QR code straight away, and you pay at the turf when you arrive.',
    },
    {
      q: 'What does "On hold" mean on a slot?',
      a: 'Another player is reserving that slot right now. Holds last 8 minutes; if they don\'t finish in time the slot opens up again automatically. Slot maps update live, so you see it the moment it changes.',
    },
    {
      q: 'Do I need an account to book?',
      a: 'Yes, a free OYUN account. Sign in or sign up with your mobile number when you reserve. Your bookings appear under My bookings, and you can install OYUN to your home screen like an app.',
    },
    {
      q: 'What is the cancellation policy?',
      a: 'Open your booking and tap Cancel booking, up to 2 hours before your slot. Closer to the time, call the turf or OYUN support. You pay at the venue, so there is nothing to refund.',
    },
    {
      q: 'How do I check in at the turf?',
      a: 'Show the QR code on your booking page at the front desk. Staff scan it to check you in, and you pay the turf by cash or UPI.',
    },
    {
      q: 'Do I earn cashback?',
      a: s.cashbackEnabled
        ? `Yes. You earn ${s.cashbackPercent}% cashback (up to ₹${s.cashbackMax}) in your OYUN wallet when you check in for a game.`
        : 'Cashback offers run from time to time and are shown at checkout when available.',
    },
    {
      q: 'Do I need to bring my own equipment?',
      a: 'Most turfs have balls and bibs. Check the amenities on the turf page, or call the turf if you need anything specific.',
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
        <BackButton />
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
