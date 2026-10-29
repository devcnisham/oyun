import styles from './OyunMotion.module.css';

export function OyunLoader({ label = 'Getting ready', compact = false }: { label?: string; compact?: boolean }) {
  return <div className={`${styles.loader} ${compact ? styles.compact : ''}`} role="status" aria-live="polite">
    <svg className={styles.word} viewBox="0 0 244 76" fill="none" aria-hidden="true">
      <path className={styles.letter} d="M51 38C51 56 44 66 29 66S7 56 7 38 14 10 29 10 51 20 51 38Z" />
      <path className={styles.letter} style={{ animationDelay: '120ms' }} d="m67 12 21 27 21-27M88 39v25" />
      <path className={styles.letter} style={{ animationDelay: '240ms' }} d="M127 12v32c0 15 7 22 21 22s21-7 21-22V12" />
      <path className={styles.letter} style={{ animationDelay: '360ms' }} d="M190 64V12l46 52V12" />
    </svg>
    <span className={styles.label}>{label}</span>
  </div>;
}

export function ConfirmationMark() {
  return <span className={styles.confirmation} aria-hidden="true"><svg viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="17" /><path d="m12 20 6 6 11-12" /></svg></span>;
}
