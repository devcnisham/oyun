import styles from './sections.module.css';

// Two oversized ribbons of type between the hero and the story: the games on top, the neighbourhoods underneath.
const GAMES = ['Football', 'Box cricket', 'Badminton', 'Pickleball'];
const AREAS = ['Kodialbail', 'Kankanady', 'Bejai', 'Kadri', 'Ullal'];

function Row({ words, reverse, outline }: { words: string[]; reverse?: boolean; outline?: boolean }) {
  const run = [...words, ...words];
  return (
    <div className={`${styles.ribbonRow} ${reverse ? styles.ribbonReverse : ''}`} aria-hidden="true">
      {[0, 1].map((copy) => (
        <div key={copy} className={styles.ribbonTrack}>
          {run.map((w, i) => (
            <span key={`${copy}-${i}`} className={`${styles.ribbonWord} ${outline ? styles.ribbonOutline : i % 2 ? styles.ribbonOutline : ''}`}>
              {w}
              <i className={styles.ribbonSlash}>/</i>
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function Ribbon() {
  return (
    <section className={styles.ribbon} aria-label="Games and neighbourhoods">
      <p className="sr-only">Football, box cricket, badminton and pickleball, across {AREAS.join(', ')} and more of Mangalore.</p>
      <Row words={GAMES} />
      <Row words={AREAS} reverse outline />
    </section>
  );
}
