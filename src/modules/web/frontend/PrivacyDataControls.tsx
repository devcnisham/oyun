'use client';

import { useState } from 'react';
import { signOutDevice } from '@/modules/web/frontend/hooks/device';
import styles from '@/modules/web/frontend/PrivacyDataControls.module.css';

// Export and erasure act on the signed-in account. The server reads the account from the session, so no
// phone number is asked for or sent: a typed number would let anyone reach another person's data.
export default function PrivacyDataControls() {
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch('/api/privacy/export', { cache: 'no-store' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Could not download your data');
      }
      const url = URL.createObjectURL(await res.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = 'oyun-data-export.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setStatus({ type: 'error', message: err instanceof Error ? err.message : 'Could not download your data' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your personal data? Your player account and reviews will be removed, and all past booking records will be permanently scrubbed of your personal details (pursuant to India DPDP Act 2023).'
    );
    if (!confirmed) return;

    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch('/api/privacy/delete', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to erase data');

      signOutDevice();
      setStatus({
        type: 'success',
        message: 'Your personal data has been erased successfully and past booking records anonymized.',
      });
    } catch (err) {
      setStatus({ type: 'error', message: err instanceof Error ? err.message : 'Failed to erase data' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <p className={styles.description}>
        Under India&apos;s Digital Personal Data Protection Act, 2023 (DPDP), you can download a copy of the data
        linked to your account or request immediate erasure of your personal data. You need to be signed in.
      </p>

      <div className={styles.buttonRow}>
        <button type="button" onClick={handleExport} className={styles.primaryBtn} disabled={loading}>
          ⬇️ Download my data (JSON)
        </button>

        <button type="button" onClick={handleDelete} className={styles.dangerBtn} disabled={loading}>
          🗑️ Erase my personal data
        </button>
      </div>

      {status && (
        <div
          className={`${styles.notice} ${status.type === 'success' ? styles.noticeSuccess : styles.noticeError}`}
          role="alert"
        >
          {status.message}
        </div>
      )}
    </div>
  );
}
