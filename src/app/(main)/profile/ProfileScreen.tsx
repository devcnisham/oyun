'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getProfile, saveProfile, signOutDevice } from '@/lib/client/device';
import { openConsentSettings } from '@/components/consent/consent';
import { clerkEnabled } from '@/lib/clerk';
import AccountCard from './AccountCard';
import ProfileIcon from './ProfileIcon';
import ProfileMenu from './ProfileMenu';
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

      <div className={styles.layout}>
        <aside className={styles.side}>
          {clerkEnabled ? (
            <AccountCard />
          ) : !loaded ? (
            <div className={styles.card} aria-busy="true" style={{ minHeight: 160 }} />
          ) : signedIn ? (
            <section className={styles.card}>
              <div className={styles.who}>
                <div className={styles.avatar} aria-hidden>{name.trim().charAt(0).toUpperCase() || 'P'}</div>
                <div className={styles.whoText}>
                  <b>{name.trim() || 'Player'}</b>
                  {phone && <span>+91 {phone.replace(/(\d{5})(\d{5})/, '$1 $2')}</span>}
                </div>
              </div>

              {editing ? (
                <form className={styles.editForm} onSubmit={saveName}>
                  <label htmlFor="profile-name">Name</label>
                  <input id="profile-name" className={styles.input} value={draftName} onChange={(e) => setDraftName(e.target.value)} maxLength={80} autoComplete="name" autoFocus />
                  {error && <p className={styles.error} role="alert">{error}</p>}
                  <div className={styles.editActions}>
                    <button type="button" className={styles.ghostBtn} onClick={() => { setEditing(false); setError(''); }}>Cancel</button>
                    <button type="submit" className={styles.primaryBtn}>Save</button>
                  </div>
                </form>
              ) : (
                <div className={styles.cardActions}>
                  <button type="button" className={styles.ghostBtn} onClick={() => { setDraftName(name); setEditing(true); }}>
                    <ProfileIcon name="user" />Edit name
                  </button>
                  <button
                    type="button"
                    className={styles.ghostBtn}
                    onClick={() => {
                      signOutDevice();
                      setName('');
                      setPhone('');
                      setEditing(false);
                    }}
                  >
                    <ProfileIcon name="logout" />Sign out
                  </button>
                </div>
              )}
            </section>
          ) : (
            <section className={`${styles.card} ${styles.signInCard}`}>
              <div className={styles.signInIcon} aria-hidden><ProfileIcon name="user" /></div>
              <h2>Sign in to OYUN</h2>
              <p>Book in a tap, with your details filled in for you.</p>
              <div className={styles.authRow}>
                <Link href="/login?redirect_url=/profile" className={styles.primaryBtn}>Sign in</Link>
                <Link href="/signup?redirect_url=/profile" className={styles.ghostBtn}>Create account</Link>
              </div>
            </section>
          )}
        </aside>

        <div className={styles.groups}>
          <ProfileMenu
            title="Book"
            items={[
              { icon: 'ticket', label: 'My bookings', note: 'Tickets and past games', href: '/bookings' },
              { icon: 'heart', label: 'Saved turfs', note: 'Your shortlist', href: '/saved' },
              { icon: 'pitch', label: 'All turfs', note: 'Browse every turf and court', href: '/arenas' },
            ]}
          />
          <ProfileMenu
            title="Help and settings"
            items={[
              { icon: 'help', label: 'Help center', note: 'Answers to common questions', href: '/help' },
              { icon: 'gear', label: 'Settings', note: 'Your preferences', href: '/settings' },
              { icon: 'mail', label: 'Contact support', note: supportEmail, href: `mailto:${supportEmail}`, external: true },
              { icon: 'shield', label: 'Cookie settings', note: 'Choose what we may use', onClick: openConsentSettings },
            ]}
          />
          <ProfileMenu
            title="Turf owners"
            items={[
              { icon: 'briefcase', label: 'List your turf', note: 'Get more bookings', href: '/list-turf' },
              { icon: 'key', label: 'Partner login', note: 'Manage your turf', href: '/partner/login' },
            ]}
          />
          <p className={styles.legal}>
            <Link href="/terms">Terms</Link>
            <span aria-hidden>·</span>
            <Link href="/privacy">Privacy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
