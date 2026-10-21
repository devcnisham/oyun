import { IconPlus } from '../_ui/icons';
import Reveal from '../_ui/Reveal';
import styles from './sections.module.css';

const FAQ = [
  { q: 'What is OYUN?', a: 'OYUN is a turf and court booking platform for Mangalore. You see open slots, hold the hours you want and get a ticket, instead of calling around.' },
  { q: 'Which sports can I book?', a: 'Football and box cricket turfs, plus badminton and pickleball courts. More venues are joining before launch.' },
  { q: 'How does booking work?', a: 'Pick a turf, a day and your hours. Your slots are held for 8 minutes while you sign in and confirm. A small advance is paid when you book and the rest at the venue.' },
  { q: 'Can I cancel a booking?', a: 'Yes. You can cancel from your ticket up to 2 hours before the slot starts.' },
  { q: 'I run a turf. How do I get listed?', a: 'Write to us with your venue details. We review each turf, and once it is approved you get a partner login with your calendar, bookings and check-in tools.' },
  { q: 'When can I start booking?', a: 'Booking opens at launch. The launch countdown page shows exactly when.' },
];

export default function Faq() {
  return (
    <section id="faq" className={`${styles.section} ${styles.paper}`} aria-labelledby="faq-title">
      <div className={`${styles.wrap} ${styles.faqGrid}`}>
        <Reveal>
          <p className={`${styles.eyebrow} ${styles.eyebrowDark}`}>Questions</p>
          <h2 id="faq-title" className={`${styles.display} ${styles.displayDark}`}>Quick<br />answers.</h2>
          <p className={styles.ledeDark}>More guides and rules live in the <a className={styles.inlineLink} href="/help">help centre</a>.</p>
        </Reveal>
        <div className={styles.faqList}>
          {FAQ.map((f, i) => (
            <details key={f.q} className={styles.faqItem} {...(i === 0 ? { open: true } : {})}>
              <summary className={styles.faqQ}>
                <span>{f.q}</span>
                <span className={styles.faqPlus}><IconPlus /></span>
              </summary>
              <p className={styles.faqA}>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
