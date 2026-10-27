'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBookingSummaries } from '@/modules/web/backend/booking-actions';
import { useFavourites } from '@/modules/web/frontend/hooks/favourites';
import { getMyBookingIds, getProfile, saveProfile, signOutDevice } from '@/modules/web/frontend/hooks/device';
import { openConsentSettings } from '@/modules/web/frontend/consent/consent';
import { clerkEnabled } from '@/modules/shared/lib/clerk';
import AccountCard from '@/modules/web/frontend/main/profile/AccountCard';
import ProfileIcon from '@/modules/web/frontend/main/profile/ProfileIcon';
import ProfileMenu from '@/modules/web/frontend/main/profile/ProfileMenu';
import styles from '@/modules/web/frontend/main/profile/Account.module.css';

export default function ProfileScreen({ supportEmail, walletBalance, offerCount }: { supportEmail: string; walletBalance: number | null; offerCount: number }) {
  const { ids } = useFavourites();
  const [games, setGames] = useState<number | null>(null);
  useEffect(() => { getBookingSummaries(getMyBookingIds()).then(b => setGames(b.filter(x => x.status === 'checked_in').length)).catch(() => setGames(null)); }, []);
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
              <div className={styles.authRow}>
                <Link href="/login?redirect_url=/profile" className={styles.primaryBtn}>Sign in</Link>
                <Link href="/signup?redirect_url=/profile" className={styles.ghostBtn}>Create account</Link>
              </div>
            </section>
          )}
        </aside>

        <div className={styles.groups}>
          <div className={styles.stats}>
            <Link href="/bookings"><strong>{games ?? '—'}</strong><span>Games</span></Link>
            <Link href="/saved"><strong>{ids.length}</strong><span>Saved</span></Link>
            <Link href="/offers"><strong>{offerCount}</strong><span>Offers</span></Link>
          </div>
          <Link href="/membership" className={styles.wallet}><span>Wallet balance<strong>{walletBalance === null ? 'Sign in' : `₹${walletBalance.toLocaleString('en-IN')}`}</strong></span><ProfileIcon name="ticket" /></Link>
          <div className={styles.shortcuts}>
            <Link href="/matches"><ProfileIcon name="user" /><b>Play together</b></Link>
            <Link href="/tournaments"><ProfileIcon name="ticket" /><b>Tournaments</b></Link>
            <Link href="/offers"><ProfileIcon name="briefcase" /><b>Offers</b></Link>
            <Link href="/saved"><ProfileIcon name="heart" /><b>Saved venues</b></Link>
          </div>
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
            title="Venue owners"
            items={[
              { icon: 'briefcase', label: 'List your venue', note: 'Get more bookings', href: '/list-turf' },
              { icon: 'key', label: 'Partner login', note: 'Manage your venue', href: '/partner/login' },
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
