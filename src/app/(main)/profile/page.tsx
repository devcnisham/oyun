import type { Metadata } from 'next';
import { getSettings } from '@/modules/web/database/queries';
import ProfileScreen from './ProfileScreen';

export const metadata: Metadata = { title: 'Account', robots: { index: false, follow: true } };

export default async function ProfilePage() {
  const s = await getSettings();
  return <ProfileScreen supportEmail={s.supportEmail} />;
}
