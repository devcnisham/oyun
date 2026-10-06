import Link from 'next/link';
import styles from './StatusPage.module.css';

// Shared layout for the 404 and error screens
export default function StatusPage({ code, title, message, children }: { code: string; title: string; message: string; children?: React.ReactNode }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.ball} aria-hidden>⚽</div>
        <p className={styles.code}>{code}</p>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          {children ?? (
            <>
              <Link href="/arenas" className={styles.primary}>Find a turf</Link>
              <Link href="/" className={styles.secondary}>Go home</Link>
            </>
          )}
        </div>
        <nav className={styles.links} aria-label="Popular pages">
          <Link href="/arenas">All turfs</Link>
          <Link href="/bookings">My bookings</Link>
          <Link href="/faq">Help &amp; FAQ</Link>
          <Link href="/list-turf">List your turf</Link>
        </nav>
      </div>
    </div>
  );
}
