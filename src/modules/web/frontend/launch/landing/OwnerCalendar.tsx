import styles from '@/app/(launch)/landing/landing.module.css';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ROWS = ['6 PM', '7 PM', '8 PM', '9 PM', '10 PM'];
// 0 open, 1 booked, 2 blocked by the owner
const GRID = [
  [0, 1, 0, 1, 1, 1, 1],
  [1, 1, 0, 1, 1, 1, 1],
  [1, 0, 2, 1, 1, 1, 0],
  [0, 0, 2, 0, 1, 1, 1],
  [0, 0, 0, 0, 1, 0, 0],
];
const LABEL = ['Open', 'Booked', 'Blocked'];

// A labelled sample of the partner calendar: booked hours, open hours and hours the owner blocked.
export default function OwnerCalendar() {
  return (
    <figure className={styles.cal}>
      <div className={styles.calGrid} role="img" aria-label="Sample week: most evening hours booked, a few open, two blocked for maintenance">
        <span />
        {DAYS.map((d) => <span key={d} className={styles.calHead}>{d}</span>)}
        {ROWS.map((r, y) => (
          <span key={r} className={styles.calRow} style={{ gridRow: y + 2 }}>{r}</span>
        ))}
        {GRID.flatMap((row, y) => row.map((c, x) => (
          <span key={`${x}-${y}`} className={`${styles.calCell} ${styles[`cal${LABEL[c]}`]}`} style={{ gridColumn: x + 2, gridRow: y + 2 }} />
        )))}
      </div>
      <figcaption className={styles.calCap}>
        <span><i className={`${styles.calKey} ${styles.calBooked}`} />Booked</span>
        <span><i className={`${styles.calKey} ${styles.calOpen}`} />Open</span>
        <span><i className={`${styles.calKey} ${styles.calBlocked}`} />Blocked</span>
        <span className={styles.calSample}>Sample calendar</span>
      </figcaption>
    </figure>
  );
}
