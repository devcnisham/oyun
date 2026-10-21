import type { Metadata } from 'next';
import Link from 'next/link';
import { platformOffersOf } from '@/lib/platform-offers';
import { getSettings } from '@/lib/queries';
import { rupees } from '@/lib/format';
import styles from '../hub.module.css';

export const metadata: Metadata = {
  title: 'Your OYUN account | Rewards, Saved Turfs and Booking History',
  description: 'A free OYUN account keeps your bookings and saved venues in one place, with cashback and referral rewards when they are switched on.',
  alternates: { canonical: '/membership' },
};

// OYUN has no paid membership. This page says what a free account gives, read from the live settings so it never promises
// a reward that is switched off.
export default async function MembershipPage() {
  const s = await getSettings();
  const { student } = platformOffersOf(s);
  const perks: { title: string; text: string }[] = [
    { title: 'Your bookings in one place', text: 'Tickets and history stay on your account, on any device you sign in from.' },
    { title: 'Saved venues', text: 'Keep the turfs and courts you play at one tap away.' },
    { title: 'Cancel yourself', text: 'Cancel from your ticket up to 2 hours before the slot starts.' },
  ];
  if (s.cashbackEnabled) perks.push({ title: 'Cashback', text: `${s.cashbackPercent}% back to your wallet after you play, up to ${rupees(s.cashbackMax)} per booking.` });
  if (s.referralEnabled) perks.push({ title: 'Refer a friend', text: `Your friend gets ${rupees(s.refereeReward)} and you get ${rupees(s.referrerReward)} after their first game.` });
  if (student.active) perks.push({ title: 'Student price', text: `${student.percentOff}% off for approved students. Send your student ID once at checkout.` });
  return (
    <div className={`container ${styles.page}`}>
      <nav className={styles.crumbs} aria-label="Breadcrumb"><Link href="/">Home</Link> / <span>Account</span></nav>
      <h1 className={styles.title}>Your OYUN account</h1>
      <p className={styles.lead}>There is no paid membership. A free account gives you the following.</p>
      <ul className={styles.perks}>
        {perks.map((p) => (
          <li key={p.title}><b>{p.title}</b><span>{p.text}</span></li>
        ))}
      </ul>
      <div className={styles.actions}>
        <Link href="/signup" className={styles.cta}>Create an account</Link>
        <Link href="/login" className={`${styles.cta} ${styles.ctaGhost}`}>Sign in</Link>
      </div>
    </div>
  );
}
