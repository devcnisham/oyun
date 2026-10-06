import Link from 'next/link';
import styles from '../auth.module.css';

// Shown until Clerk keys are added, so the page never breaks
export default function NotConfigured() {
  return (
    <div className={styles.notice}>
      <p><strong>Player accounts are coming soon.</strong></p>
      <p>You can already book any turf with just your name and mobile number, and your bookings are saved on this device.</p>
      <Link href="/arenas" className={styles.submitBtn}>Book a turf</Link>
    </div>
  );
}
