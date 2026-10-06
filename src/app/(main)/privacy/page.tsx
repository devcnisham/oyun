import type { Metadata } from 'next';
import React from 'react';
import Link from 'next/link';
import styles from '../faq/page.module.css';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How OYUN collects, uses and protects your personal data when you book turfs or list a venue.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.content}>
        <Link href="/" style={{display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 24, color: 'var(--text-muted)', textDecoration: 'none', fontSize: 14, fontWeight: 500}}>
          <span style={{fontSize: 16}}>←</span> Back home
        </Link>
        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.subtitle}>Last updated: October 5, 2026</p>

        <div className={styles.textBlock}>
          <p>
            At OYUN, accessible from oyun.in, one of our main priorities is the privacy of our visitors. 
            This Privacy Policy document contains types of information that is collected and recorded by OYUN and how we use it.
          </p>

          <h2>Information we collect</h2>
          <p>
            The personal information that you are asked to provide, and the reasons why you are asked to provide it, 
            will be made clear to you at the point we ask you to provide your personal information.
          </p>
          <ul>
            <li><strong>Account Information:</strong> When you register for an Account, we may ask for your contact information, including items such as name, company name, address, email address, and telephone number.</li>
            <li><strong>Booking Data:</strong> Information regarding the turfs you book, times, dates, and payment history.</li>
          </ul>

          <h2>How we use your information</h2>
          <p>We use the information we collect in various ways, including to:</p>
          <ul>
            <li>Provide, operate, and maintain our website and booking platform</li>
            <li>Improve, personalize, and expand our services</li>
            <li>Understand and analyze how you use our platform</li>
            <li>Process transactions and send related information (e.g., booking confirmations)</li>
            <li>Communicate with you for customer service and updates</li>
          </ul>

          <h2>Log Files</h2>
          <p>
            OYUN follows a standard procedure of using log files. These files log visitors when they visit websites. 
            The information collected by log files include internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), 
            date and time stamp, referring/exit pages, and possibly the number of clicks.
          </p>

          <h2>Contact Us</h2>
          <p>
            If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us at hello@oyun.in.
          </p>
        </div>
      </div>
    </div>
  );
}
