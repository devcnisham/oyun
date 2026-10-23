'use client';

import StatusPage from '@/modules/shared/frontend/status/StatusPage';
import styles from '@/modules/shared/frontend/status/StatusPage.module.css';
import Link from 'next/link';

// Shown when a page fails to render. The server error is already reported by instrumentation.ts.
export default function MainError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <StatusPage code="Error" title="Something went wrong" message={`We couldn't load this page. Please try again.${error.digest ? ` (ref ${error.digest})` : ''}`}>
      <button className={styles.primary} onClick={() => retry()}>Try again</button>
      <Link href="/" className={styles.secondary}>Go home</Link>
    </StatusPage>
  );
}
