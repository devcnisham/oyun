'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getProfile, saveProfile, signOutDevice } from '@/lib/client/device';
import { openConsentSettings } from '@/components/consent/consent';
import { clerkEnabled } from '@/lib/clerk';
import AccountCard from './AccountCard';
import styles from './Account.module.css';

export default function ProfileScreen({ supportEmail }: { supportEmail: string }) {
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const p = getProfile();
    queueMicrotask(() => {
      setName(p.name);
      setPhone(p.phone);
      setLoaded(true);
    });
  }, []);

  const signedIn = Boolean(name.trim() || phone);

  const saveName = (e: React.FormEvent) => {
    e.preventDefault();
    const n = draftName.trim();
    if (n.length < 2) return setError('Enter at least 2 letters.');
    saveProfile({ name: n, phone });
    setName(n);
    setEditing(false);
    setError('');
  };

  return (
    <div className={`container ${styles.page}`}>
      <h1 className={styles.pageTitle}>Account</h1>

      {clerkEnabled ? (
        <AccountCard />
      ) : !loaded ? (
        <div className={styles.card} aria-busy="true" style={{ minHeight: 120 }} />
      ) : signedIn ? (
        <section className={styles.card}>
          <div className={styles.who}>
            <div className={styles.avatar} aria-hidden>{name.trim().charAt(0).toUpperCase() || '🙂'}</div>
            <div className={styles.whoText}>
              <b>{name.trim() || 'Player'}</b>
              {phone && <span>+91 {phone.replace(/(\d{5})(\d{5})/, '$1 $2')}</span>}
            </div>
            {!editing && (
              <button type="button" className={styles.linkBtn} onClick={() => { setDraftName(name); setEditing(true); }}>
                Edit
              </button>
            )}
          </div>

          {editing && (
            <form className={styles.editForm} onSubmit={saveName}>
              <label htmlFor="profile-name">Name</label>
              <input id="profile-name" className={styles.input} value={draftName} onChange={(e) => setDraftName(e.target.value)} maxLength={80} autoComplete="name" autoFocus />
              {error && <p className={styles.error} role="alert">{error}</p>}
              <div className={styles.editActions}>
                <button type="button" className={styles.ghostBtn} onClick={() => { setEditing(false); setError(''); }}>Cancel</button>
                <button type="submit" className={styles.primaryBtn}>Save</button>
              </div>
            </form>
          )}
        </section>
      ) : (
        <section className={`${styles.card} ${styles.signInCard}`}>
          <div className={styles.signInIcon} aria-hidden>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
          </div>
          <h2>Sign in to OYUN</h2>
          <p>Book in a tap, with your details filled in for you.</p>
          <div className={styles.authRow}>
            <Link href="/login?redirect_url=/profile" className={styles.primaryBtn}>Sign in</Link>
            <Link href="/signup?redirect_url=/profile" className={styles.ghostBtn}>Create account</Link>
          </div>
        </section>
      )}

      {/* Everything the old side menu held now lives here */}
      <h2 className={styles.menuTitle}>Book</h2>
      <nav className={styles.menu} aria-label="Book">
        <Link href="/bookings"><span aria-hidden>🎟️</span>My bookings<i aria-hidden>›</i></Link>
        <Link href="/saved"><span aria-hidden>♡</span>Saved turfs<i aria-hidden>›</i></Link>
        <Link href="/arenas"><span aria-hidden>🏟️</span>All turfs<i aria-hidden>›</i></Link>
      </nav>

      <h2 className={styles.menuTitle}>Help &amp; settings</h2>
      <nav className={styles.menu} aria-label="Help and settings">
        <Link href="/help"><span aria-hidden>❓</span>Help center<i aria-hidden>›</i></Link>
        <Link href="/settings"><span aria-hidden>⚙️</span>Settings<i aria-hidden>›</i></Link>
        <a href={`mailto:${supportEmail}`}><span aria-hidden>✉️</span>Contact support<i aria-hidden>›</i></a>
        <button type="button" onClick={openConsentSettings}><span aria-hidden>🍪</span>Cookie settings<i aria-hidden>›</i></button>
      </nav>

      <h2 className={styles.menuTitle}>Turf owners</h2>
      <nav className={styles.menu} aria-label="Turf owners">
        <Link href="/list-turf"><span aria-hidden>💼</span>List your turf<i aria-hidden>›</i></Link>
        <Link href="/partner/login"><span aria-hidden>🔑</span>Partner login<i aria-hidden>›</i></Link>
      </nav>

      <p className={styles.legal}>
        <Link href="/terms">Terms</Link>
        <span aria-hidden>·</span>
        <Link href="/privacy">Privacy</Link>
      </p>

      {!clerkEnabled && signedIn && (
        <button
          type="button"
          className={styles.signOut}
          onClick={() => {
            signOutDevice();
            setName('');
            setPhone('');
            setEditing(false);
          }}
        >
          Sign out
        </button>
      )}
    </div>
  );
}
