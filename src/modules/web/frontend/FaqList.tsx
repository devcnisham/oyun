import styles from '@/app/(main)/turfs/[area]/page.module.css';

export default function FaqList({ faqs }: { faqs: { q: string; a: string }[] }) {
  return (
    <div className={styles.faqList}>
      {faqs.map((faq, i) => (
        <details key={i} className={styles.faqItem} open={i === 0}>
          <summary>{faq.q}</summary>
          <p>{faq.a}</p>
        </details>
      ))}
    </div>
  );
}
