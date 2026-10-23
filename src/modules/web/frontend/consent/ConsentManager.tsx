'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { CONSENT_EVENT, readConsent, writeConsent, type Consent } from '@/modules/web/frontend/consent/consent';
import styles from '@/modules/web/frontend/consent/ConsentManager.module.css';

const ConsentAnalytics = dynamic(() => import('@/modules/web/frontend/consent/ConsentAnalytics'));

/*
 * Cookie banner + analytics. Nothing optional loads until the visitor picks "Accept all":
 * then Vercel Web Analytics, Speed Insights (Core Web Vitals) and, if NEXT_PUBLIC_GA_ID is set, Google Analytics 4.
 */
export default function ConsentManager() {
  const [consent, setConsent] = useState<Consent | null>(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? '/';
  const privateArea = pathname.startsWith('/admin') || pathname.startsWith('/partner');

  useEffect(() => {
    const saved = readConsent();
    queueMicrotask(() => {
      setConsent(saved);
      setOpen(saved === null);
    });
    const onEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail === 'open') setOpen(true);
      else {
        setConsent(detail as Consent);
        setOpen(false);
      }
    };
    window.addEventListener(CONSENT_EVENT, onEvent);
    return () => window.removeEventListener(CONSENT_EVENT, onEvent);
  }, []);

  const analytics = consent === 'all' && !privateArea;

  return (
    <>
      {analytics && <ConsentAnalytics />}

      {open && !privateArea && (
        <div className={styles.banner} role="dialog" aria-live="polite" aria-label="Cookie preferences">
          <div className={styles.inner}>
            <p>
              We use essential cookies to hold your slots and keep you signed in. With your OK we also use analytics to see what works and make OYUN faster.{' '}
              <Link href="/privacy">Privacy policy</Link>
            </p>
            <div className={styles.actions}>
              <button className={styles.secondary} onClick={() => writeConsent('essential')}>Essential only</button>
              <button className={styles.primary} onClick={() => writeConsent('all')}>Accept all</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
