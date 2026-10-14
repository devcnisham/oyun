'use client';

import { useSyncExternalStore, useCallback } from 'react';
import {
  DEFAULT_LOCALE,
  getStoredLocale,
  setStoredLocale as setStoredLocaleInternal,
  t as translateKey,
  Locale,
  LOCALES,
  LOCALE_EVENT,
  TranslationKey,
} from '@/lib/i18n';

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(LOCALE_EVENT, callback);
  return () => window.removeEventListener(LOCALE_EVENT, callback);
}

function getSnapshot(): Locale {
  return getStoredLocale();
}

function getServerSnapshot(): Locale {
  return DEFAULT_LOCALE;
}

export function useTranslation() {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setLocale = useCallback((newLocale: Locale) => {
    setStoredLocaleInternal(newLocale);
  }, []);

  const t = useCallback(
    (key: TranslationKey) => translateKey(key, locale),
    [locale]
  );

  return {
    locale,
    setLocale,
    t,
    locales: LOCALES,
  };
}
