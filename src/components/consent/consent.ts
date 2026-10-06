'use client';

// The visitor's cookie choice, stored in a first-party cookie for a year
export type Consent = 'all' | 'essential';
const COOKIE = 'oyun_consent';
export const CONSENT_EVENT = 'oyun:consent';

export function readConsent(): Consent | null {
  const match = document.cookie.match(/(?:^|; )oyun_consent=(all|essential)/);
  return (match?.[1] as Consent) ?? null;
}

export function writeConsent(value: Consent) {
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${COOKIE}=${value}; Max-Age=${60 * 60 * 24 * 365}; Path=/; SameSite=Lax${secure}`;
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
}

export function openConsentSettings() {
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: 'open' }));
}
