'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getProfile, saveProfile } from '@/lib/client/device';
import styles from '../auth.module.css';

const PHONE_RE = /^[6-9]\d{9}$/;

// Only same-site paths, never another origin
function safeRedirect(target?: string) {
  return target && target.startsWith('/') && !target.startsWith('//') ? target : '/';
}

// Sign in / sign up without third-party accounts: the player's name and number are kept on this device
// and filled in at checkout. Clerk replaces this form once its keys are set.
export default function PlayerForm({ mode, redirectTo, onDone }: { mode: 'login' | 'signup'; redirectTo?: string; onDone?: () => void }) {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [agree, setAgree] = useState(false);
  const [askName, setAskName] = useState(mode === 'signup');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = getProfile();
    queueMicrotask(() => {
      if (saved.phone) setPhone(saved.phone);
      if (saved.name) setName(saved.name);
    });
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const digits = phone.replace(/\D/g, '').slice(-10);
    if (!PHONE_RE.test(digits)) return setError('Enter a valid 10-digit mobile number.');

    const saved = getProfile();
    const known = saved.phone === digits && saved.name.trim().length > 0;

    // Signing in with a number this device hasn't seen: ask for a name once, like a quick sign-up
    if (mode === 'login' && !known && !askName) {
      setAskName(true);
      queueMicrotask(() => nameRef.current?.focus());
      return;
    }

    const finalName = known && mode === 'login' ? saved.name : name.trim();
    if (finalName.length < 2) return setError('Enter your name (at least 2 letters).');
    if (mode === 'signup' && !agree) return setError('Please accept the Terms and Privacy Policy.');

    saveProfile({ name: finalName.slice(0, 80), phone: digits });
    if (onDone) return onDone();
    setBusy(true);
    router.replace(safeRedirect(redirectTo));
    router.refresh();
  };

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <div className={styles.field}>
        <label htmlFor="auth-phone">Mobile number</label>
        <div className={styles.phoneWrap}>
          <span className={styles.prefix}>+91</span>
          <input
            id="auth-phone"
            className={styles.input}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="98765 43210"
            maxLength={14}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^\d\s]/g, ''))}
            autoFocus
            required
          />
        </div>
      </div>

      {askName && (
        <div className={styles.field}>
          <label htmlFor="auth-name">{mode === 'login' ? 'Looks like you’re new here. Your name?' : 'Full name'}</label>
          <input
            id="auth-name"
            ref={nameRef}
            className={styles.input}
            type="text"
            autoComplete="name"
            placeholder="Your name"
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
      )}

      {mode === 'signup' && (
        <label className={styles.check}>
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <span>I agree to the <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link></span>
        </label>
      )}

      {error && <p className={styles.error} role="alert">{error}</p>}

      <button type="submit" className={styles.submitBtn} disabled={busy}>
        {busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Continue'}
      </button>

      <p className={styles.note}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
        Your details stay on this device and fill in automatically when you book.
      </p>
    </form>
  );
}
