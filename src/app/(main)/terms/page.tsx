import type { Metadata } from 'next';
import Link from 'next/link';
import { getSettings } from '@/lib/queries';
import styles from '../faq/page.module.css';
import BackButton from '@/components/BackButton';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description:
    'The terms for booking sports turfs on OYUN and for listing a venue: slot holds, paying at the venue, cancellations, no-shows, conduct and liability.',
  alternates: { canonical: '/terms' },
};

const UPDATED = '6 October 2026';

export default async function TermsPage() {
  const s = await getSettings();
  return (
    <div className={styles.pageContainer}>
      <article className={styles.content}>
        <BackButton />
        <h1 className={styles.title}>Terms &amp; Conditions</h1>
        <p className={styles.subtitle}>Last updated: {UPDATED}</p>

        <div className={styles.textBlock}>
          <p>
            These terms apply when you use OYUN to book a sports turf (&quot;player&quot;) or to list and manage a venue (&quot;partner&quot;). By making a booking or listing a venue
            you agree to them. Please also read our <Link href="/privacy">Privacy Policy</Link>.
          </p>

          <h2>1. What OYUN does</h2>
          <p>
            OYUN is a marketplace that shows venue availability and takes bookings on behalf of independent turf owners. The venue, its facilities and the game itself are
            provided by the turf owner, not by OYUN.
          </p>

          <h2>2. Bookings and slot holds</h2>
          <ul>
            <li>When you press Proceed, the selected slots are held for you for 8 minutes. If you don&apos;t complete the booking in that time the hold ends and the slots are released.</li>
            <li>A booking is confirmed only when you see the confirmation with a booking code and QR code.</li>
            <li>Please enter your real name and mobile number; the turf uses them to check you in.</li>
            <li>Prices can change with demand (for example peak hours, weekends or last-minute deals). The price shown at checkout is the price you pay.</li>
          </ul>

          <h2>3. Payments</h2>
          <ul>
            <li>You reserve slots on OYUN and pay the turf at the venue, by cash or UPI. Each booked hour needs an advance (₹150 by default) when you arrive, and the balance is paid after you play. No payment is taken online.</li>
            <li>Prices include GST where applicable. Invoices are available from your booking page.</li>
            <li>Wallet credits (cashback, referral rewards), when offered, can only be used for bookings on OYUN, have no cash value and cannot be transferred.</li>
          </ul>

          <h2>4. Cancellations, no-shows and refunds</h2>
          <ul>
            <li><strong>Standard cancellation:</strong> You can cancel a booking yourself from its booking page up to 2 hours before the slot starts. Any advance payment or wallet deduction is refunded 100% to your OYUN wallet immediately. Within 2 hours of the slot, self-cancellation closes; contact the turf or OYUN support.</li>
            <li><strong>Rain &amp; weather policy (Monsoon guarantee):</strong> For outdoor open turfs, if unplayable monsoon rain or waterlogging occurs, your booking is eligible for an immediate 100% full wallet refund right up until the slot start time.</li>
            <li><strong>No-shows:</strong> If you don&apos;t arrive for your slot and haven&apos;t cancelled, it will be marked as a no-show. Repeated no-shows can lead to your account being blocked from booking.</li>
            <li><strong>Turf cancellation:</strong> If a turf cancels or cannot host your game (for maintenance or venue emergencies), you receive a 100% refund to your wallet and our team assists with rebooking.</li>
          </ul>

          <h2>5. At the venue</h2>
          <ul>
            <li>Follow the turf&apos;s rules, timings and safety instructions. Wear suitable footwear.</li>
            <li>You are responsible for damage you cause to the venue or equipment.</li>
            <li>Sport carries a risk of injury. You play at your own risk; the turf owner is responsible for the condition of the venue.</li>
          </ul>

          <h2>6. Partners</h2>
          <ul>
            <li>Partners must provide accurate venue details, prices and availability, honour confirmed bookings and keep login details secure.</li>
            <li>Partners are responsible for their venue&apos;s licences, safety and taxes. Commission and payout terms are agreed separately and shown in the partner dashboard.</li>
            <li>We may suspend listings that receive repeated complaints or break these terms.</li>
          </ul>

          <h2>7. Acceptable use</h2>
          <p>Don&apos;t misuse OYUN: no fake or speculative bookings, holding slots you don&apos;t intend to book, scraping, automated access, or attempts to break security.</p>

          <h2>8. Liability</h2>
          <p>
            To the extent permitted by law, OYUN is not liable for indirect losses, or for anything that happens at a venue, and our total liability for a booking is limited to
            the amount you paid for it. Nothing in these terms limits rights you have under consumer protection law.
          </p>

          <h2>9. Changes and governing law</h2>
          <p>
            We may update these terms; the version shown when you book applies to that booking. These terms are governed by the laws of India, and courts in Mangalore,
            Karnataka have jurisdiction.
          </p>

          <h2>10. Contact</h2>
          <p>
            Questions? Email <a href={`mailto:${s.supportEmail}`}>{s.supportEmail}</a>{s.supportPhone ? ` or call ${s.supportPhone}` : ''}.
          </p>
        </div>
      </article>
    </div>
  );
}
