import Link from 'next/link';
import styles from './OwnerIntroduction.module.css';

const benefits = [
  ['Get discovered', 'Put your venue in front of players searching for their next game.'],
  ['Own your calendar', 'Manage available hours, block slots and keep bookings together.'],
  ['Welcome your players', 'Check in confirmed bookings using the ticket QR at your venue.'],
];
export default function OwnerIntroduction() {
  return <>
    <section className={styles.hero} aria-labelledby="owner-title">
      <div className={styles.copy}><p className={styles.eyebrow}>OYUN for venue owners</p><h1 id="owner-title">Your ground.<br />Their next<br /><span>great game.</span></h1><p className={styles.lead}>Bring your venue to OYUN.<br />Give players a place to find you, book and play.</p><div className={styles.actions}><a href="#list-form" className={styles.primary}>List your venue</a><Link href="/partner/login" className={styles.secondary}>Partner sign in</Link></div><p className={styles.note}>Football · Box cricket · Badminton · Pickleball</p></div>
      <div className={styles.board} aria-label="Illustration of partner booking tools">
        <div className={styles.boardHead}><b>OYUN <span>PARTNER</span></b><span className={styles.preview}>Product preview</span></div>
        <div className={styles.boardBody}><div className={styles.boardTitle}><h2>A clearer view<br />of your day.</h2><span className={styles.live}>Your calendar</span></div><div className={styles.calendar} aria-hidden="true">{['MON', 'TUE', 'WED', 'THU', 'FRI'].map((day, i) => <div key={day}><span>{day}</span>{[0, 1, 2, 3].map(row => <i key={row} className={(i + row) % 3 === 0 ? styles.booked : (i + row) % 4 === 0 ? styles.blocked : styles.available} />)}</div>)}</div><div className={styles.legend}><span><i className={styles.booked} />Booked</span><span><i className={styles.available} />Available</span><span><i className={styles.blocked} />Blocked</span></div><div className={styles.ticket}><span className={styles.check}>✓</span><div><b>From booking to check-in</b><p>One place to manage the game.</p></div></div></div>
      </div>
    </section>
    <section className={styles.benefits} aria-label="Partner tools">{benefits.map(([title, text], i) => <article key={title}><span className={styles.benefitIcon} aria-hidden="true">{['⌕', '◷', '✓'][i]}</span><h2>{title}</h2><p>{text}</p></article>)}</section>
    <section className={styles.process}><div><p className={styles.eyebrow}>Let’s get you listed</p><h2>A few details.<br />A new way to book.</h2></div><ol><li><b>Tell us about your venue</b><span>Share your contact details, facilities and pricing below.</span></li><li><b>We review your application</b><span>The OYUN team will get in touch about the next steps.</span></li><li><b>Get ready for your players</b><span>Once approved, manage your venue from the partner dashboard.</span></li></ol></section>
  </>;
}
