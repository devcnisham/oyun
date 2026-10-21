import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import TurfCard from '@/components/TurfCard';
import type { PublicTurf } from '@/lib/types';
import styles from './page.module.css';

export function TurfGridSection({ id, title, turfs }: { id: string; title: ReactNode; turfs: PublicTurf[] }) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className={styles.h2}>
        {title}
      </h2>
      <div className={styles.grid}>
        {turfs.map((t) => (
          <TurfCard key={t.id} turf={t} />
        ))}
      </div>
    </section>
  );
}

export function FaqSection({
  id,
  title,
  faqs,
  style,
}: {
  id: string;
  title: ReactNode;
  faqs: { q: string; a: string }[];
  style?: CSSProperties;
}) {
  if (faqs.length === 0) return null;
  return (
    <section aria-labelledby={id} style={style}>
      <h2 id={id} className={styles.h2}>
        {title}
      </h2>
      <div className={styles.faqList}>
        {faqs.map((faq, i) => (
          <details key={i} className={styles.faqItem} open={i === 0}>
            <summary>{faq.q}</summary>
            <p>{faq.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function ChipLinks({
  id,
  title,
  links,
  style,
}: {
  id: string;
  title: ReactNode;
  links: { key: string; href: string; label: ReactNode }[];
  style?: CSSProperties;
}) {
  if (links.length === 0) return null;
  return (
    <section aria-labelledby={id} style={style}>
      <h2 id={id} className={styles.h2}>
        {title}
      </h2>
      <div className={styles.areas}>
        {links.map((l) => (
          <Link key={l.key} href={l.href} className={styles.areaLink}>
            {l.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
