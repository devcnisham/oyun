import styles from './OyunMotion.module.css';

export function OyunLoader({ label = 'Getting ready', compact = false }: { label?: string; compact?: boolean }) {
  return <div className={`${styles.loader} ${compact ? styles.compact : ''}`} role="status" aria-live="polite">
    <span className={styles.word} data-oyun-wordmark aria-hidden="true">
      {'OYUN'.split('').map((letter, index) => <span key={letter} className={styles.letter} style={{ animationDelay: `${index * 110}ms` }}>{letter}</span>)}
    </span>
    <span className={styles.label}>{label}</span>
  </div>;
}

export function ConfirmationMark() {
  return <span className={styles.confirmation} aria-hidden="true"><svg viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="17" /><path d="m12 20 6 6 11-12" /></svg></span>;
}
