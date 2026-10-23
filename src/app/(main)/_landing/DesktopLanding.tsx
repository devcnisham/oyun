import Link from 'next/link';
import Reveal from '../../(launch)/_ui/Reveal';
import { SITE_CITY } from '@/modules/web/lib/site';
import PhoneDemo, { type DemoTurf } from './PhoneDemo';
import styles from './DesktopLanding.module.css';

const STEPS = [
  { n: 'Pick', t: 'Choose your turf', d: 'Football, box cricket, badminton and pickleball venues, with live open hours and prices.' },
  { n: 'Hold', t: 'Lock your hour', d: 'Your slot is held while you pay, so nobody else can book it from under you.' },
  { n: 'Play', t: 'Show your QR', d: 'Walk in with the QR on your phone. Pay at the venue. Rain? The venue refunds under OYUN policy.' },
];

// What people see on a computer: what OYUN is, a demo of the app, and a QR code that opens the phone site.
// Booking itself lives on the phone, so the QR is the main call to action.
export default function DesktopLanding({ title, qr, turfs }: { title: string; qr: string; turfs: DemoTurf[] }) {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={`container ${styles.heroGrid}`}>
          <div className={styles.copy}>
            <p className={styles.eyebrow}>Turf and court booking app</p>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.lead}>
              OYUN shows you which sports venues are free right now, holds your hour while you pay, and gives you a QR to walk in with.
              Built for your phone, live in {SITE_CITY} and coming to more cities across India.
            </p>
            <div className={styles.scan}>
              <div className={styles.qr} dangerouslySetInnerHTML={{ __html: qr }} role="img" aria-label="QR code that opens OYUN on your phone" />
              <div className={styles.scanText}>
                <b>Scan to book on your phone</b>
                <span>Point your camera at the code, or open <strong>oyun.co.in</strong> on your phone.</span>
              </div>
            </div>
          </div>
          <div className={styles.demo}>
            <PhoneDemo turfs={turfs} />
          </div>
        </div>
      </section>

      <section className={`container ${styles.steps}`} aria-labelledby="how">
        <h2 id="how" className={styles.h2}>Three taps from free hour to game on</h2>
        <ol className={styles.stepList}>
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.n} delay={i * 90} className={styles.step}>
              <span className={styles.stepN}>{s.n}</span>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className={styles.owners}>
        <div className={`container ${styles.ownersInner}`}>
          <div>
            <h2 className={styles.h2Light}>Own a turf or court?</h2>
            <p>List it on OYUN for free and take online bookings. Owners manage everything from a computer.</p>
          </div>
          <Link href="/list-turf" className={styles.ownerBtn}>List your property</Link>
        </div>
      </section>
    </div>
  );
}
