import QrArt from './QrArt';
import styles from './sections.module.css';

const QUIET = [
  'Book several hours in one checkout',
  'Add the slot to your calendar',
  'Save the turfs you play at',
  'Read player reviews before you book',
];

// The player features as three small working demos plus a list, not a grid of icon cards.
export default function Features() {
  return (
    <section className={`${styles.section} ${styles.night}`} aria-labelledby="features-title">
      <div className={`${styles.wrap} ${styles.featGrid}`}>
        <div className={styles.featIntro}>
          <p className={styles.eyebrow}>For players</p>
          <h2 id="features-title" className={styles.display}>Nobody has to<br /><span className={styles.redText}>call the turf.</span></h2>
          <ul className={styles.quiet}>
            {QUIET.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </div>

        <div className={styles.demos}>
          <article className={`${styles.demo} ${styles.demoHold}`}>
            <svg viewBox="0 0 120 120" className={styles.miniRing} aria-hidden="true">
              <circle cx="60" cy="60" r="50" className={styles.ringTrack} />
              <circle cx="60" cy="60" r="50" className={`${styles.ringFill} ${styles.ringLoop}`} pathLength="100" />
            </svg>
            <div>
              <h3 className={styles.demoTitle}>Held for 8 minutes</h3>
              <p className={styles.demoText}>Pick your hours and they are yours while you check out. If you step away, they open up again.</p>
            </div>
          </article>

          <article className={`${styles.demo} ${styles.demoTicket}`} tabIndex={0} aria-label="Your ticket. Hover or focus to flip.">
            <div className={styles.flip}>
              <div className={styles.flipFront}><b>Your ticket</b><span>QR inside</span></div>
              <div className={styles.flipBack}>
                <QrArt n={13} f={4} className={styles.qrSmall} />
              </div>
            </div>
            <div>
              <h3 className={styles.demoTitle}>A ticket for every booking</h3>
              <p className={styles.demoText}>Show it at the turf. Your bookings and history stay in one place.</p>
            </div>
          </article>

          <article className={`${styles.demo} ${styles.demoCancel}`}>
            <div className={styles.switchWrap} aria-hidden="true">
              <span className={styles.switchTrack}><i className={styles.switchKnob} /></span>
              <span className={styles.switchLabel}>Cancel</span>
            </div>
            <div>
              <h3 className={styles.demoTitle}>Plans change. Cancel yourself.</h3>
              <p className={styles.demoText}>Cancel from your ticket up to 2 hours before the slot, no calls needed.</p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
