'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './DesktopGate.module.css';

// Booking happens on the phone. On a computer these pages stay in the page (search engines and link previews still read them),
// but a full-screen "scan to open on your phone" screen sits over them.
const GATED = ['/arenas', '/bookings', '/saved', '/profile', '/settings'];
const BYPASS_COOKIE = 'oyun_desktop';
const WIDE = '(min-width: 769px)';

const hasBypass = () => document.cookie.split('; ').some((c) => c === `${BYPASS_COOKIE}=1`);

export default function DesktopGate() {
  const path = usePathname() ?? '/';
  const gated = GATED.some((p) => path === p || path.startsWith(`${p}/`));
  const [bypass, setBypass] = useState(false);
  const [qr, setQr] = useState('');

  // ?desktop=1 turns the bypass on for this browser (staff and tests); it is not linked anywhere
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('desktop') === '1') {
      document.cookie = `${BYPASS_COOKIE}=1; path=/; max-age=31536000; samesite=lax`;
    }
    queueMicrotask(() => setBypass(hasBypass()));
  }, []);

  // The QR opens the page being looked at, so the phone lands where the computer was
  useEffect(() => {
    if (!gated || bypass) return;
    let live = true;
    import('qrcode').then((m) => {
      const url = new URL(window.location.href);
      url.searchParams.delete('desktop');
      return m.toString(url.toString(), { type: 'svg', margin: 1, width: 240, errorCorrectionLevel: 'M' });
    }).then((svg) => live && setQr(svg)).catch(() => {});
    return () => { live = false; };
  }, [gated, bypass, path]);

  const active = gated && !bypass;

  // While the screen is showing, the page behind it can not be reached with the keyboard or a screen reader
  useEffect(() => {
    const main = document.getElementById('main');
    if (!main) return;
    const mq = window.matchMedia(WIDE);
    const apply = () => {
      const on = active && mq.matches;
      main.toggleAttribute('inert', on);
      if (on) main.setAttribute('aria-hidden', 'true');
      else main.removeAttribute('aria-hidden');
    };
    apply();
    mq.addEventListener('change', apply);
    return () => {
      mq.removeEventListener('change', apply);
      main.removeAttribute('inert');
      main.removeAttribute('aria-hidden');
    };
  }, [active]);

  if (!active) return null;
  return (
    <div className={styles.gate} data-desktop-gate>
      <div className={styles.card}>
        <svg width="56" height="56" viewBox="0 0 40 40" fill="none" aria-hidden>
          <circle cx="20" cy="20" r="18" fill="url(#gateGrad)" />
          <path d="M 12 12 L 18 22 L 27 16 L 31 19" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <circle cx="32" cy="12" r="2.5" fill="white" />
          <defs>
            <linearGradient id="gateGrad" x1="4" y1="2" x2="36" y2="38" gradientUnits="userSpaceOnUse">
              <stop stopColor="#9E0A0A" />
              <stop offset="1" stopColor="#4A0000" />
            </linearGradient>
          </defs>
        </svg>
        <h2 className={styles.title}>Book on your phone</h2>
        <p className={styles.sub}>OYUN is made for your phone. Scan the code with your camera to open this page there.</p>
        <div className={styles.qr} role="img" aria-label="QR code that opens this page on your phone" dangerouslySetInnerHTML={{ __html: qr }} />
        <Link href="/" className={styles.home}>About OYUN</Link>
        <p className={styles.owners}>Own a turf? <Link href="/list-turf">List your property from your computer</Link></p>
      </div>
    </div>
  );
}
