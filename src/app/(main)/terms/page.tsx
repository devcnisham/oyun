import type { Metadata } from 'next';
import React from 'react';
import Link from 'next/link';
import styles from '../faq/page.module.css';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms that apply when you book a turf or list a sports venue on OYUN.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.content}>
        <Link href="/" style={{display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 24, color: 'var(--text-muted)', textDecoration: 'none', fontSize: 14, fontWeight: 500}}>
          <span style={{fontSize: 16}}>←</span> Back home
        </Link>
        <h1 className={styles.title}>Terms of Service</h1>
        <p className={styles.subtitle}>Last updated: October 5, 2026</p>

        <div className={styles.textBlock}>
          <p>
            Welcome to OYUN! These terms and conditions outline the rules and regulations for the use of OYUN&apos;s Website, located at oyun.in.
          </p>
          <p>
            By accessing this website we assume you accept these terms and conditions. Do not continue to use OYUN if you do not agree to take all of the terms and conditions stated on this page.
          </p>

          <h2>1. Booking and Payments</h2>
          <ul>
            <li>Users must be at least 18 years of age, or have parental consent, to make bookings.</li>
            <li>All bookings are subject to availability. The turf partners reserve the right to decline or cancel bookings under extreme circumstances (e.g., severe weather).</li>
            <li>Users can opt for a 30% advance payment or full payment. The remaining balance for advance payments must be settled directly at the venue before the start of the slot.</li>
          </ul>

          <h2>2. Cancellations and Refunds</h2>
          <ul>
            <li>Cancellations made more than 24 hours prior to the scheduled slot are eligible for a full refund of any amount paid online.</li>
            <li>Cancellations made within 24 hours of the scheduled slot are non-refundable.</li>
            <li>In the event of a venue closure or turf-initiated cancellation, a full refund will be processed within 5-7 business days.</li>
          </ul>

          <h2>3. Venue Rules</h2>
          <ul>
            <li>Users must adhere strictly to the rules established by the individual turf management, including footwear requirements (e.g., non-marking shoes or studs as specified).</li>
            <li>Any damage caused to the turf or facilities by the user or their group will be billed directly to the user who made the booking.</li>
            <li>OYUN acts merely as an aggregator and booking platform; we are not responsible for any injuries or accidents that occur on the premises.</li>
          </ul>

          <h2>4. Modifications</h2>
          <p>
            OYUN reserves the right to revise these terms of service for its website at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.
          </p>
        </div>
      </div>
    </div>
  );
}
