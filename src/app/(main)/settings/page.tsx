import type { Metadata } from 'next';
import BackButton from '@/modules/web/frontend/BackButton';
import { getSettings } from '@/modules/web/database/queries';
import SettingsList from '@/modules/web/frontend/main/settings/SettingsList';
import styles from './Settings.module.css';

export const metadata: Metadata = { title: 'Settings', robots: { index: false, follow: true } };

export default async function SettingsPage() {
  const s = await getSettings();
  return (
    <div className={`container ${styles.page}`}>
      <BackButton fallback="/" />
      <h1 className={styles.title}>Settings</h1>
      <SettingsList supportEmail={s.supportEmail} />
    </div>
  );
}
