'use client';

import StatusPage from '@/modules/shared/frontend/status/StatusPage';
import styles from '@/modules/shared/frontend/status/StatusPage.module.css';
import Link from 'next/link';

// Root error boundary: catches unhandled page rendering errors across all routes
export default function RootError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <StatusPage code="Error" title="Something went wrong" message={`We couldn't load this page. Please try again.${error.digest ? ` (ref ${error.digest})` : ''}`}>
      <button className={styles.primary} onClick={() => retry()}>Try again</button>
      <Link href="/" className={styles.secondary}>Go home</Link>
    </StatusPage>
  );
}
