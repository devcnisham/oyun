'use client';

import { useEffect, useState } from 'react';
import { getStudentInfo, type StudentInfo } from '@/lib/student-actions';
import { STUDENT_ID_MAX_BYTES, studentIdFileError } from '@/lib/student-id';
import styles from './BookingFlow.module.css';

/**
 * Checkout box for the student offer. Shows nothing unless the offer is on and the phone number is complete.
 * A player sends a photo of their student ID once; an admin approves it, and the discount then shows in the bill.
 */
export default function StudentIdBox({ name, phone }: { name: string; phone: string }) {
  const digits = phone.replace(/\D/g, '').slice(-10);
  const [info, setInfo] = useState<StudentInfo | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (digits.length !== 10) return;
    let cancelled = false;
    getStudentInfo(digits)
      .then((next) => !cancelled && setInfo(next))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [digits]);

  if (digits.length !== 10 || !info?.offerActive) return null;
  const status = sent ? 'pending' : info.status;

  const send = async () => {
    if (!file) return setMessage('Choose a photo of your student ID first');
    const problem = studentIdFileError(file);
    if (problem) return setMessage(problem);
    if (!name.trim()) return setMessage('Enter your name above first');
    setBusy(true);
    setMessage(null);
    try {
      const body = new FormData();
      body.set('file', file);
      body.set('name', name.trim());
      body.set('phone', digits);
      const res = await fetch('/api/student-id', { method: 'POST', body });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) setMessage(data.error ?? 'Could not send your ID. Please try again.');
      else setSent(true);
    } catch {
      setMessage('Could not send your ID. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-label="Student offer">
      <h3>🎓 {info.title}: {info.percentOff}% off</h3>
      {status === 'approved' ? (
        <p className={styles.muted}>Your student ID is approved. The discount is in your bill.</p>
      ) : status === 'pending' ? (
        <p className={styles.muted}>Your student ID is waiting for review. Once it is approved the discount applies to your bookings. You can keep booking at the normal price in the meantime.</p>
      ) : (
        <>
          <p className={styles.muted}>
            {status === 'rejected' && info.note ? `${info.note} ` : ''}
            Send a clear photo of your student ID (JPEG, PNG or WebP, up to {STUDENT_ID_MAX_BYTES / 1024 / 1024} MB). We use it only to check you are a student and delete it once we decide.
          </p>
          <input type="file" accept="image/jpeg,image/png,image/webp" aria-label="Student ID photo" onChange={(e) => setFile(e.target.files?.[0] ?? null)} disabled={busy} />
          <button type="button" className={styles.input} onClick={send} disabled={busy || !file} style={{ marginTop: 8, cursor: 'pointer', fontWeight: 700 }}>
            {busy ? 'Sending…' : 'Send student ID'}
          </button>
          {message && <p role="alert" style={{ color: '#b91c1c', fontSize: 13, marginTop: 6 }}>{message}</p>}
        </>
      )}
    </section>
  );
}
