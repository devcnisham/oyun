import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/modules/web/frontend/JsonLd';
import { buildFaqs } from '@/modules/web/lib/faq';
import { getSettings } from '@/modules/web/database/queries';
import { faqSchema } from '@/modules/web/lib/schema';
import styles from './page.module.css';
import BackButton from '@/modules/web/frontend/BackButton';

export const metadata: Metadata = {
  title: 'Venue Booking FAQ | Payments, Cancellations & Check-in',
  description: 'Answers to common questions about booking venues and courts on OYUN: how slot holds work, advance payments, cancellations, refunds, wallet cashback and checking in.',
  alternates: { canonical: '/faq' },
};

export default async function FAQPage() {
  const s = await getSettings();
  const faqs = buildFaqs(s);

  return (
    <div className={styles.pageContainer}>
      <JsonLd data={faqSchema(faqs)} />
      <div className={styles.content}>
        <BackButton />
        <h1 className={styles.title}>Frequently asked questions</h1>
        <p className={styles.subtitle}>
          Everything you need to know about booking venues and courts with OYUN. Still stuck? Email <a href={`mailto:${s.supportEmail}`}>{s.supportEmail}</a>.
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
          Ready to play? <Link href="/arenas">Browse venues and courts in Mangalore</Link> or <Link href="/list-turf">list your own venue</Link>.
        </p>
      </div>
    </div>
  );
}
