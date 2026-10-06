'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { canOptimize } from '@/lib/images';
import styles from './PopupAd.module.css';
import type { PromoCard } from '@/lib/types';

export default function PopupAd({ promos }: { promos: PromoCard[] }) {
  const [visible, setVisible] = useState(false);
  // First promo is the headline giveaway
  const promo = promos[0] ?? null;

  useEffect(() => {
    if (!promo) return;
    const timer = setTimeout(() => {
      // Only once per browser session; storage can throw in private mode
      try {
        if (sessionStorage.getItem('oyun_popup_seen')) return;
        sessionStorage.setItem('oyun_popup_seen', '1');
      } catch {}
      setVisible(true);
    }, 500);
    return () => clearTimeout(timer);
  }, [promo]);

  const handleClose = () => {
    setVisible(false);
  };

  if (!visible || !promo) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <button onClick={handleClose} className={styles.closeBtn} aria-label="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div className={styles.imageContainer}>
          <Image src={promo.image} alt={promo.title} fill sizes="(max-width: 600px) 100vw, 480px" className={styles.image} style={{ objectFit: 'cover' }} unoptimized={!canOptimize(promo.image)} />
        </div>
        <div className={styles.content}>
          <h3 className={styles.title}>{promo.title}</h3>
          <p className={styles.subtitle}>{promo.subtitle}</p>
          <button onClick={handleClose} className={styles.actionBtn}>Claim Offer</button>
        </div>
      </div>
    </div>
  );
}
