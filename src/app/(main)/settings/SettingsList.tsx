'use client';

import Link from 'next/link';
import { openConsentSettings } from '@/components/consent/consent';
import PrivacyDataControls from '@/components/PrivacyDataControls';
import LanguageSelector from '@/components/LanguageSelector';
import { useTranslation } from '@/lib/client/use-translation';
import styles from './Settings.module.css';

// Everything a player can change or look up about their OYUN experience, in one list
export default function SettingsList({ supportEmail }: { supportEmail: string }) {
  const { t } = useTranslation();

  return (
    <>
      <section className={styles.card}>
        <h2>{t('account_section')}</h2>
        <ul className={styles.rows}>
          <li><Link href="/profile"><span aria-hidden>👤</span><b>{t('profile_title')}</b><i>{t('profile_desc')}</i></Link></li>
          <li><Link href="/bookings"><span aria-hidden>🎟️</span><b>{t('bookings_title')}</b><i>{t('bookings_desc')}</i></Link></li>
          <li><Link href="/saved"><span aria-hidden>♡</span><b>{t('saved_title')}</b><i>{t('saved_desc')}</i></Link></li>
        </ul>
      </section>

      <section className={styles.card}>
        <h2>{t('preferences_section')}</h2>
        <ul className={styles.rows}>
          <li>
            <button type="button" onClick={openConsentSettings}>
              <span aria-hidden>🍪</span><b>{t('cookies_title')}</b><i>{t('cookies_desc')}</i>
            </button>
          </li>
          <li className={styles.static}>
            <span aria-hidden>🔔</span><b>{t('notifications_title')}</b><i>{t('notifications_desc')}</i>
          </li>
          <li className={styles.interactiveRow}>
            <span aria-hidden>🌐</span>
            <div className={styles.rowContent}>
              <b>{t('language_title')}</b>
              <i>{t('language_desc')}</i>
            </div>
            <LanguageSelector />
          </li>
        </ul>
      </section>

      <section className={styles.card}>
        <h2>{t('help_section')}</h2>
        <ul className={styles.rows}>
          <li><Link href="/help"><span aria-hidden>❓</span><b>{t('help_title')}</b><i>{t('help_desc')}</i></Link></li>
          <li><Link href="/privacy"><span aria-hidden>🔒</span><b>{t('privacy_title')}</b><i>{t('privacy_desc')}</i></Link></li>
          <li><Link href="/terms"><span aria-hidden>📄</span><b>{t('terms_title')}</b><i>{t('terms_desc')}</i></Link></li>
          <li><a href={`mailto:${supportEmail}`}><span aria-hidden>✉️</span><b>{t('email_support_title')}</b><i>{supportEmail}</i></a></li>
        </ul>
      </section>

      <section className={styles.card}>
        <h2>{t('dpdp_section')}</h2>
        <PrivacyDataControls />
      </section>

      <p className={styles.about}>{t('about_footer')}</p>
    </>
  );
}
