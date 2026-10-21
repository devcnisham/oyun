import styles from './landing.module.css';

// The hero picture: a turf's evening timetable. An illustration, not live data. Green is open, red is booked, the ringed
// cell is the slot held for you. Slots fill in one after another; with reduced motion it simply shows the finished board.
const HOURS = ['5', '6', '7', '8', '9', '10', '11'];
// o = open, b = booked, h = held for you
const ROWS: { name: string; cells: string }[] = [
  { name: 'Turf A', cells: 'bbboohb' },
  { name: 'Turf B', cells: 'obboobo' },
  { name: 'Court 1', cells: 'bobhbbo' },
  { name: 'Court 2', cells: 'ooboobb' },
];

export default function SlotBoard() {
  let n = 0;
  return (
    <figure className={styles.board}>
      <div className={styles.boardHead} aria-hidden="true">
        <span className={styles.boardTitle}>Tonight</span>
        <span className={styles.boardClock}>PM</span>
      </div>
      <div className={styles.boardGrid} aria-hidden="true">
        <span />
        {HOURS.map((h) => (
          <span key={h} className={styles.boardHour}>{h}</span>
        ))}
        {ROWS.map((r) => (
          <div key={r.name} className={styles.boardRow}>
            <span className={styles.boardName}>{r.name}</span>
            {r.cells.split('').map((c, i) => {
              const delay = c === 'o' ? 0 : n++ * 110 + 700;
              return <span key={i} className={`${styles.cell} ${c === 'b' ? styles.cellBooked : c === 'h' ? styles.cellHeld : styles.cellOpen}`} style={{ animationDelay: `${delay}ms` }} />;
            })}
          </div>
        ))}
      </div>
      <figcaption className={styles.boardLegend}>
        <span><i className={`${styles.dot} ${styles.dotOpen}`} aria-hidden="true" />Open</span>
        <span><i className={`${styles.dot} ${styles.dotBooked}`} aria-hidden="true" />Booked</span>
        <span><i className={`${styles.dot} ${styles.dotHeld}`} aria-hidden="true" />Held for you</span>
        <span className={styles.boardNote}>Illustration</span>
      </figcaption>
    </figure>
  );
}
