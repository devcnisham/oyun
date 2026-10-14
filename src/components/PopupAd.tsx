'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { canOptimize } from '@/lib/images';
import styles from './PopupAd.module.css';
import type { PromoCard } from '@/lib/types';

const SEEN_KEY = 'oyun_popup_seen';

// Headline offer shown once per visit on the home page: a centred card on desktop, a bottom sheet on phones
export default function PopupAd({ promos }: { promos: PromoCard[] }) {
  const [visible, setVisible] = useState(false);
  // First promo is the headline giveaway
  const promo = promos[0] ?? null;

  useEffect(() => {
    if (!promo) return;
    const timer = setTimeout(() => {
      // Storage can throw in private mode; then just show it
      try {
        if (sessionStorage.getItem(SEEN_KEY) === promo.id) return;
        sessionStorage.setItem(SEEN_KEY, promo.id);
      } catch {}
      setVisible(true);
    }, 900);
    return () => clearTimeout(timer);
  }, [promo]);

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setVisible(false);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [visible]);

  if (!visible || !promo) return null;

  const close = () => setVisible(false);

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && close()}>
      <div className={styles.popup} role="dialog" aria-modal="true" aria-labelledby="popup-ad-title">
        <span className={styles.grabber} aria-hidden />
        <button type="button" onClick={close} className={styles.closeBtn} aria-label="Close offer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
        <div className={styles.imageContainer}>
          <Image src={promo.image} alt={promo.title} fill sizes="(max-width: 600px) 100vw, 460px" className={styles.image} loading="eager" fetchPriority="high" unoptimized={!canOptimize(promo.image)} />
          <span className={styles.tag}>Offer</span>
        </div>
        <div className={styles.content}>
          <h2 id="popup-ad-title" className={styles.title}>{promo.title}</h2>
          <p className={styles.subtitle}>{promo.subtitle}</p>
          <Link href="/arenas" className={styles.actionBtn} onClick={close}>Book a turf</Link>
          <button type="button" className={styles.laterBtn} onClick={close}>Maybe later</button>
        </div>
      </div>
    </div>
  );
}
