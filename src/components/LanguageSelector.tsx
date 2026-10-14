'use client';

import { useTranslation } from '@/lib/client/use-translation';
import { Locale } from '@/lib/i18n';
import styles from './LanguageSelector.module.css';

export default function LanguageSelector() {
  const { locale, setLocale, locales } = useTranslation();

  return (
    <div className={styles.container}>
      <label htmlFor="language-select" className="sr-only">
        Select Language
      </label>
      <select
        id="language-select"
        className={styles.select}
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        aria-label="Select website language"
      >
        {locales.map((loc) => (
          <option key={loc.code} value={loc.code}>
            {loc.nativeName} ({loc.englishName})
          </option>
        ))}
      </select>
    </div>
  );
}
