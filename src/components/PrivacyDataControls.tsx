'use client';

import { useState, useEffect } from 'react';
import { getProfile, signOutDevice } from '@/lib/client/device';
import styles from './PrivacyDataControls.module.css';

export default function PrivacyDataControls() {
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const p = getProfile();
    if (p.phone) {
      queueMicrotask(() => {
        setPhone(p.phone);
      });
    }
  }, []);

  const handleExport = () => {
    const cleaned = phone.replace(/\D/g, '').slice(-10);
    if (cleaned.length !== 10) {
      setStatus({ type: 'error', message: 'Please enter a valid 10-digit mobile number to export data.' });
      return;
    }
    setStatus(null);
    const link = document.createElement('a');
    link.href = `/api/privacy/export?phone=${encodeURIComponent(cleaned)}`;
    link.download = `oyun-data-export-${cleaned}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async () => {
    const cleaned = phone.replace(/\D/g, '').slice(-10);
    if (cleaned.length !== 10) {
      setStatus({ type: 'error', message: 'Please enter a valid 10-digit mobile number to delete data.' });
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete your personal data? Your player account and reviews will be removed, and all past booking records will be permanently scrubbed of your personal details (pursuant to India DPDP Act 2023).'
    );

    if (!confirmed) return;

    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch('/api/privacy/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleaned }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to erase data');
      }

      signOutDevice();
      setPhone('');
      setStatus({
        type: 'success',
        message: 'Your personal data has been erased successfully and past booking records anonymized.',
      });
    } catch (err) {
      setStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to erase data',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <p className={styles.description}>
        Under India&apos;s Digital Personal Data Protection Act, 2023 (DPDP), you can download a copy of all
        data linked to your phone number or request immediate erasure of your personal data.
      </p>

      <div className={styles.formGroup}>
        <label htmlFor="dpdp-phone" className={styles.label}>
          Mobile number
        </label>
        <input
          id="dpdp-phone"
          type="tel"
          className={styles.input}
          placeholder="10-digit mobile number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          maxLength={15}
        />
      </div>

      <div className={styles.buttonRow}>
        <button
          type="button"
          onClick={handleExport}
          className={styles.primaryBtn}
          disabled={loading}
        >
          ⬇️ Download my data (JSON)
        </button>

        <button
          type="button"
          onClick={handleDelete}
          className={styles.dangerBtn}
          disabled={loading}
        >
          🗑️ Erase my personal data
        </button>
      </div>

      {status && (
        <div
          className={`${styles.notice} ${
            status.type === 'success' ? styles.noticeSuccess : styles.noticeError
          }`}
          role="alert"
        >
          {status.message}
        </div>
      )}
    </div>
  );
}
