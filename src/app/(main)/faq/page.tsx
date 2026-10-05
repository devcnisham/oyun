import React from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export const metadata = {
  title: 'FAQ - OYUN',
  description: 'Frequently Asked Questions about booking turfs on OYUN.',
};

export default function FAQPage() {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.content}>
        <Link href="/" style={{display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 24, color: 'var(--text-muted)', textDecoration: 'none', fontSize: 14, fontWeight: 500}}>
          <span style={{fontSize: 16}}>←</span> Back home
        </Link>
        <h1 className={styles.title}>Frequently Asked Questions</h1>
        <p className={styles.subtitle}>Everything you need to know about booking with OYUN.</p>

        <div className={styles.faqSection}>
          <div className={styles.faqItem}>
            <h3>How do I book a turf?</h3>
            <p>Simply search for your city or area, browse the available turfs, select a time slot, and proceed to payment. You can choose to pay the full amount or a 30% advance to secure your booking.</p>
          </div>
          <div className={styles.faqItem}>
            <h3>What is the cancellation policy?</h3>
            <p>You can cancel your booking up to 24 hours before the scheduled time slot for a full refund. Cancellations made within 24 hours are not eligible for a refund of the advance amount.</p>
          </div>
          <div className={styles.faqItem}>
            <h3>Do I need to carry my own equipment?</h3>
            <p>Most turfs provide basic equipment like balls and bibs. However, it&apos;s always best to check the amenities listed on the specific turf&apos;s page before your game.</p>
          </div>
          <div className={styles.faqItem}>
            <h3>How do I list my own turf on OYUN?</h3>
            <p>Click on &quot;List Your Turf&quot; at the top of the page and fill out the partner form. Our team will review your application and get back to you within 24-48 hours to set up your dashboard.</p>
          </div>
          <div className={styles.faqItem}>
            <h3>Is my payment information secure?</h3>
            <p>Yes. We use industry-standard encryption and partner with secure payment gateways like Razorpay/Stripe to ensure your financial data is completely safe.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
