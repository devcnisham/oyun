import type { Metadata } from 'next';
import { getSettings } from '@/lib/queries';
import ProfileScreen from './ProfileScreen';

export const metadata: Metadata = { title: 'Profile · OYUN' };

export default async function ProfilePage() {
  const s = await getSettings();
  return <ProfileScreen supportEmail={s.supportEmail} supportPhone={s.supportPhone} />;
}
