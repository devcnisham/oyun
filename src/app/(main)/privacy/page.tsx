import type { Metadata } from 'next';
import Link from 'next/link';
import { getSettings } from '@/modules/web/database/queries';
import styles from '../faq/page.module.css';
import BackButton from '@/modules/web/frontend/BackButton';
import PrivacyDataControls from '@/modules/web/frontend/PrivacyDataControls';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How OYUN collects, uses, shares and protects your personal data when you book a venue or list a venue, which cookies we use, and your rights under India\'s DPDP Act.',
  alternates: { canonical: '/privacy' },
};

const UPDATED = '6 October 2026';

export default async function PrivacyPage() {
  const s = await getSettings();
  return (
    <div className={styles.pageContainer}>
      <article className={styles.content}>
        <BackButton />
        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.subtitle}>Last updated: {UPDATED}</p>

        <div className={styles.textBlock}>
          <p>
            This policy explains what personal data OYUN (&quot;we&quot;, &quot;us&quot;) collects when you use our website and app to book sports venues or to list a venue,
            why we collect it, who we share it with and the choices you have. We process personal data in line with India&apos;s Digital Personal Data Protection Act, 2023.
          </p>

          <h2>1. Data we collect</h2>
          <ul>
            <li><strong>Booking details:</strong> your name, mobile number, the venue, date and time you book, the amount paid and your booking status (for example checked in or cancelled).</li>
            <li><strong>Wallet and referrals:</strong> wallet credits, cashback, refunds and your referral code, linked to your mobile number.</li>
            <li><strong>Venue owners and staff:</strong> name, email, phone, business name, GSTIN and address, and the details of the venue you list.</li>
            <li><strong>Device data:</strong> a random device identifier cookie used to hold slots during checkout, and the name, number and booking list you choose to save on your device.</li>
            <li><strong>Technical data:</strong> IP address, browser type and pages requested, kept in server logs for security and to fix errors.</li>
            <li><strong>Analytics (only with your consent):</strong> anonymous usage statistics such as pages visited and device type.</li>
          </ul>
          <p>We do not collect card or UPI details ourselves. When online payments are enabled they are handled by a licensed payment gateway.</p>

          <h2>2. Why we use it</h2>
          <ul>
            <li>To create and manage your booking and show it to the venue so they can check you in.</li>
            <li>To run the wallet, cashback, referrals and refunds.</li>
            <li>To prevent fraud, abuse and double bookings, and keep the service secure.</li>
            <li>To answer support requests and send booking-related messages.</li>
            <li>With your consent, to understand how the site is used and improve it.</li>
          </ul>

          <h2>3. Who we share it with</h2>
          <ul>
            <li><strong>The venue you book:</strong> your name, mobile number and booking details, so they can run your game.</li>
            <li><strong>Service providers</strong> that host and run OYUN for us (cloud hosting and database providers), under contract and only to provide the service.</li>
            <li><strong>Authorities</strong> when required by law.</li>
          </ul>
          <p>We do not sell your personal data.</p>

          <h2>4. Cookies and local storage</h2>
          <p>We use a small number of cookies:</p>
          <ul>
            <li><strong>Essential:</strong> <code>oyun_device</code> (holds your slots during checkout), <code>sa_partner_session</code> and <code>sa_admin_session</code> (keep partners and admins signed in), <code>sa_partner_turf</code> (remembers the selected venue), and <code>oyun_consent</code> (remembers your cookie choice).</li>
            <li><strong>Analytics (optional):</strong> only set if you choose &quot;Accept all&quot; in the cookie banner. This includes <code>oyun_src</code>, which remembers the website or campaign that sent you to OYUN (for example Google or an Instagram link) for 30 days so we can see which channels lead to bookings; it holds no personal details. You can change your choice at any time from the <em>Cookie settings</em> link in the footer.</li>
          </ul>
          <p>Your saved name, number and booking list are stored in your browser&apos;s local storage and never leave your device unless you make a booking. You can clear them from the Profile tab.</p>

          <h2>5. How long we keep it</h2>
          <p>
            We keep booking, wallet and invoice records for as long as needed to provide the service and for up to 8 years where tax and accounting law requires it.
            Server logs are kept for up to 90 days. Analytics data is aggregated and does not identify you.
          </p>

          <h2>6. Your rights (DPDP Act 2023)</h2>
          <p>Under India&apos;s Digital Personal Data Protection Act, you can ask us to:</p>
          <ul>
            <li><strong>Access and Export:</strong> download a copy of all personal data, bookings and transactions we hold about you;</li>
            <li><strong>Correct or update</strong> inaccurate details;</li>
            <li><strong>Erase personal data:</strong> delete your account and scrub personal identifiers from past booking history, while retaining statutory accounting totals required by law;</li>
            <li><strong>Withdraw consent</strong> for analytics cookies at any time.</li>
          </ul>

          <h3>Self-service data rights</h3>
          <PrivacyDataControls />

          <p style={{ marginTop: 16 }}>
            You may also email <a href={`mailto:${s.supportEmail}`}>{s.supportEmail}</a> from the contact details linked to your booking. We reply within 30 days.
            If you are not satisfied with our grievance redressal, you may complain to the Data Protection Board of India.
          </p>

          <h2>7. Security</h2>
          <p>
            Data is encrypted in transit (HTTPS) and access to the database is restricted to our servers. Partner and admin passwords are stored as salted hashes,
            and repeated failed logins are blocked. No system is perfectly secure, so please keep your login details private.
          </p>

          <h2>8. Children</h2>
          <p>OYUN is not intended for children under 18 to book without a parent or guardian. If you believe a child has given us data, contact us and we will delete it.</p>

          <h2>9. Changes</h2>
          <p>We may update this policy. We will change the date above and, for significant changes, show a notice on the site.</p>

          <h2>10. Contact and grievance officer</h2>
          <p>
            Grievance Officer, OYUN, Mangalore, Karnataka, India. Email <a href={`mailto:${s.supportEmail}`}>{s.supportEmail}</a>{s.supportPhone ? ` or call ${s.supportPhone}` : ''}.
          </p>
          <p>See also our <Link href="/terms">Terms &amp; Conditions</Link>.</p>
        </div>
      </article>
    </div>
  );
}
