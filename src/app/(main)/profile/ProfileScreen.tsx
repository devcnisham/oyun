'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { clearDevice, getProfile, saveProfile } from '@/lib/client/device';
import styles from './Profile.module.css';

export default function ProfileScreen({ supportEmail, supportPhone }: { supportEmail: string; supportPhone: string }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const p = getProfile();
    queueMicrotask(() => {
      setName(p.name);
      setPhone(p.phone);
    });
  }, []);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    saveProfile({ name: name.trim(), phone: phone.replace(/\D/g, '').slice(-10) });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  const initial = name.trim().charAt(0).toUpperCase() || '👋';

  return (
    <div className={`container ${styles.page}`}>
      <div className={styles.hero}>
        <div className={styles.avatar}>{initial}</div>
        <div>
          <h1>{name.trim() || 'Hello, player'}</h1>
          <p>{phone ? `+91 ${phone.replace(/\D/g, '').slice(-10)}` : 'Save your details for faster checkout'}</p>
        </div>
      </div>

      <form className={styles.card} onSubmit={save}>
        <h2>Your details</h2>
        <p className={styles.hint}>Saved on this device and filled in when you book.</p>
        <input className={styles.input} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        <input className={styles.input} placeholder="10-digit mobile number" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
        <button className={styles.save} type="submit">{saved ? 'Saved ✓' : 'Save'}</button>
      </form>

      <nav className={styles.menu}>
        <Link href="/bookings"><span>📅</span>My bookings<i>›</i></Link>
        <Link href="/arenas"><span>🏟️</span>Explore turfs<i>›</i></Link>
        <Link href="/list-turf"><span>💼</span>List your turf<i>›</i></Link>
        <Link href="/partner/login"><span>🔑</span>Partner login<i>›</i></Link>
      </nav>

      <nav className={styles.menu}>
        <Link href="/faq"><span>❓</span>Help &amp; FAQ<i>›</i></Link>
        <a href={`mailto:${supportEmail}`}><span>✉️</span>{supportEmail}<i>›</i></a>
        <a href={`tel:${supportPhone.replace(/\s/g, '')}`}><span>📞</span>{supportPhone}<i>›</i></a>
        <Link href="/terms"><span>📄</span>Terms<i>›</i></Link>
        <Link href="/privacy"><span>🔒</span>Privacy<i>›</i></Link>
      </nav>

      <button
        className={styles.clear}
        onClick={() => {
          if (!window.confirm('Remove your saved details and booking list from this device?')) return;
          clearDevice();
          setName('');
          setPhone('');
        }}
      >
        Clear data on this device
      </button>
    </div>
  );
}
