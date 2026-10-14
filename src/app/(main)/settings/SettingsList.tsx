'use client';

import Link from 'next/link';
import { openConsentSettings } from '@/components/consent/consent';
import PrivacyDataControls from '@/components/PrivacyDataControls';
import styles from './Settings.module.css';

// Everything a player can change or look up about their OYUN experience, in one list
export default function SettingsList({ supportEmail }: { supportEmail: string }) {
  return (
    <>
      <section className={styles.card}>
        <h2>Account</h2>
        <ul className={styles.rows}>
          <li><Link href="/profile"><span aria-hidden>👤</span><b>Profile</b><i>Your name, phone number and sign-in</i></Link></li>
          <li><Link href="/bookings"><span aria-hidden>🎟️</span><b>My bookings</b><i>Tickets, receipts and cancellations</i></Link></li>
          <li><Link href="/saved"><span aria-hidden>♡</span><b>Saved turfs</b><i>Turfs you have hearted</i></Link></li>
        </ul>
      </section>

      <section className={styles.card}>
        <h2>Preferences</h2>
        <ul className={styles.rows}>
          <li>
            <button type="button" onClick={openConsentSettings}>
              <span aria-hidden>🍪</span><b>Cookie settings</b><i>Choose whether analytics cookies are allowed</i>
            </button>
          </li>
          <li className={styles.static}>
            <span aria-hidden>🔔</span><b>Notifications</b><i>Booking confirmations and reminders are not available yet</i>
          </li>
          <li className={styles.static}>
            <span aria-hidden>🌐</span><b>Language</b><i>English</i>
          </li>
        </ul>
      </section>

      <section className={styles.card}>
        <h2>Help and legal</h2>
        <ul className={styles.rows}>
          <li><Link href="/help"><span aria-hidden>❓</span><b>Help center</b><i>Contact support and common questions</i></Link></li>
          <li><Link href="/privacy"><span aria-hidden>🔒</span><b>Privacy policy</b><i>What we keep and why</i></Link></li>
          <li><Link href="/terms"><span aria-hidden>📄</span><b>Terms &amp; conditions</b><i>Bookings, payments and cancellations</i></Link></li>
          <li><a href={`mailto:${supportEmail}`}><span aria-hidden>✉️</span><b>Email support</b><i>{supportEmail}</i></a></li>
        </ul>
      </section>

      <section className={styles.card}>
        <h2>Your Data &amp; DPDP Rights</h2>
        <PrivacyDataControls />
      </section>

      <p className={styles.about}>OYUN · Sports turfs and courts in Mangalore</p>
    </>
  );
}
