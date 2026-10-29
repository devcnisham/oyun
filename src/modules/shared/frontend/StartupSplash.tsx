'use client';

import { useEffect, useState } from 'react';
import { OyunLoader } from './OyunMotion';
import styles from './StartupSplash.module.css';

/** Root layout persists during navigation; a new document gets a fresh brand intro. */
export default function StartupSplash() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => setVisible(false), reduced ? 250 : 1800);
    return () => window.clearTimeout(timer);
  }, []);
  if (!visible) return null;
  return <div className={styles.splash} data-startup-splash><OyunLoader label="Welcome to OYUN" /></div>;
}
