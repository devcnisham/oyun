import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  LOCALES,
  isValidLocale,
  getStoredLocale,
  setStoredLocale,
  t,
  TRANSLATIONS,
  LOCALE_STORAGE_KEY,
  LOCALE_COOKIE_KEY,
  LOCALE_EVENT,
} from './i18n';

describe('i18n localization module', () => {
  let store: Record<string, string> = {};
  let cookieStr = '';
  let eventDispatched: Event | null = null;

  beforeEach(() => {
    store = {};
    cookieStr = '';
    eventDispatched = null;

    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, val: string) => {
        store[key] = val;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    });

    vi.stubGlobal('document', {
      get cookie() {
        return cookieStr;
      },
      set cookie(val: string) {
        cookieStr = val;
      },
    });

    vi.stubGlobal('window', {
      dispatchEvent: (e: Event) => {
        eventDispatched = e;
        return true;
      },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('defines all 4 required locales: English, Kannada, Hindi, and Tulu', () => {
    const codes = LOCALES.map((l) => l.code);
    expect(codes).toContain('en');
    expect(codes).toContain('kn');
    expect(codes).toContain('hi');
    expect(codes).toContain('tcy');
    expect(LOCALES).toHaveLength(4);
  });

  it('validates locale codes correctly', () => {
    expect(isValidLocale('en')).toBe(true);
    expect(isValidLocale('kn')).toBe(true);
    expect(isValidLocale('hi')).toBe(true);
    expect(isValidLocale('tcy')).toBe(true);
    expect(isValidLocale('fr')).toBe(false);
    expect(isValidLocale('')).toBe(false);
    expect(isValidLocale(null)).toBe(false);
    expect(isValidLocale(undefined)).toBe(false);
  });

  it('translates strings for all supported languages', () => {
    // English
    expect(t('tagline', 'en')).toBe('Book · Play · Repeat');
    expect(t('nav_mangalore', 'en')).toBe('Mangalore');

    // Kannada (kn)
    expect(t('tagline', 'kn')).toBe('ಬುಕ್ ಮಾಡಿ · ಆಟವಾಡಿ · ಪುನರಾವರ್ತಿಸಿ');
    expect(t('nav_mangalore', 'kn')).toBe('ಮಂಗಳೂರು');
    expect(t('account_section', 'kn')).toBe('ಖಾತೆ');

    // Hindi (hi)
    expect(t('tagline', 'hi')).toBe('बुक करें · खेलें · दोहराएं');
    expect(t('nav_mangalore', 'hi')).toBe('मंगलौर');
    expect(t('account_section', 'hi')).toBe('खाता');

    // Tulu (tcy)
    expect(t('tagline', 'tcy')).toBe('ಬುಕ್ ಮಲ್ಪುಲೆ · ಗೊಬ್ಬುಲೆ · ಪಿರ ಮಲ್ಪುಲೆ');
    expect(t('nav_mangalore', 'tcy')).toBe('ಕುಡ್ಲ');
    expect(t('nav_hi', 'tcy')).toBe('ಸೊಲ್ಮೆಲು');
  });

  it('ensures all translation dictionaries contain the same keys', () => {
    const enKeys = Object.keys(TRANSLATIONS.en).sort();
    const knKeys = Object.keys(TRANSLATIONS.kn).sort();
    const hiKeys = Object.keys(TRANSLATIONS.hi).sort();
    const tcyKeys = Object.keys(TRANSLATIONS.tcy).sort();

    expect(knKeys).toEqual(enKeys);
    expect(hiKeys).toEqual(enKeys);
    expect(tcyKeys).toEqual(enKeys);
  });

  it('stores and retrieves selected locale in localStorage and cookies', () => {
    expect(getStoredLocale()).toBe('en');

    setStoredLocale('kn');
    expect(store[LOCALE_STORAGE_KEY]).toBe('kn');
    expect(cookieStr).toContain(`${LOCALE_COOKIE_KEY}=kn`);
    expect(getStoredLocale()).toBe('kn');
    expect(eventDispatched?.type).toBe(LOCALE_EVENT);
    expect((eventDispatched as CustomEvent).detail.locale).toBe('kn');
  });
});
