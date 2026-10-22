import styles from './PhoneDemo.module.css';

export interface DemoTurf { name: string; area: string; price: number }

const SLOTS = ['6 PM', '7 PM', '8 PM', '9 PM', '10 PM', '11 PM'];

// A phone drawn in markup and CSS: three real screens of the app on a loop (browse, pick an hour, booked).
// No script and no images, so it costs nothing to load; reduced motion shows the first screen still.
export default function PhoneDemo({ turfs, className = '' }: { turfs: DemoTurf[]; className?: string }) {
  const rows = turfs.slice(0, 3);
  const pick = rows[0];
  return (
    <div className={`${styles.phone} ${className}`} role="img" aria-label="OYUN app: browse turfs, pick an hour, get a booking confirmation">
      <div className={styles.notch} aria-hidden />
      <div className={styles.screens} aria-hidden>
        <section className={`${styles.screen} ${styles.s1}`}>
          <header className={styles.head}>
            <b>Mangalore</b>
            <small>{turfs.length} venues live</small>
          </header>
          <div className={styles.search}>Search turfs</div>
          <ul className={styles.list}>
            {rows.map((t, i) => (
              <li key={t.name} className={styles.row} style={{ ['--i' as string]: i }}>
                <span className={styles.thumb} />
                <span className={styles.rowText}>
                  <b>{t.name}</b>
                  <small>{t.area}</small>
                </span>
                <span className={styles.price}>₹{t.price}<i>/hr</i></span>
              </li>
            ))}
          </ul>
        </section>

        <section className={`${styles.screen} ${styles.s2}`}>
          <header className={styles.head}>
            <b>{pick?.name ?? 'Pick your hour'}</b>
            <small>{pick?.area ?? 'Today'}</small>
          </header>
          <p className={styles.label}>Pick your slots</p>
          <div className={styles.grid}>
            {SLOTS.map((s, i) => (
              <span key={s} className={`${styles.slot} ${i === 1 || i === 2 ? styles.slotPick : ''}`} style={{ ['--i' as string]: i }}>{s}</span>
            ))}
          </div>
          <span className={styles.cta}>Proceed · ₹{(pick?.price ?? 1000) * 2}</span>
        </section>

        <section className={`${styles.screen} ${styles.s3}`}>
          <svg className={styles.check} width="64" height="64" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="30" />
            <path d="m19 33 9 9 17-19" />
          </svg>
          <b className={styles.done}>You are booked</b>
          <small className={styles.doneSub}>{pick?.name ?? 'Your turf'} · 7 PM to 9 PM</small>
          <span className={styles.ticket}>Show the QR at the gate. Pay at the venue.</span>
        </section>
      </div>
      <div className={styles.dots} aria-hidden>
        <i /><i /><i />
      </div>
    </div>
  );
}
