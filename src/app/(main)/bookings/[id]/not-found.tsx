import type { Metadata } from 'next';
import Link from 'next/link';
import StatusPage from '@/components/status/StatusPage';
import styles from '@/components/status/StatusPage.module.css';

export const metadata: Metadata = { title: 'Booking not found', robots: { index: false } };

export default function BookingNotFound() {
  return (
    <StatusPage
      code="404"
      title="We can't find this booking"
      message="Check that the link is complete, or open My bookings on the phone you booked from. If you booked just now and the ticket is missing, please contact the turf: your booking may not have been saved."
    >
      <Link href="/bookings" className={styles.primary}>My bookings</Link>
      <Link href="/arenas" className={styles.secondary}>Find a turf</Link>
    </StatusPage>
  );
}
