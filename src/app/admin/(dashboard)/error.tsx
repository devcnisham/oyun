'use client';

import StatusPage from '@/components/status/StatusPage';
import styles from '@/components/status/StatusPage.module.css';
import Link from 'next/link';

export default function AdminDashboardError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <StatusPage code="Error" title="Dashboard Error" message={`Could not load this dashboard page. Please try again.${error.digest ? ` (ref ${error.digest})` : ''}`}>
      <button className={styles.primary} onClick={() => retry()}>Try again</button>
      <Link href="/admin" className={styles.secondary}>Admin Home</Link>
    </StatusPage>
  );
}
