'use client';

import { useState } from 'react';
import styles from './MobileHome.module.css';

// Tap to copy the promo code, like a coupon in a shopping app
export default function CouponCard({ code, title, note }: { code: string; title: string; note: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={styles.coupon}
      onClick={() => {
        navigator.clipboard?.writeText(code).catch(() => {});
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      }}
      aria-label={`Copy promo code ${code}: ${title}`}
    >
      <span className={styles.couponTitle}>{title}</span>
      <span className={styles.couponNote}>{note}</span>
      <span className={styles.couponCode}>{copied ? 'Copied ✓' : code}</span>
    </button>
  );
}
