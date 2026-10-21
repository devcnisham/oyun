'use client';

import { useEffect } from 'react';
import { CONSENT_EVENT, readConsent } from '@/components/consent/consent';
import { ATTRIBUTION_COOKIE, ATTRIBUTION_DAYS, encodeAttribution, parseAttribution } from '@/lib/attribution';

const PENDING = 'oyun_src_pending';
const hasCookie = () => document.cookie.split('; ').some((c) => c.startsWith(`${ATTRIBUTION_COOKIE}=`));

// Remembers where a visitor first came from so a booking can record it. It is an analytics choice: the first visit is held
// in this tab only (sessionStorage) and becomes a first-party cookie, labels only, once the visitor accepts analytics.
export default function AttributionCapture() {
  useEffect(() => {
    const save = () => {
      try {
        const consent = readConsent();
        if (consent === 'essential') {
          document.cookie = `${ATTRIBUTION_COOKIE}=; Max-Age=0; Path=/`; // consent withdrawn
          sessionStorage.removeItem(PENDING);
          return;
        }
        if (hasCookie()) return;
        if (!sessionStorage.getItem(PENDING)) {
          const a = parseAttribution(location.pathname, new URLSearchParams(location.search), document.referrer, location.hostname);
          sessionStorage.setItem(PENDING, encodeAttribution(a));
        }
        if (consent === 'all') {
          document.cookie = `${ATTRIBUTION_COOKIE}=${sessionStorage.getItem(PENDING)}; Max-Age=${ATTRIBUTION_DAYS * 86400}; Path=/; SameSite=Lax; Secure`;
          sessionStorage.removeItem(PENDING);
        }
      } catch {}
    };
    save();
    window.addEventListener(CONSENT_EVENT, save);
    return () => window.removeEventListener(CONSENT_EVENT, save);
  }, []);
  return null;
}
