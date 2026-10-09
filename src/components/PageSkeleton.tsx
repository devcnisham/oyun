import styles from './PageSkeleton.module.css';

// Shown by loading.tsx while a page's data loads. "cards" suits turf lists, "rows" suits tables and dashboards.
export default function PageSkeleton({ variant = 'rows' }: { variant?: 'cards' | 'rows' }) {
  return (
    <div className={styles.wrap} role="status" aria-busy="true">
      <span className={styles.sr}>Loading…</span>
      <div className={`${styles.block} ${styles.title}`} />
      <div className={`${styles.block} ${styles.line}`} />
      <div className={`${styles.block} ${styles.lineShort}`} />
      {variant === 'cards' ? (
        <div className={styles.grid}>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className={`${styles.block} ${styles.card}`} />
          ))}
        </div>
      ) : (
        Array.from({ length: 6 }, (_, i) => <div key={i} className={`${styles.block} ${styles.row}`} />)
      )}
    </div>
  );
}
